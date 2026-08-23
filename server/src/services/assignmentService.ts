import prisma from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { recordEvent } from "./eventService.js";
import { notifyUser } from "./notificationService.js";
import type { AssignmentResult } from "../models/types.js";

const CLOSED_STATUSES = new Set(["resolved", "closed"]);
const MAX_CLAIM_ATTEMPTS = 3;

export interface AssignmentCandidate {
  id: string;
  name: string;
  expertise: string[];
  workload: number;
  maxCapacity: number;
  available: boolean;
}

interface AssigneeSelection {
  assignee: AssignmentCandidate;
  reason: string;
}

/**
 * Pure selection logic — no database access, so this is cheap to unit test
 * directly instead of only through the full assignment flow.
 *
 * Prefers an available, under-capacity engineer whose expertise matches the
 * bug's module, picking the one with the lowest current workload. Falls back
 * to any available, under-capacity engineer (regardless of expertise) if no
 * specialist is free. The caller is responsible for only passing in
 * engineers from the right organization.
 */
export function selectAssignee(
  engineers: AssignmentCandidate[],
  module: string,
): AssigneeSelection {
  const eligible = engineers
    .filter((e) => e.available && e.workload < e.maxCapacity)
    .sort((a, b) => a.workload - b.workload);

  const moduleKey = module.toLowerCase();
  const specialist = eligible.find((e) => e.expertise.includes(moduleKey));

  if (specialist) {
    return {
      assignee: specialist,
      reason: `${specialist.name} is a ${module} expert with the lowest workload (${specialist.workload}/${specialist.maxCapacity})`,
    };
  }

  const fallback = eligible[0];
  if (!fallback) {
    throw AppError.badRequest("No available engineers with capacity to take this bug");
  }

  return {
    assignee: fallback,
    reason: `No ${module} specialist available. ${fallback.name} assigned as fallback with lowest workload (${fallback.workload}/${fallback.maxCapacity})`,
  };
}

/** Internal signal: someone else claimed the engineer's last capacity slot between read and write. */
class WorkloadRaceError extends Error {}

/**
 * Atomically claim a bug for an engineer: increments workload only if it
 * still matches what we read a moment ago (optimistic concurrency), then
 * creates the assignment and marks the bug assigned — all in one transaction.
 *
 * Throws `WorkloadRaceError` if the engineer's workload changed underneath
 * us (caller should re-select and retry), or `AppError.conflict` if the bug
 * itself was assigned to someone else in the meantime.
 */
async function claimAssignment(
  bugId: string,
  assignee: AssignmentCandidate,
  reason: string,
): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      const claim = await tx.user.updateMany({
        where: { id: assignee.id, workload: assignee.workload },
        data: { workload: { increment: 1 } },
      });
      if (claim.count === 0) {
        throw new WorkloadRaceError();
      }

      await tx.assignment.create({ data: { bugId, userId: assignee.id, reason } });
      await tx.bugReport.update({ where: { id: bugId }, data: { status: "assigned" } });
    });
  } catch (err: any) {
    if (err instanceof WorkloadRaceError) throw err;
    // Unique constraint on Assignment.bugId — another request assigned this bug first.
    if (err?.code === "P2002") {
      throw AppError.conflict(`Bug "${bugId}" was just assigned by another request`);
    }
    throw err;
  }
}

/**
 * Loads a bug that's eligible to be assigned, scoped to the caller's
 * organization — a bug in someone else's org is treated as not found, not
 * as a permissions error, so its existence isn't leaked across organizations.
 */
async function loadAssignableBug(bugId: string, organizationId: string) {
  const bug = await prisma.bugReport.findFirst({
    where: { id: bugId, organizationId },
    include: { assignment: true },
  });

  if (!bug) {
    throw AppError.notFound(`Bug with ID "${bugId}" not found`);
  }
  if (bug.assignment) {
    throw AppError.conflict(`Bug "${bugId}" is already assigned to user "${bug.assignment.userId}"`);
  }
  if (CLOSED_STATUSES.has(bug.status)) {
    throw AppError.badRequest(`Cannot assign a bug that is already "${bug.status}"`);
  }

  return bug;
}

/** Records the "assigned" event and notifies the assignee — shared by both assignment paths. */
async function announceAssignment(
  bugId: string,
  bugTitle: string,
  actorId: string,
  assignee: AssignmentCandidate,
  reason: string,
): Promise<void> {
  await recordEvent({ bugId, actorId, type: "assigned", assigneeId: assignee.id, reason });
  if (assignee.id !== actorId) {
    await notifyUser(assignee.id, bugId, "bug_assigned", `You were assigned "${bugTitle}"`);
  }
}

