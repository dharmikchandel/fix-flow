import prisma from "../config/database.js";
import type { PriorityItem } from "../models/types.js";

/** Bug age is normalized against this cap (30 days) before entering the score. */
const MAX_AGE_HOURS = 720;

/**
 * Pure scoring formula — no database access, so this is cheap to unit test
 * directly instead of only through the full queue-generation flow.
 *
 *   priorityScore = (severityScore * 0.6) + (normalizedAge * 0.3) + (unassignedBonus * 0.1)
 *
 * `ageHours` is normalized to a 0–100 scale, capped at 720 hours (30 days).
 * Unassigned bugs get a full 100-point boost on that term, nudging them
 * ahead of assigned bugs of similar severity and age.
 */
export function computePriorityScore(
  severityScore: number,
  ageHours: number,
  isAssigned: boolean,
): number {
  const normalizedAge = Math.min(ageHours / MAX_AGE_HOURS, 1) * 100;
  const unassignedBonus = isAssigned ? 0 : 100;
  return Math.round(severityScore * 0.6 + normalizedAge * 0.3 + unassignedBonus * 0.1);
}

/**
 * Priority Queue Service
 *
 * Generates a prioritized list of open/assigned bugs, ranked by
 * `computePriorityScore`, most urgent first.
 */
export async function generatePriorityQueue(organizationId: string): Promise<PriorityItem[]> {
  const bugs = await prisma.bugReport.findMany({
    where: {
      organizationId,
      status: { in: ["open", "assigned"] },
    },
    include: {
      assignment: {
        select: { userId: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const now = Date.now();

  const scored: PriorityItem[] = bugs.map((bug: (typeof bugs)[number]) => {
    const ageMs = now - bug.createdAt.getTime();
    const ageHours = Math.round((ageMs / (1000 * 60 * 60)) * 10) / 10;
    const priorityScore = computePriorityScore(bug.severityScore, ageHours, Boolean(bug.assignment));

    return {
      bugId: bug.id,
      title: bug.title,
      severityScore: bug.severityScore,
      severityLabel: bug.severityLabel,
      ageHours,
      priorityScore,
      priority: 0, // set after sorting
      assignedTo: bug.assignment?.userId ?? null,
      status: bug.status,
    };
  });

  scored.sort((a, b) => b.priorityScore - a.priorityScore);
  scored.forEach((item, index) => {
    item.priority = index + 1;
  });

  return scored;
}
