"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users, CheckCircle2, XCircle, AlertCircle,
  Loader2, X, UserCheck, UserPlus, Copy, Check, Trash2, Mail
} from "lucide-react"
import {
  listUsers, listBugs, assignBugToEngineer, toggleAvailability,
  listInvites, createInvite, revokeInvite,
} from "@/lib/api"
import { useAuth } from "@/components/auth/auth-provider"
import type { Engineer, Bug, Invite } from "@/lib/types"

const MANAGEMENT_ROLES = ["lead", "manager"]

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

// ─── Assign Bug Modal ─────────────────────────────────────────────────────────

function AssignModal({
  open,
  engineer,
  unassignedBugs,
  onClose,
  onAssigned,
}: {
  open: boolean
  engineer: Engineer | null
  unassignedBugs: Bug[]
  onClose: () => void
  onAssigned: (msg: string) => void
}) {
  const [selectedBugId, setSelectedBugId] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  if (!open || !engineer) return null

  function handleAssign() {
    if (!selectedBugId || !engineer) {
      setError("Select a bug to assign.")
      return
    }
    startTransition(async () => {
      const res = await assignBugToEngineer(selectedBugId, engineer.id)
      if (res.success && res.data) {
        onAssigned(`Bug assigned to ${res.data.engineerName}.`)
        onClose()
      } else {
        setError(res.error ?? "Assignment failed.")
      }
    })
  }

  const filteredBugs = unassignedBugs.filter((b) =>
    engineer.expertise.some((exp) =>
      b.module.toLowerCase().includes(exp.toLowerCase())
    )
  )
  const displayBugs = filteredBugs.length > 0 ? filteredBugs : unassignedBugs

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--border-2)] bg-[var(--bg-1)] shadow-[var(--shadow-md)] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Assign Bug</h2>
            <p className="text-xs text-[var(--text-3)] mt-0.5">
              Assigning to <span className="text-[var(--primary-strong)]">{engineer.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-[var(--bg-2)] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-2)]">
            {filteredBugs.length > 0
              ? `Matching bugs (${engineer.expertise.join(", ")} expertise)`
              : "All unassigned bugs"}
          </p>
          {displayBugs.length === 0 ? (
            <p className="text-sm text-[var(--text-3)] py-4 text-center">
              No unassigned bugs available.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {displayBugs.map((bug) => (
                <button
                  key={bug.id}
                  onClick={() => { setSelectedBugId(bug.id); setError("") }}
                  className={`w-full text-left p-3 rounded-[var(--radius-md)] border transition-all ${
                    selectedBugId === bug.id
                      ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                      : "border-[var(--border-1)] hover:border-[var(--border-2)] hover:bg-[var(--bg-2)]"
                  }`}
                >
                  <p className="text-sm font-medium text-[var(--text-1)] truncate">{bug.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[var(--text-3)]">
                    <span>{bug.severityLabel}</span>
                    <span>•</span>
                    <span>{bug.module}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-[var(--danger-soft)] border border-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="default"
            onClick={handleAssign}
            disabled={isPending || !selectedBugId}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
            Assign
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Invite Engineer Modal ────────────────────────────────────────────────────

function InviteModal({ open, onClose, onCreated }: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("engineer")
  const [expertise, setExpertise] = useState("")
  const [maxCapacity, setMaxCapacity] = useState(5)
  const [error, setError] = useState("")
  const [link, setLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  function handleClose() {
    setEmail(""); setRole("engineer"); setExpertise(""); setMaxCapacity(5)
    setError(""); setLink(""); setCopied(false)
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      const res = await createInvite({
        email,
        role,
        expertise: expertise.split(",").map((s) => s.trim()).filter(Boolean),
        maxCapacity,
      })
      if (!res.success || !res.data) {
        setError(res.error ?? "Could not create invite.")
        return
      }
      setLink(`${window.location.origin}/accept-invite?token=${res.data.token}`)
      onCreated()
    })
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputClass =
    "w-full rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--bg-1)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--border-2)] bg-[var(--bg-1)] shadow-[var(--shadow-md)] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Invite Engineer</h2>
          <button onClick={handleClose} className="rounded p-1 hover:bg-[var(--bg-2)] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {link ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-2)]">
              Send this link to the person you&rsquo;re inviting — they&rsquo;ll set their own password when they open it.
            </p>
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--bg-2)] px-3 py-2">
              <span className="flex-1 truncate text-xs font-mono text-[var(--text-2)]">{link}</span>
              <button onClick={handleCopy} className="shrink-0 text-[var(--primary-strong)] hover:text-[var(--primary)] transition-colors">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <Button variant="default" className="w-full" onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" className={inputClass} required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
                  <option value="engineer">Engineer</option>
                  <option value="lead">Lead</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">Capacity</label>
                <input type="number" min={1} max={20} value={maxCapacity} onChange={(e) => setMaxCapacity(Number(e.target.value))} className={inputClass} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">Expertise (comma-separated)</label>
              <input value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="auth, api, database" className={inputClass} />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-[var(--danger-soft)] border border-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="default" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                Create invite
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssignmentsPage() {
  const { user } = useAuth()
  const isManager = user ? MANAGEMENT_ROLES.includes(user.role) : false

  const [engineers, setEngineers] = useState<Engineer[]>([])
  const [unassignedBugs, setUnassignedBugs] = useState<Bug[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [modalEngineer, setModalEngineer] = useState<Engineer | null>(null)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [isPending, startTransition] = useTransition()

  async function loadData() {
    setLoading(true)
    const [engs, bugsPage, pendingInvites] = await Promise.all([
      listUsers(),
      // The assign-bug picker wants every open bug, not one page of them.
      listBugs({ status: "open", pageSize: 100 }),
      isManager ? listInvites() : Promise.resolve([]),
    ])
    setEngineers(engs)
    setUnassignedBugs(bugsPage.bugs.filter((b) => !b.assignment))
    setInvites(pendingInvites)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [isManager])

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 5000)
  }

  function handleToggleAvailability(eng: Engineer) {
    startTransition(async () => {
      const res = await toggleAvailability(eng.id, !eng.available)
      if (res.success) {
        showToast(`${eng.name} marked as ${!eng.available ? "available" : "unavailable"}.`)
        loadData()
      } else {
        showToast(res.error ?? "Failed to update.", "error")
      }
    })
  }

  function handleRevokeInvite(invite: Invite) {
    startTransition(async () => {
      const res = await revokeInvite(invite.id)
      if (res.success) {
        showToast(`Invite to ${invite.email} revoked.`)
        loadData()
      } else {
        showToast(res.error ?? "Failed to revoke invite.", "error")
      }
    })
  }

  const overloaded = engineers.filter((e) => e.workload >= e.maxCapacity)
  const available = engineers.filter((e) => e.available && e.workload < e.maxCapacity)

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
      {modalEngineer && (
        <AssignModal
          open={!!modalEngineer}
          engineer={modalEngineer}
          unassignedBugs={unassignedBugs}
          onClose={() => setModalEngineer(null)}
          onAssigned={(msg) => {
            showToast(msg)
            setModalEngineer(null)
            loadData()
          }}
        />
      )}
      <InviteModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onCreated={loadData}
      />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
            <p className="text-[var(--text-3)] mt-1">
              Engineer workload tracking and manual dispatch.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isManager && (
              <Button variant="secondary" size="sm" onClick={() => setInviteModalOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" /> Invite Engineer
              </Button>
            )}
            <div className="flex gap-3">
              <div className="rounded-[var(--radius-md)] border border-[var(--success-soft)] bg-[var(--success-soft)] px-3 py-2 text-center">
                <p className="text-[10px] text-[var(--text-3)] font-mono">Available</p>
                <p className="text-xl font-bold text-[var(--success)] font-mono">{available.length}</p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-3 py-2 text-center">
                <p className="text-[10px] text-[var(--text-3)] font-mono">Overloaded</p>
                <p className="text-xl font-bold text-[var(--danger)] font-mono">{overloaded.length}</p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--warning-soft)] bg-[var(--warning-soft)] px-3 py-2 text-center">
                <p className="text-[10px] text-[var(--text-3)] font-mono">Unassigned Bugs</p>
                <p className="text-xl font-bold text-[var(--warning)] font-mono">{unassignedBugs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
          </div>
        ) : (
          <>
            {engineers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Users className="h-10 w-10 text-[var(--text-3)] mb-3" />
                <p className="text-[var(--text-2)] font-medium">No engineers registered</p>
                <p className="text-sm text-[var(--text-3)] mt-1">
                  {isManager ? "Invite one to get started." : "Ask a lead or manager to invite one."}
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {engineers.map((eng) => {
                  const pct = Math.min(Math.round((eng.workload / eng.maxCapacity) * 100), 100)
                  const overloaded = eng.workload >= eng.maxCapacity
                  const canToggle = isManager || user?.id === eng.id
                  const isOptimal =
                    !overloaded &&
                    eng.available &&
                    engineers.every(
                      (other) => other.id === eng.id || eng.workload <= other.workload
                    )

                  return (
                    <Card
                      key={eng.id}
                      className={`relative overflow-hidden transition-all ${
                        isOptimal
                          ? "border-[var(--primary)] shadow-[var(--glow-primary)]"
                          : overloaded
                          ? "border-[var(--danger-soft)]"
                          : ""
                      }`}
                    >
                      {isOptimal && (
                        <div className="absolute top-0 right-0 bg-[var(--primary)] text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-bl-[var(--radius-md)]">
                          Optimal
                        </div>
                      )}

                      <CardHeader className="pb-3 border-b border-[var(--border-1)]">
                        <div className="flex items-start justify-between gap-3 pr-12">
                          <div className="min-w-0">
                            <CardTitle className="text-base truncate">{eng.name}</CardTitle>
                            <p className="text-xs text-[var(--text-3)] mt-0.5">{eng.role}</p>
                            <p className="text-xs text-[var(--text-3)] font-mono mt-0.5 truncate">{eng.email}</p>
                          </div>
                          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[var(--bg-3)] border border-[var(--border-1)] text-sm font-mono font-bold shrink-0">
                            {eng.workload}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-5 pt-4">
                        {/* Workload bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--text-3)] uppercase tracking-wider font-semibold text-[10px]">
                              Capacity
                            </span>
                            <span className={`font-mono font-bold ${overloaded ? "text-[var(--danger)]" : "text-[var(--text-1)]"}`}>
                              {eng.workload} / {eng.maxCapacity}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-[var(--bg-3)] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                overloaded ? "bg-[var(--danger)]" : "bg-[var(--primary)]"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-[10px] font-mono text-[var(--text-3)]">{pct}% utilized</p>
                        </div>

                        {/* Expertise tags */}
                        <div>
                          <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wider font-semibold block mb-2">
                            Expertise
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {eng.expertise.map((exp) => (
                              <span
                                key={exp}
                                className="px-2 py-0.5 rounded bg-[var(--bg-3)] border border-[var(--border-1)] text-[11px] font-mono text-[var(--text-2)]"
                              >
                                {exp}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Availability + assign */}
                        <div className="flex items-center gap-2 pt-1">
                          {canToggle ? (
                            <button
                              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all font-mono ${
                                eng.available
                                  ? "border-[var(--success-soft)] text-[var(--success)] bg-[var(--success-soft)] hover:bg-[var(--success)] hover:text-white"
                                  : "border-[var(--border-1)] text-[var(--text-3)] hover:border-[var(--danger)] hover:text-[var(--danger)]"
                              }`}
                              onClick={() => handleToggleAvailability(eng)}
                              disabled={isPending}
                            >
                              {eng.available ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              {eng.available ? "Available" : "Unavailable"}
                            </button>
                          ) : (
                            <span
                              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-mono ${
                                eng.available
                                  ? "border-[var(--success-soft)] text-[var(--success)] bg-[var(--success-soft)]"
                                  : "border-[var(--border-1)] text-[var(--text-3)]"
                              }`}
                            >
                              {eng.available ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                              {eng.available ? "Available" : "Unavailable"}
                            </span>
                          )}

                          {isManager && (
                            <Button
                              variant={isOptimal ? "default" : "secondary"}
                              size="sm"
                              className="ml-auto text-xs h-7"
                              onClick={() => setModalEngineer(eng)}
                              disabled={overloaded || !eng.available}
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Assign Bug
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {isManager && invites.length > 0 && (
              <Card>
                <CardHeader className="border-b border-[var(--border-1)]">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Mail className="h-4 w-4 text-[var(--text-3)]" />
                    Pending Invites
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="divide-y divide-[var(--border-1)]">
                    {invites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between gap-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--text-1)] truncate">{invite.email}</p>
                          <p className="text-xs text-[var(--text-3)] font-mono mt-0.5">
                            {invite.role} • expires {new Date(invite.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRevokeInvite(invite)}
                          disabled={isPending}
                          className="shrink-0 rounded p-1.5 text-[var(--text-3)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] transition-colors"
                          title="Revoke invite"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  )
}
