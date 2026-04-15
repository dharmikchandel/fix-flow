import prisma from "../config/database.js";
import type { AssignmentResult, EngineerProfile } from "../models/types.js";

/**
 * Assignment Service
 *
 * Implements the assignment logic from the PRD:
 *   1. Filter engineers by expertise matching the bug's module
 *   2. Filter by availability and capacity
 *   3. Sort by current workload (ascending)
 *   4. Assign to the engineer with the lowest workload
 */
export async function assignBug(bugId: string): Promise<AssignmentResult> {
  // 1. Fetch the bug to get its module
  const bug = await prisma.bugReport.findUnique({
    where: { id: bugId },
    include: { assignment: true },
  });

  if (!bug) {
    throw new Error(`Bug with ID "${bugId}" not found`);
  }

  if (bug.assignment) {
    throw new Error(`Bug "${bugId}" is already assigned to user "${bug.assignment.userId}"`);
  }

  // 2. Find eligible engineers: matching expertise, available, under capacity
  const eligibleEngineers = await prisma.user.findMany({
    where: {
      role: "engineer",
      available: true,
      expertise: { has: bug.module.toLowerCase() },
      workload: { lt: prisma.user.fields.maxCapacity } as any, // will use raw comparison below
    },
    orderBy: { workload: "asc" },
  });

  // Prisma doesn't support field-to-field comparisons in `where`, so filter in-app
  const candidates = eligibleEngineers.filter((e: typeof eligibleEngineers[number]) => e.workload < e.maxCapacity);

  // 3. If no specialist is available, fall back to any available engineer under capacity
  let assignee: EngineerProfile | null = null;
  let reason = "";

  if (candidates.length > 0) {
    const best = candidates[0]!;
    assignee = toProfile(best);
    reason = `${best.name} is a ${bug.module} expert with the lowest workload (${best.workload}/${best.maxCapacity})`;
  } else {
    // Fallback: any available engineer under capacity, sorted by workload
    const fallbackEngineers = await prisma.user.findMany({
      where: {
        role: "engineer",
        available: true,
      },
      orderBy: { workload: "asc" },
    });

    const fallback = fallbackEngineers.find((e: typeof fallbackEngineers[number]) => e.workload < e.maxCapacity);

    if (!fallback) {
      throw new Error("No available engineers with capacity to take this bug");
    }

    assignee = toProfile(fallback);
    reason = `No ${bug.module} specialist available. ${fallback.name} assigned as fallback with lowest workload (${fallback.workload}/${fallback.maxCapacity})`;
  }

  // 4. Create assignment and increment engineer workload (transaction)
  await prisma.$transaction([
    prisma.assignment.create({
      data: {
        bugId,
        userId: assignee.id,
        reason,
      },
    }),
    prisma.user.update({
      where: { id: assignee.id },
      data: { workload: { increment: 1 } },
    }),
    prisma.bugReport.update({
      where: { id: bugId },
      data: { status: "assigned" },
    }),
  ]);

  return {
    assignedTo: assignee.id,
    engineerName: assignee.name,
    reason,
  };
}

/**
 * Unassign a bug and decrement the engineer's workload.
 */
export async function unassignBug(bugId: string): Promise<void> {
  const assignment = await prisma.assignment.findUnique({
    where: { bugId },
  });

  if (!assignment) {
    throw new Error(`No assignment found for bug "${bugId}"`);
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
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toProfile(user: {
  id: string;
  name: string;
  expertise: string[];
  workload: number;
  maxCapacity: number;
  available: boolean;
}): EngineerProfile {
  return {
    id: user.id,
    name: user.name,
    expertise: user.expertise,
    workload: user.workload,
    maxCapacity: user.maxCapacity,
    available: user.available,
  };
}
