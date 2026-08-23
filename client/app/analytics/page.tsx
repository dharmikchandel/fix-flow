"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Bug, AlertTriangle, UserX, Users, Copy, Clock, Loader2, LayoutGrid, PieChart,
} from "lucide-react"
import { getAnalytics } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"

// Ordinal severity gets a sequential read — cooler and quieter at Low,
// warmer at High, breaking into the reserved danger red only at Critical.
// All four are existing design-system tokens; nothing new was introduced.
const SEVERITY_ORDER = ["Low", "Medium", "High", "Critical"] as const
const SEVERITY_COLOR: Record<string, string> = {
  Low: "var(--text-3)",
  Medium: "var(--primary)",
  High: "var(--info)",
  Critical: "var(--danger)",
}

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
}
const STATUS_COLOR: Record<string, string> = {
  open: "var(--text-3)",
  assigned: "var(--primary)",
  in_progress: "var(--info)",
  resolved: "var(--success)",
  closed: "var(--border-2)",
}

// The module heatmap's intensity ramp — same blue as --primary, four fixed
// alpha steps instead of an arbitrary gradient, so "more bugs" always reads
// as "more of this exact color," not a hue shift.
const HEATMAP_STEPS = [0.06, 0.18, 0.34, 0.55]
function heatmapFill(count: number, max: number): string {
  if (count === 0 || max === 0) return "var(--bg-2)"
  const ratio = count / max
  const step = ratio > 0.75 ? 3 : ratio > 0.5 ? 2 : ratio > 0.25 ? 1 : 0
  return `rgba(47, 128, 255, ${HEATMAP_STEPS[step]})`
}

export default function AnalyticsPage() {
  const { data, isPending } = useQuery({ queryKey: queryKeys.analytics, queryFn: getAnalytics })

  if (isPending || !data) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  const { totals, severityDistribution, statusBreakdown, moduleBreakdown } = data

  const severityByLabel = Object.fromEntries(severityDistribution.map((s) => [s.label, s.count]))
  const severityTotal = severityDistribution.reduce((sum, s) => sum + s.count, 0) || 1
  const maxSeverityCount = Math.max(...severityDistribution.map((s) => s.count), 1)

  const statusTotal = statusBreakdown.reduce((sum, s) => sum + s.count, 0) || 1
  const maxModuleCount = Math.max(...moduleBreakdown.map((m) => m.count), 1)

  const tiles = [
    { label: "Open Bugs", value: totals.openBugs, icon: Bug, accent: "text-[var(--text-1)]" },
    { label: "Critical", value: totals.criticalBugs, icon: AlertTriangle, accent: "text-[var(--danger)]" },
    { label: "Unassigned", value: totals.unassignedBugs, icon: UserX, accent: "text-[var(--warning)]" },
    { label: "Overloaded", value: totals.engineersOverloaded, icon: Users, accent: "text-[var(--danger)]" },
    { label: "Duplicate Rate", value: `${totals.duplicateRatePercent}%`, icon: Copy, accent: "text-[var(--info)]" },
    {
      label: "Avg. Triage Time",
      value: totals.avgTriageHours === null ? "—" : `${totals.avgTriageHours}h`,
      icon: Clock,
      accent: "text-[var(--primary)]",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-[var(--text-3)] mt-1">
          Where the bugs are, how fast they get triaged, and how balanced the team is.
        </p>
      </div>

      {/* Metric tiles */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <Card key={tile.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-[var(--text-2)]">{tile.label}</CardTitle>
                <Icon className={`h-4 w-4 ${tile.accent}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold font-mono ${tile.accent}`}>{tile.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Severity distribution */}
        <Card>
          <CardHeader className="border-b border-[var(--border-1)]">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[var(--text-3)]" />
              Severity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {SEVERITY_ORDER.map((label) => {
              const count = severityByLabel[label] ?? 0
              const widthPct = Math.round((count / maxSeverityCount) * 100)
              const sharePct = Math.round((count / severityTotal) * 100)
              return (
                <div key={label} className="space-y-1.5" title={`${label}: ${count} bug${count !== 1 ? "s" : ""} (${sharePct}%)`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-[var(--text-2)]">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: SEVERITY_COLOR[label] }} />
                      {label}
                    </span>
                    <span className="font-mono text-[var(--text-3)]">{count}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[var(--bg-2)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.max(widthPct, count > 0 ? 3 : 0)}%`, backgroundColor: SEVERITY_COLOR[label] }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card>
          <CardHeader className="border-b border-[var(--border-1)]">
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-[var(--text-3)]" />
              Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {/* One segmented bar, proportional to each status's share */}
            <div className="flex h-3 w-full gap-0.5 rounded-full overflow-hidden">
              {statusBreakdown.map((s) => {
                const widthPct = (s.count / statusTotal) * 100
                if (widthPct === 0) return null
                return (
                  <div
                    key={s.status}
                    title={`${STATUS_LABEL[s.status]}: ${s.count}`}
                    style={{ width: `${widthPct}%`, backgroundColor: STATUS_COLOR[s.status] }}
                  />
                )
              })}
            </div>

            {/* Legend — every status is also direct-labeled with a count, never color-only */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {statusBreakdown.map((s) => (
                <div key={s.status} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[var(--text-2)]">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLOR[s.status] }} />
                    {STATUS_LABEL[s.status]}
                  </span>
                  <span className="font-mono text-[var(--text-3)]">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module heatmap */}
      <Card>
        <CardHeader className="border-b border-[var(--border-1)]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-[var(--text-3)]" />
              Module Hotspots
            </CardTitle>
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-3)] font-mono">
              <span>Fewer</span>
              <div className="flex gap-0.5">
                {[0, ...HEATMAP_STEPS].map((alpha, i) => (
                  <span
                    key={i}
                    className="h-3 w-3 rounded-sm border border-[var(--border-1)]"
                    style={{ backgroundColor: alpha === 0 ? "var(--bg-2)" : `rgba(47, 128, 255, ${alpha})` }}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {moduleBreakdown.length === 0 ? (
            <p className="text-sm text-[var(--text-3)] text-center py-8">
              No active bugs right now — nothing to show a hotspot for.
            </p>
          ) : (
            <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {moduleBreakdown.map((m) => (
                <div
                  key={m.module}
                  title={`${m.module}: ${m.count} active bug${m.count !== 1 ? "s" : ""}${m.criticalCount > 0 ? `, ${m.criticalCount} critical` : ""}`}
                  className="relative rounded-[var(--radius-md)] border border-[var(--border-1)] px-3 py-3 transition-all"
                  style={{ backgroundColor: heatmapFill(m.count, maxModuleCount) }}
                >
                  {m.criticalCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--danger)] shadow-[var(--shadow-glow-danger)]" />
                  )}
                  <p className="text-xs font-medium text-[var(--text-1)] truncate">{m.module}</p>
                  <p className="text-lg font-bold font-mono text-[var(--text-1)] mt-1">{m.count}</p>
                  {m.criticalCount > 0 && (
                    <p className="text-[10px] font-mono text-[var(--danger)] mt-0.5">{m.criticalCount} critical</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
