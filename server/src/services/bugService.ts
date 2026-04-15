import prisma from "../config/database.js";
import { calculateSeverity } from "./severityService.js";
import { findDuplicates } from "./duplicateService.js";
import type { CreateBugInput, BugSubmissionResponse } from "../models/types.js";

/**
 * Bug Service
 *
 * Orchestrates bug submission: severity calculation → duplicate detection → persistence.
 */
export async function submitBug(input: CreateBugInput): Promise<BugSubmissionResponse> {
  // 1. Calculate severity
  const severity = calculateSeverity(
    input.title,
    input.description,
    input.module,
    input.environment,
  );

  // 2. Detect duplicates
  const duplicates = await findDuplicates(input.title, input.description);

  // 3. Persist the bug report
  const bug = await prisma.bugReport.create({
    data: {
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

/**
 * Retrieve a single bug by ID.
 */
export async function getBugById(bugId: string) {
  return prisma.bugReport.findUnique({
    where: { id: bugId },
    include: { assignment: true },
  });
}

/**
 * List all bugs with optional status filter, ordered by creation date (newest first).
 */
export async function listBugs(status?: string) {
  return prisma.bugReport.findMany({
    where: status ? { status } : undefined,
    include: { assignment: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Update bug status (e.g., open → in_progress → resolved → closed).
 */
export async function updateBugStatus(bugId: string, status: string) {
  return prisma.bugReport.update({
    where: { id: bugId },
    data: { status },
  });
}
