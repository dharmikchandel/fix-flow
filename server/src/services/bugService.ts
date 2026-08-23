import prisma from "../config/database.js";
import { calculateSeverity } from "./severityService.js";
import { findDuplicates } from "./duplicateService.js";
import { recordEvent } from "./eventService.js";
import { notifyManagers, notifyUser } from "./notificationService.js";
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

  await recordEvent({ bugId: bug.id, actorId: reporterId, type: "created" });

  if (severity.label === "Critical") {
    await notifyManagers(
      organizationId,
      reporterId,
      bug.id,
      "critical_bug",
      `Critical bug reported: "${bug.title}"`,
    );
  }

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

export interface ListBugsOptions {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedBugs {
  bugs: Awaited<ReturnType<typeof getBugById>>[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * List bugs in the caller's organization, newest first — optionally
 * filtered by status and/or a free-text search over title and module, and
 * always paginated so this stays fast as bug counts grow.
 */
export async function listBugs(organizationId: string, options: ListBugsOptions = {}): Promise<PaginatedBugs> {
  const page = Math.max(options.page ?? 1, 1);
  const pageSize = Math.min(Math.max(options.pageSize ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const search = options.search?.trim();

  const where = {
    organizationId,
    ...(options.status ? { status: options.status } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { module: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [bugs, total] = await Promise.all([
    prisma.bugReport.findMany({
      where,
      include: WITH_ASSIGNEE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.bugReport.count({ where }),
  ]);

  return { bugs, total, page, pageSize };
}

/**
 * Update bug status (e.g., open → in_progress → resolved → closed).
 */
export async function updateBugStatus(bugId: string, status: string, organizationId: string, actorId: string) {
  const bug = await prisma.bugReport.findFirst({ where: { id: bugId, organizationId } });
  if (!bug) {
    throw AppError.notFound(`Bug with ID "${bugId}" not found`);
  }

  const updated = await prisma.bugReport.update({
    where: { id: bugId },
    data: { status },
  });

  await recordEvent({
    bugId,
    actorId,
    type: "status_changed",
    fromStatus: bug.status,
    toStatus: status,
  });

  if (bug.reporterId && bug.reporterId !== actorId) {
    await notifyUser(
      bug.reporterId,
      bugId,
      "status_changed_on_your_bug",
      `"${bug.title}" changed to ${status.replace("_", " ")}`,
    );
  }

  return updated;
}
