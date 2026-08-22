import bcrypt from "bcrypt";
import prisma from "../config/database.js";
import * as userService from "./userService.js";
import { signToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";
import type { SessionResult } from "../models/types.js";

const SALT_ROUNDS = 10;

/**
 * Verifies email + password and issues a JWT.
 *
 * The error message is deliberately identical whether the email doesn't
 * exist or the password is wrong — telling those two apart lets an attacker
 * enumerate which emails have accounts.
 */
export async function login(email: string, password: string): Promise<SessionResult> {
  const user = await userService.findUserByEmailForLogin(email);
  if (!user) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw AppError.unauthorized("Invalid email or password");
  }

  return buildSession(user);
}

export interface RegisterInput {
  organizationName: string;
  name: string;
  email: string;
  password: string;
}

/**
 * Creates a brand-new organization and its first account (a manager, since
 * there's no one else yet to have invited them) in one step. This is the
 * only way to get a new organization into the system — everyone after the
 * first person joins through an invite instead.
 */
export async function register(input: RegisterInput): Promise<SessionResult> {
  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  try {
    const { user, organization } = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: input.organizationName },
      });
      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: "manager",
          expertise: [],
        },
      });
      return { user, organization };
    });

    return {
      token: signToken({ id: user.id, role: user.role, organizationId: organization.id }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: organization.id,
        organizationName: organization.name,
      },
    };
  } catch (err: any) {
    if (err?.code === "P2002") {
      throw AppError.conflict("An account with that email already exists");
    }
    throw err;
  }
}

/** Shared by login and invite-acceptance — anywhere a fresh session is issued. */
export function buildSession(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: { id: string; name: string };
}): SessionResult {
  return {
    token: signToken({ id: user.id, role: user.role, organizationId: user.organization.id }),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organization.id,
      organizationName: user.organization.name,
    },
  };
}
