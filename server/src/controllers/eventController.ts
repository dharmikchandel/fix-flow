import type { Request, Response } from "express";
import * as eventService from "../services/eventService.js";
import { notifyUser } from "../services/notificationService.js";

/**
 * GET /bugs/:id/events — the full timeline (system events + comments) for a bug
 */
export async function listEvents(req: Request, res: Response): Promise<void> {
  const events = await eventService.listEvents(String(req.params["id"]), req.user!.organizationId);
  res.json({ success: true, data: events });
}

/**
 * POST /bugs/:id/comments — add a comment to a bug's timeline
 */
export async function addComment(req: Request, res: Response): Promise<void> {
  const { body } = req.body;
  const { event, bug } = await eventService.addComment(
    String(req.params["id"]),
    req.user!.organizationId,
    req.user!.id,
    body,
  );

  if (bug.reporterId && bug.reporterId !== req.user!.id) {
    await notifyUser(bug.reporterId, bug.id, "comment_on_your_bug", `New comment on "${bug.title}"`);
  }

  res.status(201).json({ success: true, data: event });
}
