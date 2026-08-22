import { Router } from "express";
import {
  createUser,
  listUsers,
  getUser,
  toggleAvailability,
} from "../controllers/userController.js";
import { validate } from "../utils/validate.js";
import { createUserSchema, toggleAvailabilitySchema } from "../models/validators.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Only a lead/manager can register a new engineer account.
router.post("/", requireRole("lead", "manager"), validate(createUserSchema), createUser);
router.get("/", listUsers);
router.get("/:id", getUser);
// Toggling availability is allowed for the engineer themself or a lead/manager
// — enforced inside the controller, since it depends on comparing the target
// user's ID to the logged-in user's ID, not just their role.
router.patch("/:id/availability", validate(toggleAvailabilitySchema), toggleAvailability);

export default router;
