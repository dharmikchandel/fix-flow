import type { Request, Response } from "express";
import * as attachmentService from "../services/attachmentService.js";
import { AppError } from "../utils/AppError.js";

/**
 * POST /bugs/:id/attachments — Upload a file (expects multipart field "file")
 */
export async function uploadAttachment(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    throw AppError.badRequest("No file uploaded — attach it under the \"file\" field");
  }

  const attachment = await attachmentService.uploadAttachment(
    String(req.params["id"]),
    req.user!.organizationId,
    req.user!.id,
    { fileName: file.originalname, mimeType: file.mimetype, buffer: file.buffer },
  );

  res.status(201).json({ success: true, data: attachment });
}

/**
 * GET /bugs/:id/attachments — List attachment metadata for a bug
 */
export async function listAttachments(req: Request, res: Response): Promise<void> {
  const attachments = await attachmentService.listAttachments(String(req.params["id"]), req.user!.organizationId);
  res.json({ success: true, data: attachments });
}

/**
 * GET /attachments/:attachmentId — Download the actual file
 */
export async function downloadAttachment(req: Request, res: Response): Promise<void> {
  const attachment = await attachmentService.getAttachmentFile(
    String(req.params["attachmentId"]),
    req.user!.organizationId,
  );

  res.setHeader("Content-Type", attachment.mimeType);
  // `attachment` (not `inline`) so the browser always downloads/prompts
  // instead of rendering it — the one thing that matters for user-uploaded
  // content, since an inline HTML or SVG file could otherwise execute script
  // in the context of this site.
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(attachment.fileName)}"`);
  res.setHeader("Content-Length", attachment.sizeBytes.toString());
  res.send(attachment.data);
}

/**
 * DELETE /attachments/:attachmentId
 */
export async function deleteAttachment(req: Request, res: Response): Promise<void> {
  await attachmentService.deleteAttachment(
    String(req.params["attachmentId"]),
    req.user!.organizationId,
    req.user!.id,
    req.user!.role,
  );
  res.json({ success: true, data: { message: "Attachment removed" } });
}