/**
 * Assign a bug to the best-fit engineer, per the rules in `selectAssignee`.
 * Retries a handful of times if two assignments race for the same engineer's
 * last capacity slot. Both the bug and the candidate engineers are scoped to
 * the caller's organization.
 */
export async function assignBug(bugId: string, organizationId: string, actorId: string): Promise<AssignmentResult> {
  const bug = await loadAssignableBug(bugId, organizationId);

  for (let attempt = 1; attempt <= MAX_CLAIM_ATTEMPTS; attempt++) {
    const engineers = await prisma.user.findMany({ where: { role: "engineer", organizationId } });
    const { assignee, reason } = selectAssignee(engineers, bug.module);

    try {
      await claimAssignment(bugId, assignee, reason);
      await announceAssignment(bugId, bug.title, actorId, assignee, reason);
      return { assignedTo: assignee.id, engineerName: assignee.name, reason };
    } catch (err) {
      if (err instanceof WorkloadRaceError && attempt < MAX_CLAIM_ATTEMPTS) {
        continue; // workloads moved under us — re-read and re-select
      }
      if (err instanceof WorkloadRaceError) {
        throw AppError.conflict("Could not assign this bug — engineer workloads kept changing. Please try again.");
      }
      throw err;
    }
  }

  // Unreachable — the loop above always returns or throws — but keeps TypeScript happy.
  throw AppError.conflict("Could not assign this bug. Please try again.");
}

/**
 * Assign a bug to a specific engineer chosen by a triage lead, instead of
 * letting the matching algorithm pick. Still enforces availability and
 * capacity — a lead can choose *who*, not bypass *whether they have room*.
 * The engineer must belong to the same organization as the bug; if not,
 * this is treated as "engineer not found" rather than a permissions error.
 */
export async function assignBugToEngineer(
  bugId: string,
  engineerId: string,
  organizationId: string,
  actorId: string,
): Promise<AssignmentResult> {
  const bug = await loadAssignableBug(bugId, organizationId);

  const engineer = await prisma.user.findFirst({ where: { id: engineerId, organizationId } });
  if (!engineer) {
    throw AppError.notFound(`Engineer with ID "${engineerId}" not found`);
  }
  if (!engineer.available) {
    throw AppError.badRequest(`${engineer.name} is marked unavailable`);
  }
  if (engineer.workload >= engineer.maxCapacity) {
    throw AppError.badRequest(`${engineer.name} is already at capacity (${engineer.workload}/${engineer.maxCapacity})`);
  }

  const reason = `Manually assigned to ${engineer.name} by a triage lead`;

  for (let attempt = 1; attempt <= MAX_CLAIM_ATTEMPTS; attempt++) {
    const fresh = attempt === 1 ? engineer : await prisma.user.findUniqueOrThrow({ where: { id: engineerId } });
    if (fresh.workload >= fresh.maxCapacity) {
      throw AppError.badRequest(`${fresh.name} reached capacity (${fresh.workload}/${fresh.maxCapacity}) before the assignment could be made`);
    }

    try {
      await claimAssignment(bugId, fresh, reason);
      await announceAssignment(bugId, bug.title, actorId, fresh, reason);
      return { assignedTo: fresh.id, engineerName: fresh.name, reason };
    } catch (err) {
      if (err instanceof WorkloadRaceError && attempt < MAX_CLAIM_ATTEMPTS) {
        continue;
      }
      if (err instanceof WorkloadRaceError) {
        throw AppError.conflict("Could not assign this bug — the engineer's workload kept changing. Please try again.");
      }
      throw err;
    }
  }

  throw AppError.conflict("Could not assign this bug. Please try again.");
}

/**
 * Unassign a bug and decrement the engineer's workload. Scoped to the
 * caller's organization via the bug the assignment points to (`Assignment`
 * rows don't carry their own organizationId — they're always looked up
 * through a bug, which is org-scoped).
 */
export async function unassignBug(bugId: string, organizationId: string, actorId: string): Promise<void> {
  const assignment = await prisma.assignment.findUnique({
    where: { bugId },
    include: { bug: { select: { organizationId: true } } },
  });

  if (!assignment || assignment.bug.organizationId !== organizationId) {
    throw AppError.notFound(`No assignment found for bug "${bugId}"`);
  }

  await prisma.$transaction([
    prisma.assignment.delete({ where: { bugId } }),
    prisma.user.update({
      where: { id: assignment.userId },
      data: { workload: { decrement: 1 } },
    }),
    prisma.bugReport.update({
      where: { id: bugId },
      data: { status: "open" },
    }),
  ]);

  await recordEvent({ bugId, actorId, type: "unassigned", assigneeId: assignment.userId });
}
