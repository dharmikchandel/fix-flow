import { Router } from "express";
import { submitBug, listBugs, getBug, updateStatus } from "../controllers/bugController.js";
import { validate } from "../utils/validate.js";
import { createBugSchema } from "../models/validators.js";

const router = Router();

router.post("/", validate(createBugSchema), submitBug);
router.get("/", listBugs);
router.get("/:id", getBug);
router.patch("/:id/status", updateStatus);

export default router;
