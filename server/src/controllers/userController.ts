import type { Request, Response } from "express";
import * as userService from "../services/userService.js";
import type { CreateUserInput, ApiResponse } from "../models/types.js";

/**
 * POST /users — Register a new engineer/user
 */
export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const input: CreateUserInput = req.body;
    const user = await userService.createUser(input);

    res.status(201).json({ success: true, data: user } as ApiResponse<typeof user>);
  } catch (err: any) {
    // Handle unique constraint violation (duplicate email)
    if (err?.code === "P2002") {
      res.status(409).json({ success: false, error: "Email already exists" });
      return;
    }
    const message = err instanceof Error ? err.message : "Failed to create user";
    res.status(500).json({ success: false, error: message });
  }
}

/**
 * GET /users — List all users
 */
export async function listUsers(_req: Request, res: Response): Promise<void> {
  try {
    const users = await userService.listUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list users";
    res.status(500).json({ success: false, error: message });
  }
}

/**
 * GET /users/:id — Get user by ID
 */
export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const user = await userService.getUserById(String(req.params["id"]));

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    res.json({ success: true, data: user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get user";
    res.status(500).json({ success: false, error: message });
  }
}

/**
 * PATCH /users/:id/availability — Toggle engineer availability
 */
export async function toggleAvailability(req: Request, res: Response): Promise<void> {
  try {
    const { available } = req.body;
    if (typeof available !== "boolean") {
      res.status(400).json({ success: false, error: "'available' must be a boolean" });
      return;
    }

    const user = await userService.toggleAvailability(String(req.params["id"]), available);
    res.json({ success: true, data: user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update availability";
    res.status(500).json({ success: false, error: message });
  }
}
