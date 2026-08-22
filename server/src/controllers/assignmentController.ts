import type { Request, Response } from "express";
import * as assignmentService from "../services/assignmentService.js";
import type { ApiResponse, AssignmentResult } from "../models/types.js";

/**
 * POST /assign — Assign a bug to the best-fit engineer, picked automatically
 */
export async function assignBug(req: Request, res: Response): Promise<void> {
  const { bugId } = req.body;
  const result = await assignmentService.assignBug(bugId);

  const response: ApiResponse<AssignmentResult> = { success: true, data: result };
  res.status(200).json(response);
}

/**
 * POST /assign/manual — Assign a bug to a specific engineer chosen by a triage lead
 */
export async function assignBugManually(req: Request, res: Response): Promise<void> {
  const { bugId, engineerId } = req.body;
  const result = await assignmentService.assignBugToEngineer(bugId, engineerId);

  const response: ApiResponse<AssignmentResult> = { success: true, data: result };
  res.status(200).json(response);
}

/**
 * DELETE /assign/:bugId — Unassign a bug
 */
export async function unassignBug(req: Request, res: Response): Promise<void> {
  await assignmentService.unassignBug(String(req.params["bugId"]));
  res.json({ success: true, data: { message: "Bug unassigned successfully" } });
}
