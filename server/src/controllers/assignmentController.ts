import type { Request, Response } from "express";
import * as assignmentService from "../services/assignmentService.js";
import type { ApiResponse, AssignmentResult } from "../models/types.js";

/**
 * POST /assign — Assign a bug to the best-fit engineer
 */
export async function assignBug(req: Request, res: Response): Promise<void> {
  try {
    const { bugId } = req.body;
    const result = await assignmentService.assignBug(bugId);

    const response: ApiResponse<AssignmentResult> = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assignment failed";
    const status = message.includes("not found") ? 404 : 400;
    res.status(status).json({ success: false, error: message });
  }
}

/**
 * DELETE /assign/:bugId — Unassign a bug
 */
export async function unassignBug(req: Request, res: Response): Promise<void> {
  try {
    await assignmentService.unassignBug(String(req.params["bugId"]));
    res.json({ success: true, data: { message: "Bug unassigned successfully" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unassignment failed";
    const status = message.includes("not found") ? 404 : 400;
    res.status(status).json({ success: false, error: message });
  }
}
