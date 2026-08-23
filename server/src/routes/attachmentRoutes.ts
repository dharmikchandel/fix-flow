import { Router } from "express";
import { downloadAttachment, deleteAttachment } from "../controllers/attachmentController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/:attachmentId", downloadAttachment);
router.delete("/:attachmentId", deleteAttachment);

export default router;
