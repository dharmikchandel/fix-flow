import type { Request, Response } from "express";
import * as userService from "../services/userService.js";
import { AppError } from "../utils/AppError.js";
import type { CreateUserInput, ApiResponse } from "../models/types.js";

/**
 * POST /users — Register a new engineer/user
 */
export async function createUser(req: Request, res: Response): Promise<void> {
  const input: CreateUserInput = req.body;

  try {
    const user = await userService.createUser(input);
    res.status(201).json({ success: true, data: user } as ApiResponse<typeof user>);
  } catch (err: any) {
    // Prisma unique constraint violation — the one place we still need a
    // local catch, since "email already taken" isn't known until the write.
    if (err?.code === "P2002") {
      throw AppError.conflict("Email already exists");
    }
    throw err;
  }
}

/**
 * GET /users — List all users
 */
export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await userService.listUsers();
  res.json({ success: true, data: users });
}

/**
 * GET /users/:id — Get user by ID
 */
export async function getUser(req: Request, res: Response): Promise<void> {
  const user = await userService.getUserById(String(req.params["id"]));

  if (!user) {
    throw AppError.notFound("User not found");
  }

  res.json({ success: true, data: user });
}

/**
 * PATCH /users/:id/availability — Toggle engineer availability
 */
export async function toggleAvailability(req: Request, res: Response): Promise<void> {
  const { available } = req.body;
  const user = await userService.toggleAvailability(String(req.params["id"]), available);
  res.json({ success: true, data: user });
}
