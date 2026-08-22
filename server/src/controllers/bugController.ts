import type { Request, Response } from "express";
import * as bugService from "../services/bugService.js";
import { AppError } from "../utils/AppError.js";
import type { CreateBugInput, ApiResponse, BugSubmissionResponse } from "../models/types.js";

/**
 * POST /bugs — Submit a new bug report
 */
export async function submitBug(req: Request, res: Response): Promise<void> {
  const input: CreateBugInput = req.body;
  const result = await bugService.submitBug(input);

  const response: ApiResponse<BugSubmissionResponse> = {
    success: true,
    data: result,
  };

  res.status(201).json(response);
}

/**
 * GET /bugs — List all bugs (optional ?status= filter)
 */
export async function listBugs(req: Request, res: Response): Promise<void> {
  const status = req.query["status"] as string | undefined;
  const bugs = await bugService.listBugs(status);

  res.json({ success: true, data: bugs });
}

/**
 * GET /bugs/:id — Get a single bug by ID
 */
export async function getBug(req: Request, res: Response): Promise<void> {
  const bug = await bugService.getBugById(String(req.params["id"]));

  if (!bug) {
    throw AppError.notFound("Bug not found");
  }

  res.json({ success: true, data: bug });
}

/**
 * PATCH /bugs/:id/status — Update bug status
 */
export async function updateStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body;
  const bug = await bugService.updateBugStatus(String(req.params["id"]), status);
  res.json({ success: true, data: bug });
}
