import prisma from "../config/database.js";
import { AppError } from "../utils/AppError.js";

export const EVENT_TYPES = ["created", "status_changed", "assigned", "unassigned", "comment"] as const;
export type BugEventType = (typeof EVENT_TYPES)[number];

const ACTOR_SELECT = { select: { id: true, name: true } } as const;

const EVENT_INCLUDE = {
  actor: ACTOR_SELECT,
  assignee: ACTOR_SELECT,
} as const;

interface RecordEventInput {
  bugId: string;
  actorId?: string | null;
  type: BugEventType;
  comment?: string;
  fromStatus?: string;
  toStatus?: string;
  assigneeId?: string;
  reason?: string;
}

/**
 * Appends one entry to a bug's timeline. Called from `bugService` and
 * `assignmentService` right after the action it describes succeeds — never
 * the other way around, so a failed action never leaves a stray event behind.
 */
export async function recordEvent(input: RecordEventInput) {
  return prisma.bugEvent.create({
    data: {
      bugId: input.bugId,
      actorId: input.actorId ?? null,
      type: input.type,
      comment: input.comment,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      assigneeId: input.assigneeId,
      reason: input.reason,
    },
  });
}

/**
 * The full timeline for one bug — system events and comments together, in
 * the order they happened. Scoped to the caller's organization via the bug.
 */
export async function listEvents(bugId: string, organizationId: string) {
  const bug = await prisma.bugReport.findFirst({ where: { id: bugId, organizationId } });
  if (!bug) {
    throw AppError.notFound("Bug not found");
  }

  return prisma.bugEvent.findMany({
    where: { bugId },
    include: EVENT_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
}

const MAX_COMMENT_LENGTH = 3000;

export async function addComment(bugId: string, organizationId: string, actorId: string, body: string) {
  const bug = await prisma.bugReport.findFirst({ where: { id: bugId, organizationId } });
  if (!bug) {
    throw AppError.notFound("Bug not found");
  }

  const trimmed = body.trim();
  if (!trimmed) {
    throw AppError.badRequest("Comment can't be empty");
  }
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    throw AppError.badRequest(`Comment must not exceed ${MAX_COMMENT_LENGTH} characters`);
  }

  const event = await prisma.bugEvent.create({
    data: { bugId, actorId, type: "comment", comment: trimmed },
    include: EVENT_INCLUDE,
  });

  return { event, bug };
}
