import crypto from "node:crypto";
import bcrypt from "bcrypt";
import prisma from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { buildSession } from "./authService.js";
import type { SessionResult } from "../models/types.js";

const SALT_ROUNDS = 10;
const INVITE_TTL_DAYS = 7;

export interface CreateInviteInput {
  email: string;
  role?: string;
  expertise?: string[];
  maxCapacity?: number;
}

const INVITE_SUMMARY = {
  id: true,
  email: true,
  role: true,
  expertise: true,
  maxCapacity: true,
  token: true,
  expiresAt: true,
  createdAt: true,
} as const;

/**
 * Creates an invite link a lead/manager can share with a new teammate. No
 * email is sent — there's no email infrastructure in this project yet — so
 * the token/link is handed back directly for the caller to copy and share.
 * The invited person picks their own password when they accept it; whoever
 * sends the invite never sees or sets it.
 */
export async function createInvite(
  organizationId: string,
  invitedById: string,
  input: CreateInviteInput,
) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    throw AppError.conflict("An account with that email already exists");
  }

  // Replace any still-pending invite for the same email instead of piling up duplicates.
  await prisma.invite.deleteMany({
    where: { organizationId, email: input.email, acceptedAt: null },
  });

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  return prisma.invite.create({
    data: {
      organizationId,
      invitedById,
      email: input.email,
      role: input.role ?? "engineer",
      expertise: (input.expertise ?? []).map((e) => e.toLowerCase()),
      maxCapacity: input.maxCapacity ?? 5,
      token,
      expiresAt,
    },
    select: INVITE_SUMMARY,
  });
}

/** Pending (not yet accepted, not yet expired) invites for an organization. */
export async function listPendingInvites(organizationId: string) {
  return prisma.invite.findMany({
    where: { organizationId, acceptedAt: null, expiresAt: { gt: new Date() } },
    select: INVITE_SUMMARY,
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeInvite(organizationId: string, inviteId: string): Promise<void> {
  const invite = await prisma.invite.findFirst({ where: { id: inviteId, organizationId } });
  if (!invite) {
    throw AppError.notFound("Invite not found");
  }
  await prisma.invite.delete({ where: { id: inviteId } });
}

/**
 * Accepts an invite: the invited person sets their own name and password,
 * their account is created in the inviting organization with the role and
 * expertise the invite specified, and they're logged straight in.
 */
export async function acceptInvite(
  token: string,
  name: string,
  password: string,
): Promise<SessionResult> {
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { organization: { select: { id: true, name: true } } },
  });

  if (!invite) {
    throw AppError.notFound("This invite link is invalid");
  }
  if (invite.acceptedAt) {
    throw AppError.conflict("This invite has already been used");
  }
  if (invite.expiresAt < new Date()) {
    throw AppError.badRequest("This invite has expired");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          organizationId: invite.organizationId,
          name,
          email: invite.email,
          password: hashedPassword,
          role: invite.role,
          expertise: invite.expertise,
          maxCapacity: invite.maxCapacity,
        },
      });
      await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
      return user;
    });

    return buildSession({ ...user, organization: invite.organization });
  } catch (err: any) {
    if (err?.code === "P2002") {
      throw AppError.conflict("An account with that email already exists");
    }
    throw err;
  }
}
