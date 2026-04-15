import type { Request, Response, NextFunction } from "express";
import type { ApiResponse } from "../models/types.js";

/**
 * Global error handler middleware.
 * Catches any unhandled errors and returns a consistent JSON response.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error("[ERROR]", err.message);

  if (process.env["NODE_ENV"] === "development") {
    console.error(err.stack);
  }

  const response: ApiResponse<null> = {
    success: false,
    error: process.env["NODE_ENV"] === "production"
      ? "Internal server error"
      : err.message,
  };

  res.status(500).json(response);
}
