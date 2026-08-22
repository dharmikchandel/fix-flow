import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, me } from "../controllers/authController.js";
import { validate } from "../utils/validate.js";
import { loginSchema } from "../models/validators.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Slows down credential-guessing without needing any extra infrastructure.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many login attempts. Please try again later." },
});

router.post("/login", loginLimiter, validate(loginSchema), login);
router.get("/me", requireAuth, me);

export default router;
