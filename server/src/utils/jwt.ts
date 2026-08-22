import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./AppError.js";
import type { AuthUser } from "../types/express.js";

export function signToken(user: AuthUser): string {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthUser {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    if (typeof payload.sub !== "string" || typeof payload["role"] !== "string") {
      throw AppError.unauthorized("Invalid token");
    }
    return { id: payload.sub, role: payload["role"] };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.unauthorized("Invalid or expired token");
  }
}
