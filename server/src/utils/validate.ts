import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema } from "zod";
import type { ApiResponse } from "../models/types.js";

/**
 * Express middleware factory that validates request body against a Zod schema.
 * Returns 400 with structured error messages on validation failure.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("; ");

        const response: ApiResponse<null> = {
          success: false,
          error: message,
        };

        res.status(400).json(response);
        return;
      }
      next(err);
    }
  };
}
