import type { Request, Response } from "express";
import * as priorityService from "../services/priorityService.js";
import type { ApiResponse, PriorityItem } from "../models/types.js";

/**
 * GET /priority — Generate and return the current priority queue
 */
export async function getPriorityQueue(_req: Request, res: Response): Promise<void> {
  try {
    const queue = await priorityService.generatePriorityQueue();

    const response: ApiResponse<PriorityItem[]> = {
      success: true,
      data: queue,
    };

    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate priority queue";
    res.status(500).json({ success: false, error: message });
  }
}
