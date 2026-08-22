import { Router } from "express";
import { assignBug, assignBugManually, unassignBug } from "../controllers/assignmentController.js";
import { validate } from "../utils/validate.js";
import { assignBugSchema, manualAssignSchema } from "../models/validators.js";

const router = Router();

router.post("/", validate(assignBugSchema), assignBug);
router.post("/manual", validate(manualAssignSchema), assignBugManually);
router.delete("/:bugId", unassignBug);

export default router;
