import { Router } from "express";
import { login, register, me } from "../controllers/authController.js";
import { validate } from "../utils/validate.js";
import { loginSchema, registerSchema } from "../models/validators.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/register", authLimiter, validate(registerSchema), register);
router.get("/me", requireAuth, me);

export default router;
