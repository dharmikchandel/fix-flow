import prisma from "../config/database.js";
import bcrypt from "bcrypt";
import { AppError } from "../utils/AppError.js";
import type { CreateUserInput } from "../models/types.js";

const SALT_ROUNDS = 10;

const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  expertise: true,
  workload: true,
  maxCapacity: true,
  available: true,
  createdAt: true,
} as const;

/**
 * User Service
 *
 * Manages engineer/user CRUD operations, always scoped to one organization —
 * every read and write here takes the caller's `organizationId` and never
 * touches rows outside it. `organizationId` always comes from the
 * authenticated caller's session, never from request input.
 */
export async function createUser(input: CreateUserInput, organizationId: string) {
  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  return prisma.user.create({
    data: {
      organizationId,
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: input.role ?? "engineer",
      expertise: input.expertise.map((e) => e.toLowerCase()),
      maxCapacity: input.maxCapacity ?? 5,
    },
    select: PROFILE_SELECT,
  });
}

export async function listUsers(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId },
    select: PROFILE_SELECT,
    orderBy: { name: "asc" },
  });
}

/**
 * Only used by the login flow — every other lookup deliberately leaves the
 * password hash out of the result. Intentionally *not* scoped to an
 * organization: at login time we don't know which org the caller belongs to
 * yet — that's what this lookup tells us, via the token issued afterward.
 */
export async function findUserByEmailForLogin(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { organization: { select: { id: true, name: true } } },
  });
}

/**
 * The lean "who am I" shape used by GET /auth/me — deliberately narrower
 * than `getUserById`, which also pulls in assignment history for the user
 * detail view. There's no reason the auth-check endpoint needs that.
 */
export async function getAuthenticatedProfile(userId: string, organizationId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organization: { select: { id: true, name: true } },
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organization.id,
    organizationName: user.organization.name,
  };
}

export async function getUserById(userId: string, organizationId: string) {
  return prisma.user.findFirst({
    where: { id: userId, organizationId },
    select: {
      ...PROFILE_SELECT,
      organization: { select: { id: true, name: true } },
      assignments: {
        include: { bug: true },
      },
    },
  });
}

export async function toggleAvailability(userId: string, available: boolean, organizationId: string) {
  const user = await prisma.user.findFirst({ where: { id: userId, organizationId } });
  if (!user) {
    throw AppError.notFound(`User with ID "${userId}" not found`);
  }

  return prisma.user.update({
    where: { id: userId },
    data: { available },
    select: { id: true, name: true, available: true },
  });
}
