import bcrypt from "bcrypt";
import * as userService from "./userService.js";
import { signToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";

export interface LoginResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

/**
 * Verifies email + password and issues a JWT.
 *
 * The error message is deliberately identical whether the email doesn't
 * exist or the password is wrong — telling those two apart lets an attacker
 * enumerate which emails have accounts.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await userService.findUserByEmailForLogin(email);
  if (!user) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const token = signToken({ id: user.id, role: user.role });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}
