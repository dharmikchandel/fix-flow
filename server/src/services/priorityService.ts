import prisma from "../config/database.js";
import type { PriorityItem } from "../models/types.js";

/**
 * Priority Queue Service
 *
 * Generates a prioritized list of open/assigned bugs based on:
 *   1. Severity score (higher = more urgent)
 *   2. Age in hours (older = more urgent)
 *   3. Assignment status (unassigned bugs get a small boost)
 *
 * Priority score formula:
 *   priorityScore = (severityScore * 0.6) + (ageScore * 0.3) + (unassignedBonus * 0.1)
 *
 * The final list is ordered by priorityScore descending, with a rank assigned.
 */
export async function generatePriorityQueue(): Promise<PriorityItem[]> {
  const bugs = await prisma.bugReport.findMany({
    where: {
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

  const scored: PriorityItem[] = bugs.map((bug: typeof bugs[number]) => {
    // Age in hours since creation
    const ageMs = now - bug.createdAt.getTime();
    const ageHours = Math.round((ageMs / (1000 * 60 * 60)) * 10) / 10;

    // Normalize age to a 0–100 scale (cap at 720 hours = 30 days)
    const normalizedAge = Math.min(ageHours / 720, 1) * 100;

    // Unassigned bonus
    const unassignedBonus = bug.assignment ? 0 : 100;

    // Composite priority score
    const priorityScore = Math.round(
      bug.severityScore * 0.6 + normalizedAge * 0.3 + unassignedBonus * 0.1,
    );

    return {
      bugId: bug.id,
      title: bug.title,
      severityScore: bug.severityScore,
      severityLabel: bug.severityLabel,
      ageHours,
      priorityScore,
      priority: 0, // will be set after sorting
      assignedTo: bug.assignment?.userId ?? null,
      status: bug.status,
    };
  });

  // Sort by priority score descending
  scored.sort((a, b) => b.priorityScore - a.priorityScore);

  // Assign rank
  scored.forEach((item, index) => {
    item.priority = index + 1;
  });

  return scored;
}
