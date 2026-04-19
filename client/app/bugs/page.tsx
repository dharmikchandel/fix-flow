"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, X, Plus, Loader2, AlertCircle } from "lucide-react"
import { submitBug, listBugs } from "@/lib/api"
import type { Bug, CreateBugInput, BugStatus } from "@/lib/types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Report Bug Modal ─────────────────────────────────────────────────────────

function ReportBugModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: (msg: string) => void
}) {
  const [form, setForm] = useState<CreateBugInput>({
    title: "",
    description: "",
    module: "",
    environment: "",
    stepsToReproduce: "",
  })
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!open) return null

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || form.title.length < 3) {
      setError("Title must be at least 3 characters.")
      return
    }
    if (!form.description.trim() || form.description.length < 10) {
      setError("Description must be at least 10 characters.")
      return
    }
    if (!form.module.trim()) {
      setError("Module is required.")
      return
    }

    startTransition(async () => {
      const res = await submitBug(form)
      if (!res.success || !res.data) {
        setError(res.error ?? "Submission failed.")
        return
      }
      onSuccess(
        `Bug submitted! ID: ${res.data.bugId} — Severity: ${res.data.severity.label} (score ${res.data.severity.score})`
      )
      router.refresh()
      onClose()
    })
  }

  const inputClass =
    "w-full rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--bg-1)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-[var(--radius-xl)] border border-[var(--border-2)] bg-[var(--bg-1)] shadow-[var(--shadow-md)] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Report a Bug</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-[var(--bg-2)] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">
              Title *
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Login crashes on Android 14"
              className={inputClass}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">
              Description *
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the bug in detail..."
              rows={4}
              className={`${inputClass} resize-none`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">
                Module *
              </label>
              <select
                name="module"
                value={form.module}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">Select module</option>
                {[
                  "auth", "api", "ui", "database", "payment", "security",
                  "core", "docs", "sync", "billing", "frontend",
                ].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">
                Environment
              </label>
              <select
                name="environment"
                value={form.environment}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select env</option>
                {["production", "staging", "development", "test"].map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">
              Steps to Reproduce
            </label>
            <textarea
              name="stepsToReproduce"
              value={form.stepsToReproduce}
              onChange={handleChange}
              placeholder="1. Open the app&#10;2. Navigate to settings&#10;3. ..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-[var(--danger-soft)] border border-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Submit Bug
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

function FilterPanel({
  open,
  selectedStatus,
  onStatusChange,
  onClose,
}: {
  open: boolean
  selectedStatus: string
  onStatusChange: (s: string) => void
  onClose: () => void
}) {
  if (!open) return null
  const statuses = ["all", "open", "assigned", "in_progress", "resolved", "closed"]
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-2)] bg-[var(--bg-1)] p-4 shadow-[var(--shadow-md)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-2)]">
          Filter by Status
        </span>
        <button onClick={onClose} className="text-[var(--text-3)] hover:text-[var(--text-1)]">
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            className={`px-3 py-1 rounded-full text-xs font-mono transition-all border ${
              selectedStatus === s
                ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-strong)]"
                : "border-[var(--border-1)] text-[var(--text-3)] hover:border-[var(--border-2)] hover:text-[var(--text-1)]"
            }`}
          >
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Success Toast ────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--success-soft)] bg-[var(--bg-2)] px-4 py-3 shadow-[var(--shadow-md)] max-w-sm">
      <div className="h-2 w-2 rounded-full bg-[var(--success)] shrink-0" />
      <p className="text-sm text-[var(--text-1)] flex-1">{message}</p>
      <button onClick={onDismiss} className="text-[var(--text-3)] hover:text-[var(--text-1)]">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BugListPage({ bugs: initialBugs }: { bugs?: Bug[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [bugs, setBugs] = useState<Bug[]>(initialBugs ?? [])
  const [toast, setToast] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function fetchBugs(status?: string) {
    setLoading(true)
    try {
      const bgs = await listBugs(status === "all" ? undefined : status)
      setBugs(bgs)
    } finally {
      setLoading(false)
    }
  }

  // Load bugs on mount
  useState(() => {
    fetchBugs()
  })

  function handleStatusChange(s: string) {
    setStatusFilter(s)
    fetchBugs(s === "all" ? undefined : s)
  }

  const filtered = bugs.filter((b) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      b.title.toLowerCase().includes(q) ||
      b.module.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q)
    )
  })

  return (
    <>
      <ReportBugModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(msg) => {
          setToast(msg)
          fetchBugs(statusFilter === "all" ? undefined : statusFilter)
        }}
      />
      {toast && <Toast message={toast} onDismiss={() => setToast("")} />}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bugs</h1>
            <p className="text-[var(--text-3)] mt-1">
              {filtered.length} bug{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <Button variant="default" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Report Bug
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-3)]" />
              <Input
                placeholder="Search by title, module, or ID..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant={filterOpen ? "secondary" : "ghost"}
              className="gap-2"
              onClick={() => setFilterOpen((o) => !o)}
            >
              <Filter className="h-4 w-4" />
              Filters
              {statusFilter !== "all" && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold">
                  1
                </span>
              )}
            </Button>
          </div>

          <FilterPanel
            open={filterOpen}
            selectedStatus={statusFilter}
            onStatusChange={handleStatusChange}
            onClose={() => setFilterOpen(false)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-10 w-10 text-[var(--text-3)] mb-3" />
            <p className="text-[var(--text-2)] font-medium">No bugs found</p>
            <p className="text-sm text-[var(--text-3)] mt-1">
              {search ? "Try a different search term" : "Submit the first bug report!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((bug) => (
              <Link key={bug.id} href={`/bugs/${bug.id}`}>
                <Card className="hover:border-[var(--primary-soft)] hover:shadow-[var(--shadow-glow-primary)] cursor-pointer group transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                      {/* Left: severity rail + info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`mt-1 w-1 h-12 rounded-full shrink-0 ${
                            bug.severityLabel === "Critical"
                              ? "bg-[var(--danger)]"
                              : bug.severityLabel === "High"
                              ? "bg-purple-400"
                              : bug.severityLabel === "Medium"
                              ? "bg-[var(--primary)]"
                              : "bg-[var(--text-3)]"
                          }`}
                        />
                        <div className="min-w-0 space-y-1">
                          <h3 className="font-medium text-base group-hover:text-[var(--primary-strong)] transition-colors truncate">
                            {bug.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-[var(--text-3)] font-mono flex-wrap">
                            <span className="text-[var(--text-2)]">{bug.id.slice(0, 12)}…</span>
                            <span>•</span>
                            <span>{bug.module}</span>
                            {bug.environment && (
                              <>
                                <span>•</span>
                                <span>{bug.environment}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{timeAgo(bug.createdAt)}</span>
                          </div>
                          <p className="text-xs text-[var(--text-3)] line-clamp-1">
                            {bug.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: badges + owner */}
                      <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                        <Badge variant={severityVariant(bug.severityLabel)}>
                          {bug.severityLabel}
                        </Badge>
                        <Badge variant={statusVariant(bug.status)}>
                          {bug.status.replace("_", " ")}
                        </Badge>
                        {bug.assignment?.user && (
                          <span className="text-xs font-mono text-[var(--text-2)] hidden md:block">
                            → {bug.assignment.user.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
