import type { Request, Response } from "express";
import * as notificationService from "../services/notificationService.js";

/**
 * GET /notifications — recent notifications for the logged-in user, plus an unread count
 */
export async function listNotifications(req: Request, res: Response): Promise<void> {
  const result = await notificationService.listNotifications(req.user!.id);
  res.json({ success: true, data: result });
}

/**
 * PATCH /notifications/:id/read
 */
export async function markRead(req: Request, res: Response): Promise<void> {
  const notification = await notificationService.markRead(String(req.params["id"]), req.user!.id);
  res.json({ success: true, data: notification });
}

/**
 * POST /notifications/read-all
 */
export async function markAllRead(req: Request, res: Response): Promise<void> {
  await notificationService.markAllRead(req.user!.id);
  res.json({ success: true, data: { message: "All notifications marked read" } });
}
