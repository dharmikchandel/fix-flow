import { Router } from "express";
import { assignBug, unassignBug } from "../controllers/assignmentController.js";
import { validate } from "../utils/validate.js";
import { assignBugSchema } from "../models/validators.js";

const router = Router();

router.post("/", validate(assignBugSchema), assignBug);
router.delete("/:bugId", unassignBug);

export default router;
