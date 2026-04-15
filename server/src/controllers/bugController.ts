import type { Request, Response } from "express";
import * as bugService from "../services/bugService.js";
import type { CreateBugInput, ApiResponse, BugSubmissionResponse } from "../models/types.js";

/**
 * POST /bugs — Submit a new bug report
 */
export async function submitBug(req: Request, res: Response): Promise<void> {
  try {
    const input: CreateBugInput = req.body;
    const result = await bugService.submitBug(input);

    const response: ApiResponse<BugSubmissionResponse> = {
      success: true,
      data: result,
    };

    res.status(201).json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit bug";
    const response: ApiResponse<null> = { success: false, error: message };
    res.status(500).json(response);
  }
}

/**
 * GET /bugs — List all bugs (optional ?status= filter)
 */
export async function listBugs(req: Request, res: Response): Promise<void> {
  try {
    const status = req.query["status"] as string | undefined;
    const bugs = await bugService.listBugs(status);

    res.json({ success: true, data: bugs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list bugs";
    res.status(500).json({ success: false, error: message });
  }
}

/**
 * GET /bugs/:id — Get a single bug by ID
 */
export async function getBug(req: Request, res: Response): Promise<void> {
  try {
    const bug = await bugService.getBugById(String(req.params["id"]));

    if (!bug) {
      res.status(404).json({ success: false, error: "Bug not found" });
      return;
    }

    res.json({ success: true, data: bug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get bug";
    res.status(500).json({ success: false, error: message });
  }
}

/**
 * PATCH /bugs/:id/status — Update bug status
 */
export async function updateStatus(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.body;
    if (!status || typeof status !== "string") {
      res.status(400).json({ success: false, error: "Status is required" });
      return;
    }

    const validStatuses = ["open", "assigned", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
      return;
    }

    const bug = await bugService.updateBugStatus(String(req.params["id"]), status);
    res.json({ success: true, data: bug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update status";
    res.status(500).json({ success: false, error: message });
  }
}
