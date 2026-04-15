import prisma from "../config/database.js";
import bcrypt from "bcrypt";
import type { CreateUserInput } from "../models/types.js";

const SALT_ROUNDS = 10;

/**
 * User Service
 *
 * Manages engineer/user CRUD operations.
 * Used by the assignment engine to query available engineers.
 */
export async function createUser(input: CreateUserInput) {
  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: input.role ?? "engineer",
      expertise: input.expertise.map((e) => e.toLowerCase()),
      maxCapacity: input.maxCapacity ?? 5,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      expertise: true,
      workload: true,
      maxCapacity: true,
      available: true,
      createdAt: true,
    },
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      expertise: true,
      workload: true,
      maxCapacity: true,
      available: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      expertise: true,
      workload: true,
      maxCapacity: true,
      available: true,
      createdAt: true,
      assignments: {
        include: { bug: true },
      },
    },
  });
}

export async function toggleAvailability(userId: string, available: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: { available },
    select: {
      id: true,
      name: true,
      available: true,
    },
  });
}
