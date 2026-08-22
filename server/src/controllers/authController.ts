import type { Request, Response } from "express";
import * as authService from "../services/authService.js";
import * as userService from "../services/userService.js";
import { AppError } from "../utils/AppError.js";

/**
 * POST /auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json({ success: true, data: result });
}

/**
 * GET /auth/me — who am I, based on the current token
 */
export async function me(req: Request, res: Response): Promise<void> {
  const user = await userService.getUserById(req.user!.id);
  if (!user) {
    throw AppError.unauthorized("Account no longer exists");
  }
  res.json({ success: true, data: user });
}
