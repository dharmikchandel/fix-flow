import type { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import type { ApiResponse } from "../models/types.js";
import { AppError } from "./AppError.js";

/**
 * Global error handler middleware. Express 5 automatically forwards errors
 * thrown or rejected inside async route handlers here, so this is the one
 * place that decides status codes and how much error detail leaves the server.
 *
 * `AppError` instances (and Multer's own upload-validation errors) carry a
 * known, safe-to-show message and status code. Anything else is an
 * unexpected failure — its message is logged but never sent to the client,
 * in any environment, since it may contain internal details (stack frames,
 * raw database errors, file paths).
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

  if (err instanceof MulterError) {
    res.status(400).json({ success: false, error: err.message } satisfies ApiResponse<null>);
    return;
  }

  const isKnownError = err instanceof AppError;
  const statusCode = isKnownError ? err.statusCode : 500;
  const message = isKnownError ? err.message : "Internal server error";

  const response: ApiResponse<null> = { success: false, error: message };
  res.status(statusCode).json(response);
}
