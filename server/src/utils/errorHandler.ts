import type { Request, Response, NextFunction } from "express";
import type { ApiResponse } from "../models/types.js";
import { AppError } from "./AppError.js";

/**
 * Global error handler middleware. Every route reaches this through
 * `asyncHandler` or Express's own sync-error catching, so this is the one
 * place that decides status codes and how much error detail leaves the server.
 *
 * `AppError` instances carry a known, safe-to-show message and status code
 * (not found, validation, conflict, ...). Anything else is an unexpected
 * failure — its message is logged but never sent to the client, in any
 * environment, since it may contain internal details (stack frames, raw
 * database errors, file paths).
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error("[ERROR]", err.message);
  if (process.env["NODE_ENV"] !== "production") {
    console.error(err.stack);
  }

  const isKnownError = err instanceof AppError;
  const statusCode = isKnownError ? err.statusCode : 500;
  const message = isKnownError ? err.message : "Internal server error";

  const response: ApiResponse<null> = { success: false, error: message };
  res.status(statusCode).json(response);
}
