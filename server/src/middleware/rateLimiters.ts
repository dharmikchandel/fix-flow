import rateLimit from "express-rate-limit";

/**
 * Shared by every public, credential-adjacent endpoint (login, registering a
 * new organization, accepting an invite) — slows down guessing/spam without
 * needing any extra infrastructure.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many attempts. Please try again later." },
});
