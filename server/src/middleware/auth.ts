import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";

/**
 * Requires a valid `Authorization: Bearer <token>` header. On success,
 * attaches the decoded `{ id, role }` to `req.user` for downstream handlers.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    throw AppError.unauthorized("Authentication required");
  }

  req.user = verifyToken(token);
  next();
}

/**
 * Requires `requireAuth` to have already run. Restricts a route to one of
 * the given roles — e.g. `requireRole("lead", "manager")` for triage actions
 * an individual engineer shouldn't be able to take on their own.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized("Authentication required");
    }
    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden(`This action requires one of these roles: ${roles.join(", ")}`);
    }
    next();
  };
}
