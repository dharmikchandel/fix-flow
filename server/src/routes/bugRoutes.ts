import { Router } from "express";
import { submitBug, listBugs, getBug, updateStatus } from "../controllers/bugController.js";
import { validate } from "../utils/validate.js";
import { createBugSchema, updateBugStatusSchema } from "../models/validators.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/", validate(createBugSchema), submitBug);
router.get("/", listBugs);
router.get("/:id", getBug);
router.patch("/:id/status", validate(updateBugStatusSchema), updateStatus);

export default router;
