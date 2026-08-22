import prisma from "../config/database.js";
import { calculateSeverity } from "./severityService.js";
import { findDuplicates } from "./duplicateService.js";
import { AppError } from "../utils/AppError.js";
import type { CreateBugInput, BugSubmissionResponse } from "../models/types.js";

/**
 * Bug Service
 *
 * Orchestrates bug submission: severity calculation → duplicate detection → persistence.
 * Every read and write here is scoped to one organization — `organizationId`
 * always comes from the authenticated caller's session, never from request input.
 */
export async function submitBug(
  input: CreateBugInput,
  organizationId: string,
  reporterId: string,
): Promise<BugSubmissionResponse> {
  // 1. Calculate severity
  const severity = calculateSeverity(
    input.title,
    input.description,
    input.module,
    input.environment,
  );

  // 2. Detect duplicates — only among this organization's own bugs
  const duplicates = await findDuplicates(input.title, input.description, organizationId);

  // 3. Persist the bug report
  const bug = await prisma.bugReport.create({
    data: {
      organizationId,
      reporterId,
      title: input.title,
      description: input.description,
      stepsToReproduce: input.stepsToReproduce ?? null,
      module: input.module,
      environment: input.environment ?? null,
      severityScore: severity.score,
      severityLabel: severity.label,
      status: "open",
    },
  });

  return {
    bugId: bug.id,
    severity,
    duplicates,
  };
}

/** Shared include: pulls the assignee's profile alongside the assignment row. */
const WITH_ASSIGNEE = {
  assignment: {
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  },
} as const;

/**
 * Retrieve a single bug by ID, if it belongs to the caller's organization.
 */
export async function getBugById(bugId: string, organizationId: string) {
  return prisma.bugReport.findFirst({
    where: { id: bugId, organizationId },
    include: WITH_ASSIGNEE,
  });
}

/**
 * List all bugs in the caller's organization, with optional status filter,
 * ordered by creation date (newest first).
 */
export async function listBugs(status: string | undefined, organizationId: string) {
  return prisma.bugReport.findMany({
    where: { organizationId, ...(status ? { status } : {}) },
    include: WITH_ASSIGNEE,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Update bug status (e.g., open → in_progress → resolved → closed).
 */
export async function updateBugStatus(bugId: string, status: string, organizationId: string) {
  const bug = await prisma.bugReport.findFirst({ where: { id: bugId, organizationId } });
  if (!bug) {
    throw AppError.notFound(`Bug with ID "${bugId}" not found`);
  }

  return prisma.bugReport.update({
    where: { id: bugId },
    data: { status },
  });
}
