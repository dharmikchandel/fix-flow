import type { Request, Response } from "express";
import * as analyticsService from "../services/analyticsService.js";

/**
 * GET /analytics
 */
export async function getAnalytics(req: Request, res: Response): Promise<void> {
  const result = await analyticsService.getAnalytics(req.user!.organizationId);
  res.json({ success: true, data: result });
}
