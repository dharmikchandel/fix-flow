import { Router } from "express";
import { createInvite, listInvites, revokeInvite, acceptInvite } from "../controllers/inviteController.js";
import { validate } from "../utils/validate.js";
import { createInviteSchema, acceptInviteSchema } from "../models/validators.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiters.js";

const router = Router();

// Public — this is how someone without an account yet joins one.
router.post("/accept", authLimiter, validate(acceptInviteSchema), acceptInvite);

// Everything else manages invites for the caller's own organization.
router.use(requireAuth, requireRole("lead", "manager"));
router.post("/", validate(createInviteSchema), createInvite);
router.get("/", listInvites);
router.delete("/:id", revokeInvite);

export default router;
