import prisma from "../config/database.js";

const ACTIVE_STATUSES = ["open", "assigned", "in_progress"];

export interface AnalyticsTotals {
  openBugs: number;
  criticalBugs: number;
  unassignedBugs: number;
  engineersOverloaded: number;
  duplicateRatePercent: number;
  /** null when no bug has ever been assigned yet — there's nothing to average. */
  avgTriageHours: number | null;
}

export interface AnalyticsResult {
  totals: AnalyticsTotals;
  severityDistribution: { label: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  /** Active (non-resolved/closed) bugs grouped by module — the heatmap data. */
  moduleBreakdown: { module: string; count: number; criticalCount: number }[];
}

const SEVERITY_LABELS = ["Low", "Medium", "High", "Critical"];
const ALL_STATUSES = ["open", "assigned", "in_progress", "resolved", "closed"];

/**
 * Analytics Service
 *
 * Everything here is computed fresh from the current data on every request —
 * there's no separate aggregation table to keep in sync. Fine at this
 * product's scale; a busier install would eventually want these numbers
 * pre-computed on a schedule instead of recalculated per request.
 */
export async function getAnalytics(organizationId: string): Promise<AnalyticsResult> {
  const [bugs, engineers, firstAssignedEvents] = await Promise.all([
    prisma.bugReport.findMany({
      where: { organizationId },
      select: {
        id: true,
        severityLabel: true,
        status: true,
        module: true,
        duplicateCount: true,
        createdAt: true,
        assignment: { select: { id: true } },
      },
    }),
    prisma.user.findMany({
      where: { organizationId, role: "engineer" },
      select: { workload: true, maxCapacity: true },
    }),
    prisma.bugEvent.findMany({
      where: { type: "assigned", bug: { organizationId } },
      select: { bugId: true, createdAt: true, bug: { select: { createdAt: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Totals
  const openBugs = bugs.filter((b) => b.status === "open").length;
  const criticalBugs = bugs.filter((b) => b.severityLabel === "Critical" && ACTIVE_STATUSES.includes(b.status)).length;
  const unassignedBugs = bugs.filter((b) => !b.assignment && ACTIVE_STATUSES.includes(b.status)).length;
  const engineersOverloaded = engineers.filter((e) => e.workload >= e.maxCapacity).length;
  const duplicateRatePercent = bugs.length
    ? Math.round((bugs.filter((b) => b.duplicateCount > 0).length / bugs.length) * 100)
    : 0;

  // Average time-to-first-assignment — only the earliest "assigned" event per bug counts.
  const firstAssignmentByBug = new Map<string, { bugCreatedAt: Date; assignedAt: Date }>();
  for (const event of firstAssignedEvents) {
    if (!firstAssignmentByBug.has(event.bugId)) {
      firstAssignmentByBug.set(event.bugId, { bugCreatedAt: event.bug.createdAt, assignedAt: event.createdAt });
    }
  }
  const triageDurationsHours = [...firstAssignmentByBug.values()].map(
    ({ bugCreatedAt, assignedAt }) => (assignedAt.getTime() - bugCreatedAt.getTime()) / (1000 * 60 * 60),
  );
  const avgTriageHours = triageDurationsHours.length
    ? Math.round((triageDurationsHours.reduce((sum, h) => sum + h, 0) / triageDurationsHours.length) * 10) / 10
    : null;

  // Distributions
  const severityDistribution = SEVERITY_LABELS.map((label) => ({
    label,
    count: bugs.filter((b) => b.severityLabel === label).length,
  }));

  const statusBreakdown = ALL_STATUSES.map((status) => ({
    status,
    count: bugs.filter((b) => b.status === status).length,
  }));

  const activeBugs = bugs.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const moduleCounts = new Map<string, { count: number; criticalCount: number }>();
  for (const bug of activeBugs) {
    const entry = moduleCounts.get(bug.module) ?? { count: 0, criticalCount: 0 };
    entry.count += 1;
    if (bug.severityLabel === "Critical") entry.criticalCount += 1;
    moduleCounts.set(bug.module, entry);
  }
  const moduleBreakdown = [...moduleCounts.entries()]
    .map(([module, stats]) => ({ module, ...stats }))
    .sort((a, b) => b.count - a.count);

  return {
    totals: { openBugs, criticalBugs, unassignedBugs, engineersOverloaded, duplicateRatePercent, avgTriageHours },
    severityDistribution,
    statusBreakdown,
    moduleBreakdown,
  };
}
