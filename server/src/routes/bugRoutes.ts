import { Router } from "express";
import { submitBug, listBugs, getBug, updateStatus } from "../controllers/bugController.js";
import { listEvents, addComment } from "../controllers/eventController.js";
import { uploadAttachment, listAttachments } from "../controllers/attachmentController.js";
import { validate } from "../utils/validate.js";
import { createBugSchema, updateBugStatusSchema, addCommentSchema } from "../models/validators.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadSingleFile } from "../middleware/upload.js";

const router = Router();
router.use(requireAuth);

router.post("/", validate(createBugSchema), submitBug);
router.get("/", listBugs);
router.get("/:id", getBug);
router.patch("/:id/status", validate(updateBugStatusSchema), updateStatus);

router.get("/:id/events", listEvents);
router.post("/:id/comments", validate(addCommentSchema), addComment);

router.post("/:id/attachments", uploadSingleFile, uploadAttachment);
router.get("/:id/attachments", listAttachments);

export default router;
