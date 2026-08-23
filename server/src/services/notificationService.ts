import prisma from "../config/database.js";
import { AppError } from "../utils/AppError.js";

export const NOTIFICATION_TYPES = [
  "bug_assigned",
  "critical_bug",
  "comment_on_your_bug",
  "status_changed_on_your_bug",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const RECENT_LIMIT = 50;
const MANAGEMENT_ROLES = ["lead", "manager"];

/**
 * Notification Service
 *
 * In-app only — there's no email/SMS/Slack service configured for this
 * project, so nothing gets sent externally. This is the same underlying
 * event data an email or Slack integration would eventually hang off of;
 * see the Phase 4 report for what's missing to wire that up for real.
 */
export async function notifyUser(userId: string, bugId: string | null, type: NotificationType, message: string) {
  return prisma.notification.create({ data: { userId, bugId, type, message } });
}

/** Notifies every lead/manager in an organization, except the person who caused the event. */
export async function notifyManagers(
  organizationId: string,
  excludeUserId: string | null,
  bugId: string | null,
  type: NotificationType,
  message: string,
) {
  const managers = await prisma.user.findMany({
    where: {
      organizationId,
      role: { in: MANAGEMENT_ROLES },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });

  if (managers.length === 0) return;

  await prisma.notification.createMany({
    data: managers.map((m) => ({ userId: m.id, bugId, type, message })),
  });
}

export async function listNotifications(userId: string) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return { notifications, unreadCount };
}

export async function markRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!notification) {
    throw AppError.notFound("Notification not found");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: notification.readAt ?? new Date() },
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
