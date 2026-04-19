"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search, Loader2, AlertCircle, UserCheck, X
} from "lucide-react"
import { getPriorityQueue, assignBug } from "@/lib/api"
import type { PriorityItem } from "@/lib/types"

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

function Toast({ message, type, onDismiss }: {
  message: string; type: "success" | "error"; onDismiss: () => void
}) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-[var(--radius-lg)] border bg-[var(--bg-2)] px-4 py-3 shadow-[var(--shadow-md)] max-w-sm"
      style={{ borderColor: type === "success" ? "var(--success-soft)" : "var(--danger-soft)" }}
    >
      <div className={`h-2 w-2 rounded-full shrink-0 ${type === "success" ? "bg-[var(--success)]" : "bg-[var(--danger)]"}`} />
      <p className="text-sm text-[var(--text-1)] flex-1">{message}</p>
      <button onClick={onDismiss} className="text-[var(--text-3)] hover:text-[var(--text-1)]">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function TriageQueuePage() {
  const [queue, setQueue] = useState<PriorityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [isPending, startTransition] = useTransition()

  async function loadQueue() {
    setLoading(true)
    const data = await getPriorityQueue()
    setQueue(data)
    setLoading(false)
  }

  useEffect(() => { loadQueue() }, [])

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 5000)
  }

  function handleAssign(bugId: string) {
    setAssigningId(bugId)
    startTransition(async () => {
      const res = await assignBug(bugId)
      setAssigningId(null)
      if (res.success && res.data) {
        showToast(`Assigned to ${res.data.engineerName}.`)
        loadQueue()
      } else {
        showToast(res.error ?? "Assignment failed.", "error")
      }
    })
  }

  const filtered = queue.filter((item) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      item.title.toLowerCase().includes(q) ||
      item.bugId.toLowerCase().includes(q) ||
      item.severityLabel.toLowerCase().includes(q)
    )
  })

  const criticalCount = queue.filter((i) => i.severityLabel === "Critical").length
  const unassignedCount = queue.filter((i) => !i.assignedTo).length

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Triage Queue</h1>
            <p className="text-[var(--text-3)] mt-1">
              Priority-ranked bugs awaiting triage or assignment.
            </p>
          </div>
          <div className="flex gap-4 text-center">
            <div className="rounded-[var(--radius-md)] border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-3 py-2">
              <p className="text-xs text-[var(--text-3)] font-mono">Critical</p>
              <p className="text-xl font-bold text-[var(--danger)] font-mono">{criticalCount}</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--warning-soft)] bg-[var(--warning-soft)] px-3 py-2">
              <p className="text-xs text-[var(--text-3)] font-mono">Unassigned</p>
              <p className="text-xl font-bold text-[var(--warning)] font-mono">{unassignedCount}</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--bg-2)] px-3 py-2">
              <p className="text-xs text-[var(--text-3)] font-mono">Total</p>
              <p className="text-xl font-bold text-[var(--text-1)] font-mono">{queue.length}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-3)]" />
            <Input
              placeholder="Search by title, ID, or severity..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={loadQueue} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-10 w-10 text-[var(--text-3)] mb-3" />
            <p className="text-[var(--text-2)] font-medium">Queue is empty</p>
            <p className="text-sm text-[var(--text-3)] mt-1">
              All bugs are resolved or closed!
            </p>
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-1)] bg-[var(--bg-1)] overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border-1)] bg-[var(--bg-2)]">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">Bug</div>
              <div className="col-span-2">Severity</div>
              <div className="col-span-1 text-center">Score</div>
              <div className="col-span-1 text-center">Age</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[var(--border-1)]">
              {filtered.map((item) => {
                const isAssigning = assigningId === item.bugId && isPending
                const isCritical = item.severityLabel === "Critical"
                return (
                  <div
                    key={item.bugId}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors hover:bg-[var(--bg-2)] group ${
                      isCritical ? "border-l-2 border-l-[var(--danger)]" : ""
                    }`}
                  >
                    <div className="col-span-1 text-center font-mono text-xs text-[var(--text-3)] font-bold">
                      {item.priority}
                    </div>

                    <div className="col-span-4 min-w-0">
                      <Link href={`/bugs/${item.bugId}`}>
                        <p className="text-sm font-medium truncate group-hover:text-[var(--primary)] transition-colors cursor-pointer">
                          {item.title}
                        </p>
                      </Link>
                      <p className="text-[10px] font-mono text-[var(--text-3)] mt-0.5">
                        {item.bugId.slice(0, 12)}…
                      </p>
                    </div>

                    <div className="col-span-2">
                      <Badge variant={severityVariant(item.severityLabel)} className="text-[10px]">
                        {item.severityLabel}
                      </Badge>
                    </div>

                    <div className="col-span-1 text-center font-mono text-xs text-[var(--primary-strong)]">
                      {item.priorityScore}
                    </div>

                    <div className="col-span-1 text-center font-mono text-xs text-[var(--text-3)]">
                      {item.ageHours < 1
                        ? `${Math.round(item.ageHours * 60)}m`
                        : `${item.ageHours}h`}
                    </div>

                    <div className="col-span-1 text-center">
                      <Badge variant={statusVariant(item.status)} className="text-[10px]">
                        {item.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="col-span-2 flex justify-end">
                      {!item.assignedTo ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-[10px] h-7 px-2 gap-1"
                          onClick={() => handleAssign(item.bugId)}
                          disabled={isAssigning}
                        >
                          {isAssigning ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserCheck className="h-3 w-3" />
                          )}
                          Assign
                        </Button>
                      ) : (
                        <span className="text-[10px] font-mono text-[var(--success)] px-2">
                          ✓ assigned
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-[var(--text-3)] font-mono text-center">
          Priority score = (severity × 0.6) + (age × 0.3) + (unassigned bonus × 0.1)
        </p>
      </div>
    </>
  )
}
