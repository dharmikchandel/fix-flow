import prisma from "../config/database.js";
import { AppError } from "../utils/AppError.js";

/**
 * Attachment Service
 *
 * Files (screenshots, log excerpts) attached to a bug report. Stored
 * directly in Postgres as bytes — no S3/R2/cloud storage is configured for
 * this project, and adding one would mean asking for credentials this
 * environment doesn't have. This is a deliberate, disclosed tradeoff: fine
 * for a demo or small team, not the design a production version at scale
 * would use. See the Phase 4 report.
 */

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_FILES_PER_BUG = 5;

export const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

const METADATA_SELECT = {
  id: true,
  fileName: true,
  mimeType: true,
  sizeBytes: true,
  createdAt: true,
  uploadedBy: { select: { id: true, name: true } },
} as const;

export interface UploadAttachmentInput {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export async function uploadAttachment(
  bugId: string,
  organizationId: string,
  uploadedById: string,
  file: UploadAttachmentInput,
) {
  const bug = await prisma.bugReport.findFirst({ where: { id: bugId, organizationId } });
  if (!bug) {
    throw AppError.notFound("Bug not found");
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimeType)) {
    throw AppError.badRequest(`Unsupported file type "${file.mimeType}". Allowed: images, PDF, or plain text.`);
  }
  if (file.buffer.length > MAX_FILE_SIZE_BYTES) {
    throw AppError.badRequest(`File exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit`);
  }

  const existingCount = await prisma.attachment.count({ where: { bugId } });
  if (existingCount >= MAX_FILES_PER_BUG) {
    throw AppError.badRequest(`A bug can have at most ${MAX_FILES_PER_BUG} attachments`);
  }

  return prisma.attachment.create({
    data: {
      bugId,
      uploadedById,
      fileName: file.fileName,
      mimeType: file.mimeType,
      sizeBytes: file.buffer.length,
      // Prisma's `Bytes` field wants a plain Uint8Array<ArrayBuffer>; a
      // Node Buffer is technically typed as possibly SharedArrayBuffer-backed.
      data: new Uint8Array(file.buffer),
    },
    select: METADATA_SELECT,
  });
}

export async function listAttachments(bugId: string, organizationId: string) {
  const bug = await prisma.bugReport.findFirst({ where: { id: bugId, organizationId } });
  if (!bug) {
    throw AppError.notFound("Bug not found");
  }

  return prisma.attachment.findMany({
    where: { bugId },
    select: METADATA_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

/** Includes the file bytes — only ever used for the download endpoint. */
export async function getAttachmentFile(attachmentId: string, organizationId: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: { bug: { select: { organizationId: true } } },
  });

  if (!attachment || attachment.bug.organizationId !== organizationId) {
    throw AppError.notFound("Attachment not found");
  }

  return attachment;
}

const MANAGEMENT_ROLES = ["lead", "manager"];

export async function deleteAttachment(
  attachmentId: string,
  organizationId: string,
  actorId: string,
  actorRole: string,
): Promise<void> {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: { bug: { select: { organizationId: true } } },
  });

  if (!attachment || attachment.bug.organizationId !== organizationId) {
    throw AppError.notFound("Attachment not found");
  }

  const isUploader = attachment.uploadedById === actorId;
  const isManagement = MANAGEMENT_ROLES.includes(actorRole);
  if (!isUploader && !isManagement) {
    throw AppError.forbidden("You can only remove attachments you uploaded");
  }

  await prisma.attachment.delete({ where: { id: attachmentId } });
}
