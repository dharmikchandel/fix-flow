import { Router } from "express";
import { assignBug, assignBugManually, unassignBug } from "../controllers/assignmentController.js";
import { validate } from "../utils/validate.js";
import { assignBugSchema, manualAssignSchema } from "../models/validators.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
// Dispatching bugs is a triage decision — restricted to leads/managers,
// not something any individual engineer can do to themself or a peer.
router.use(requireAuth, requireRole("lead", "manager"));

router.post("/", validate(assignBugSchema), assignBug);
router.post("/manual", validate(manualAssignSchema), assignBugManually);
router.delete("/:bugId", unassignBug);

export default router;
