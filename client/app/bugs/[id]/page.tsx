"use client"

import { useState, useEffect, useTransition, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft, GitMerge, AlertCircle, CheckCircle2, Clock,
  Loader2, X, UserCheck, RotateCcw
} from "lucide-react"
import { getBug, assignBug, unassignBug, updateBugStatus } from "@/lib/api"
import type { Bug, BugStatus } from "@/lib/types"

function severityVariant(label: string) {
  const map: Record<string, string> = {
    Critical: "critical", High: "high", Medium: "medium", Low: "low",
  }
  return (map[label] ?? "default") as any
}

function statusVariant(status: string) {
  const map: Record<string, string> = {
    open: "default", assigned: "assigned", in_progress: "inProgress",
    resolved: "resolved", closed: "default",
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

function Toast({
  message, type, onDismiss
}: { message: string; type: "success" | "error"; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-[var(--radius-lg)] border bg-[var(--bg-2)] px-4 py-3 shadow-[var(--shadow-md)] max-w-sm"
      style={{
        borderColor: type === "success" ? "var(--success-soft)" : "var(--danger-soft)"
      }}>
      <div className={`h-2 w-2 rounded-full shrink-0 ${type === "success" ? "bg-[var(--success)]" : "bg-[var(--danger)]"}`} />
      <p className="text-sm text-[var(--text-1)] flex-1">{message}</p>
      <button onClick={onDismiss} className="text-[var(--text-3)] hover:text-[var(--text-1)]">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function BugDetailPage({ params, }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [bug, setBug] = useState<Bug | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [isPending, startTransition] = useTransition()

  async function loadBug() {
    setLoading(true)
    const data = await getBug(id)
    setBug(data)
    setLoading(false)
  }

  useEffect(() => { loadBug() }, [id])

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 5000)
  }

  function handleAssign() {
    startTransition(async () => {
      const res = await assignBug(id)
      if (res.success && res.data) {
        showToast(`Assigned to ${res.data.engineerName}. Reason: ${res.data.reason}`)
        loadBug()
      } else {
        showToast(res.error ?? "Assignment failed.", "error")
      }
    })
  }

  function handleUnassign() {
    startTransition(async () => {
      const res = await unassignBug(id)
      if (res.success) {
        showToast("Bug unassigned successfully.")
        loadBug()
      } else {
        showToast(res.error ?? "Unassign failed.", "error")
      }
    })
  }

  function handleStatusChange(status: BugStatus) {
    startTransition(async () => {
      const res = await updateBugStatus(id, status)
      if (res.success) {
        showToast(`Status updated to "${status}".`)
        loadBug()
      } else {
        showToast(res.error ?? "Status update failed.", "error")
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  if (!bug) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-[var(--danger)]" />
        <h2 className="text-xl font-semibold">Bug not found</h2>
        <p className="text-[var(--text-3)]">ID: {id}</p>
        <Link href="/bugs">
          <Button variant="secondary">← Back to Bugs</Button>
        </Link>
      </div>
    )
  }

  const validNextStatuses: BugStatus[] = ["open", "assigned", "in_progress", "resolved", "closed"]
  const otherStatuses = validNextStatuses.filter((s) => s !== bug.status)

  return (
    <>
      {toast && (
        <Toast message={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />
      )}

      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[var(--text-3)]">
          <Link href="/bugs" className="hover:text-[var(--text-1)] transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Bugs
          </Link>
          <span>/</span>
          <span className="font-mono text-[var(--text-2)] truncate max-w-xs">{bug.id}</span>
        </div>

        {/* Header */}
        <div className="space-y-4 border-b border-[var(--border-1)] pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight leading-tight">{bug.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-3)] font-mono">
                <span>{timeAgo(bug.createdAt)}</span>
                <span>•</span>
                <span className="text-[var(--text-2)]">{bug.module}</span>
                {bug.environment && (
                  <>
                    <span>•</span>
                    <span>{bug.environment}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={severityVariant(bug.severityLabel)}>
                  {bug.severityLabel}
                </Badge>
                <Badge variant={statusVariant(bug.status)}>
                  {bug.status.replace("_", " ")}
                </Badge>
                <span className="text-xs font-mono text-[var(--primary-strong)] border border-[var(--primary-soft)] bg-[var(--primary-soft)] px-2 py-0.5 rounded-full">
                  score: {bug.severityScore}
                </span>
              </div>
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-2 bg-[var(--bg-1)] border border-[var(--border-1)] rounded-[var(--radius-md)] p-2 shrink-0">
              {!bug.assignment ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAssign}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <UserCheck className="h-3 w-3 mr-1" />
                  )}
                  Auto-Assign
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleUnassign}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <RotateCcw className="h-3 w-3 mr-1" />
                  )}
                  Unassign
                </Button>
              )}

              {/* Status dropdown */}
              <select
                className="h-9 rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--bg-2)] px-2 text-xs text-[var(--text-1)] focus:border-[var(--primary)] focus:outline-none transition-all font-mono"
                value={bug.status}
                onChange={(e) => handleStatusChange(e.target.value as BugStatus)}
                disabled={isPending}
              >
                <option value={bug.status}>{bug.status.replace("_", " ")}</option>
                {otherStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader className="border-b border-[var(--border-1)]">
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-sm text-[var(--text-2)] leading-relaxed">
                <p className="whitespace-pre-wrap">{bug.description}</p>

                {bug.stepsToReproduce && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-[var(--text-1)] font-semibold text-xs uppercase tracking-wider">
                      Steps to Reproduce
                    </h4>
                    <div className="bg-[var(--bg-3)] border border-[var(--border-1)] rounded-[var(--radius-md)] p-4 font-mono text-xs whitespace-pre-wrap text-[var(--text-2)]">
                      {bug.stepsToReproduce}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata strip */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "ID", value: bug.id.slice(0, 14) + "…" },
                    { label: "Module", value: bug.module },
                    { label: "Environment", value: bug.environment ?? "—" },
                    { label: "Created", value: new Date(bug.createdAt).toLocaleDateString() },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-3)] font-semibold">
                        {item.label}
                      </p>
                      <p className="text-xs font-mono text-[var(--text-1)] truncate">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment info */}
            <Card className={bug.assignment ? "border-[var(--primary-soft)]" : ""}>
              <CardHeader className="pb-3 border-b border-[var(--border-1)]">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <UserCheck className="h-4 w-4 text-[var(--primary)]" />
                  Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-sm">
                {bug.assignment ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-3)]">Assignee</span>
                      <span className="text-[var(--primary-strong)] font-medium">
                        {bug.assignment.userId.slice(0, 8)}…
                      </span>
                    </div>
                    <div className="bg-[var(--bg-3)] rounded-[var(--radius-md)] p-3 text-xs text-[var(--text-2)] font-mono leading-relaxed">
                      {bug.assignment.reason}
                    </div>
                    <p className="text-xs text-[var(--text-3)] font-mono">
                      Assigned {timeAgo(bug.assignment.createdAt)}
                    </p>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-[var(--text-3)] text-sm">Not yet assigned</p>
                    <p className="text-xs text-[var(--text-3)] mt-1">
                      Click Auto-Assign to use the intelligent engine
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Severity breakdown */}
            <Card>
              <CardHeader className="pb-3 border-b border-[var(--border-1)]">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-[var(--warning)]" />
                  Severity Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--text-3)]">Score</span>
                  <span className="font-mono text-[var(--primary-strong)]">{bug.severityScore}/100</span>
                </div>
                <div className="h-2 w-full bg-[var(--bg-3)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      bug.severityScore >= 75
                        ? "bg-[var(--danger)]"
                        : bug.severityScore >= 50
                        ? "bg-purple-400"
                        : bug.severityScore >= 25
                        ? "bg-[var(--primary)]"
                        : "bg-[var(--text-3)]"
                    }`}
                    style={{ width: `${bug.severityScore}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--text-3)]">Label</span>
                  <Badge variant={severityVariant(bug.severityLabel)}>
                    {bug.severityLabel}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Status timeline */}
            <Card>
              <CardHeader className="pb-3 border-b border-[var(--border-1)]">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--text-3)]" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex gap-3">
                  <div className="mt-0.5 rounded-full bg-[var(--bg-3)] p-1.5 border border-[var(--border-1)] shrink-0">
                    <AlertCircle className="h-3 w-3 text-[var(--text-3)]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-1)]">Bug reported</p>
                    <p className="text-[10px] text-[var(--text-3)] font-mono mt-0.5">
                      {new Date(bug.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {bug.assignment && (
                  <div className="flex gap-3">
                    <div className="mt-0.5 rounded-full bg-[var(--primary-soft)] p-1.5 border border-[var(--primary-soft)] shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-[var(--primary-strong)]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-1)]">Auto-assigned</p>
                      <p className="text-[10px] text-[var(--text-3)] font-mono mt-0.5">
                        {new Date(bug.assignment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {(bug.status === "resolved" || bug.status === "closed") && (
                  <div className="flex gap-3">
                    <div className="mt-0.5 rounded-full bg-[var(--success-soft)] p-1.5 border border-[var(--success-soft)] shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-[var(--success)]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--success)]">
                        {bug.status === "resolved" ? "Resolved" : "Closed"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
