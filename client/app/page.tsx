import { listBugs, listUsers, getPriorityQueue } from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Bug, Users, ListChecks, AlertTriangle } from "lucide-react"
import type { Bug as BugType, Engineer, PriorityItem } from "@/lib/types"

function severityVariant(label: string) {
  const map: Record<string, string> = {
    Critical: "critical",
    High: "high",
    Medium: "medium",
    Low: "low",
  }
  return (map[label] ?? "default") as any
}

function statusVariant(status: string) {
  const map: Record<string, string> = {
    open: "default",
    assigned: "assigned",
    in_progress: "inProgress",
    resolved: "resolved",
    closed: "default",
  }
  return (map[status] ?? "default") as any
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function Dashboard() {
  const [bugs, engineers, queue] = await Promise.all([
    listBugs(),
    listUsers(),
    getPriorityQueue(),
  ])

  const openCount = bugs.filter((b) => b.status === "open").length
  const assignedCount = bugs.filter((b) => b.status === "assigned").length
  const criticalCount = bugs.filter((b) => b.severityLabel === "Critical").length
  const resolvedCount = bugs.filter((b) => b.status === "resolved").length

  const criticalBugs = bugs
    .filter((b) => b.severityLabel === "Critical" && b.status !== "resolved")
    .slice(0, 4)

  const overloadedEngineers = engineers.filter(
    (e) => e.workload >= e.maxCapacity
  )

  const metrics = [
    { label: "Open Bugs", value: openCount, icon: Bug, accent: "text-[var(--text-1)]" },
    { label: "Critical", value: criticalCount, icon: AlertTriangle, accent: "text-[var(--danger)]" },
    { label: "Assigned", value: assignedCount, icon: ListChecks, accent: "text-[var(--primary)]" },
    { label: "Engineers", value: engineers.length, icon: Users, accent: "text-[var(--success)]" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-[var(--text-3)] mt-1">
          Live overview of system health and triage queue.
        </p>
      </div>

      {/* Metric tiles */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <Card key={m.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[var(--text-2)]">
                  {m.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${m.accent}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold font-mono ${m.accent}`}>
                  {m.value}
                </div>
                <p className="text-xs mt-1 text-[var(--text-3)]">
                  {resolvedCount} resolved total
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        {/* Critical bugs */}
        <Card className="lg:col-span-4">
          <CardHeader className="border-b border-[var(--border-1)]">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[var(--danger)]" />
              Critical Bugs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {criticalBugs.length === 0 ? (
              <p className="text-sm text-[var(--text-3)] py-4 text-center">
                No critical bugs right now 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {criticalBugs.map((bug) => (
                  <Link key={bug.id} href={`/bugs/${bug.id}`}>
                    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border-1)] p-3 hover:bg-[var(--bg-1)] hover:border-[var(--danger-soft)] transition-all cursor-pointer group">
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-[var(--danger)] transition-colors">
                          {bug.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-3)] font-mono">
                          <span>{bug.id.slice(0, 8)}</span>
                          <span>•</span>
                          <span className="text-[var(--text-2)]">{bug.module}</span>
                          <span>•</span>
                          <span>{timeAgo(bug.createdAt)}</span>
                        </div>
                      </div>
                      <Badge variant="critical">Critical</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Engineers workload */}
        <Card className="lg:col-span-3">
          <CardHeader className="border-b border-[var(--border-1)]">
            <CardTitle>Engineer Workload</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {engineers.length === 0 ? (
              <p className="text-sm text-[var(--text-3)] py-4 text-center">
                No engineers registered yet.
              </p>
            ) : (
              <div className="space-y-5">
                {engineers.slice(0, 5).map((eng) => {
                  const pct = Math.round((eng.workload / eng.maxCapacity) * 100)
                  const overloaded = eng.workload >= eng.maxCapacity
                  return (
                    <div key={eng.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[var(--text-1)]">
                            {eng.name}
                          </span>
                          {!eng.available && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-3)] text-[var(--text-3)] font-mono">
                              unavailable
                            </span>
                          )}
                        </div>
                        <span className="text-[var(--text-3)] font-mono text-xs">
                          {eng.workload}/{eng.maxCapacity}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--bg-3)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            overloaded
                              ? "bg-[var(--danger)]"
                              : "bg-[var(--primary)]"
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {overloadedEngineers.length > 0 && (
              <p className="text-xs text-[var(--danger)] mt-4 font-mono">
                ⚠ {overloadedEngineers.length} engineer(s) at capacity
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Priority Queue Preview */}
      {queue.length > 0 && (
        <Card>
          <CardHeader className="border-b border-[var(--border-1)]">
            <div className="flex items-center justify-between">
              <CardTitle>Priority Queue (Top 5)</CardTitle>
              <Link
                href="/triage"
                className="text-xs text-[var(--primary)] hover:text-[var(--primary-strong)] transition-colors font-mono"
              >
                View full queue →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-[var(--border-1)]">
              {queue.slice(0, 5).map((item) => (
                <Link key={item.bugId} href={`/bugs/${item.bugId}`}>
                  <div className="flex items-center gap-4 py-3 hover:bg-[var(--bg-1)] px-2 rounded transition-colors group">
                    <span className="text-xs font-mono text-[var(--text-3)] w-6 text-center">
                      #{item.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-[var(--primary)] transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-[var(--text-3)] font-mono">
                        score: {item.priorityScore} • age: {item.ageHours}h
                      </p>
                    </div>
                    <Badge variant={severityVariant(item.severityLabel)}>
                      {item.severityLabel}
                    </Badge>
                    <Badge variant={statusVariant(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
