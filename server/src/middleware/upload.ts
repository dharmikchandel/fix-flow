import multer from "multer";
import { MAX_FILE_SIZE_BYTES } from "../services/attachmentService.js";

/**
 * Buffers the uploaded file in memory (never touches disk) and caps its size
 * at the parsing layer, before any of our own validation runs — so an
 * oversized upload gets rejected while it's still streaming in, not after
 * it's fully buffered. Mime-type and per-bug count limits are enforced in
 * `attachmentService`, not here, so there's one place that decides what's allowed.
 */
export const uploadSingleFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).single("file");
