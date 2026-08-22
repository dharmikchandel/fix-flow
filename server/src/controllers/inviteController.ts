import type { Request, Response } from "express";
import * as inviteService from "../services/inviteService.js";

/**
 * POST /invites — create an invite link for a new teammate
 */
export async function createInvite(req: Request, res: Response): Promise<void> {
  const invite = await inviteService.createInvite(req.user!.organizationId, req.user!.id, req.body);
  res.status(201).json({ success: true, data: invite });
}

/**
 * GET /invites — list pending invites for the caller's organization
 */
export async function listInvites(req: Request, res: Response): Promise<void> {
  const invites = await inviteService.listPendingInvites(req.user!.organizationId);
  res.json({ success: true, data: invites });
}

/**
 * DELETE /invites/:id — revoke a pending invite
 */
export async function revokeInvite(req: Request, res: Response): Promise<void> {
  await inviteService.revokeInvite(req.user!.organizationId, String(req.params["id"]));
  res.json({ success: true, data: { message: "Invite revoked" } });
}

/**
 * POST /invites/accept — the invited person sets a name + password and joins
 */
export async function acceptInvite(req: Request, res: Response): Promise<void> {
  const { token, name, password } = req.body;
  const result = await inviteService.acceptInvite(token, name, password);
  res.json({ success: true, data: result });
}
