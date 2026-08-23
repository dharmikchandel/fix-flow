"use client"

import { useState, use } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft, AlertCircle, Clock,
  Loader2, X, UserCheck, RotateCcw, Send,
  Paperclip, Download, Trash2, ArrowRight, FileText, Image as ImageIcon,
} from "lucide-react"
import {
  getBug, assignBug, unassignBug, updateBugStatus,
  listEvents, addComment, listAttachments, uploadAttachment, deleteAttachment, downloadAttachment,
} from "@/lib/api"
import { useAuth } from "@/components/auth/auth-provider"
import { queryKeys } from "@/lib/queryKeys"
import type { BugStatus, BugEvent, Attachment } from "@/lib/types"
import { severityVariant, statusVariant, timeAgo } from "@/lib/badge-helpers"

const MANAGEMENT_ROLES = ["lead", "manager"]

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

// ─── Activity row ─────────────────────────────────────────────────────────────

function ActivityRow({ event }: { event: BugEvent }) {
  const actorName = event.actor?.name ?? "Someone"
  const when = new Date(event.createdAt).toLocaleString()

  if (event.type === "comment") {
    return (
      <div className="flex gap-3">
        <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-[var(--bg-3)] border border-[var(--border-1)] flex items-center justify-center text-[10px] font-semibold text-[var(--primary-strong)]">
          {actorName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 rounded-[var(--radius-md)] bg-[var(--bg-1)] border border-[var(--border-1)] px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[var(--text-1)]">{actorName}</span>
            <span className="text-[10px] text-[var(--text-3)] font-mono">{when}</span>
          </div>
          <p className="text-sm text-[var(--text-2)] whitespace-pre-wrap mt-1">{event.comment}</p>
        </div>
      </div>
    )
  }

  const meta: Record<Exclude<BugEvent["type"], "comment">, { icon: React.ReactNode; text: string }> = {
    created: {
      icon: <AlertCircle className="h-3 w-3 text-[var(--text-3)]" />,
      text: `${actorName} reported this bug`,
    },
    status_changed: {
      icon: <ArrowRight className="h-3 w-3 text-[var(--info)]" />,
      text: `${actorName} changed status from "${event.fromStatus?.replace("_", " ")}" to "${event.toStatus?.replace("_", " ")}"`,
    },
    assigned: {
      icon: <UserCheck className="h-3 w-3 text-[var(--primary-strong)]" />,
      text: `${actorName} assigned this to ${event.assignee?.name ?? "an engineer"}`,
    },
    unassigned: {
      icon: <RotateCcw className="h-3 w-3 text-[var(--danger)]" />,
      text: `${actorName} unassigned ${event.assignee?.name ?? "the engineer"}`,
    },
  }
  const info = meta[event.type]

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 rounded-full bg-[var(--bg-3)] p-1.5 border border-[var(--border-1)] shrink-0">
        {info.icon}
      </div>
      <div>
        <p className="text-xs text-[var(--text-1)]">{info.text}</p>
        {event.reason && (
          <p className="text-[10px] text-[var(--text-3)] font-mono mt-0.5">{event.reason}</p>
        )}
        <p className="text-[10px] text-[var(--text-3)] font-mono mt-0.5">{when}</p>
      </div>
    </div>
  )
}

export default function BugDetailPage({ params, }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const isManager = user ? MANAGEMENT_ROLES.includes(user.role) : false
  const queryClient = useQueryClient()

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [commentBody, setCommentBody] = useState("")

  const bugQuery = useQuery({ queryKey: queryKeys.bug(id), queryFn: () => getBug(id) })
  const eventsQuery = useQuery({ queryKey: queryKeys.bugEvents(id), queryFn: () => listEvents(id) })
  const attachmentsQuery = useQuery({ queryKey: queryKeys.bugAttachments(id), queryFn: () => listAttachments(id) })

  const bug = bugQuery.data
  const events = eventsQuery.data ?? []
  const attachments = attachmentsQuery.data ?? []

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 5000)
  }

  // Every mutation below touches this bug's own detail + activity, and often
  // the lists/queue/engineers elsewhere in the app too (workload, status
  // counts) — invalidating all of them together is what keeps every page
  // that happens to be open in sync without each one polling on its own.
  function invalidateBugAndRelated() {
    queryClient.invalidateQueries({ queryKey: queryKeys.bug(id) })
    queryClient.invalidateQueries({ queryKey: queryKeys.bugEvents(id) })
    queryClient.invalidateQueries({ queryKey: queryKeys.bugsAll })
    queryClient.invalidateQueries({ queryKey: queryKeys.priorityQueue })
    queryClient.invalidateQueries({ queryKey: queryKeys.users })
  }

  const assignMutation = useMutation({
    mutationFn: () => assignBug(id),
    onSuccess: (res) => {
      if (res.success && res.data) {
        showToast(`Assigned to ${res.data.engineerName}. Reason: ${res.data.reason}`)
        invalidateBugAndRelated()
      } else {
        showToast(res.error ?? "Assignment failed.", "error")
      }
    },
    onError: () => showToast("Assignment failed.", "error"),
  })

  const unassignMutation = useMutation({
    mutationFn: () => unassignBug(id),
    onSuccess: (res) => {
      if (res.success) {
        showToast("Bug unassigned successfully.")
        invalidateBugAndRelated()
      } else {
        showToast(res.error ?? "Unassign failed.", "error")
      }
    },
    onError: () => showToast("Unassign failed.", "error"),
  })

  const statusMutation = useMutation({
    mutationFn: (status: BugStatus) => updateBugStatus(id, status),
    onSuccess: (res, status) => {
      if (res.success) {
        showToast(`Status updated to "${status}".`)
        invalidateBugAndRelated()
      } else {
        showToast(res.error ?? "Status update failed.", "error")
      }
    },
    onError: () => showToast("Status update failed.", "error"),
  })

  const commentMutation = useMutation({
    mutationFn: (body: string) => addComment(id, body),
    onSuccess: (res) => {
      if (res.success) {
        setCommentBody("")
        queryClient.invalidateQueries({ queryKey: queryKeys.bugEvents(id) })
      } else {
        showToast(res.error ?? "Could not post comment.", "error")
      }
    },
    onError: () => showToast("Could not post comment.", "error"),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAttachment(id, file),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.bugAttachments(id) })
      } else {
        showToast(res.error ?? "Upload failed.", "error")
      }
    },
    onError: () => showToast("Upload failed.", "error"),
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(attachmentId),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.bugAttachments(id) })
      } else {
        showToast(res.error ?? "Could not remove attachment.", "error")
      }
    },
    onError: () => showToast("Could not remove attachment.", "error"),
  })

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentBody.trim()) return
    commentMutation.mutate(commentBody)
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-selecting the same file later
    if (!file) return
    uploadMutation.mutate(file)
  }

  async function handleDownload(attachment: Attachment) {
    try {
      await downloadAttachment(attachment.id, attachment.fileName)
    } catch {
      showToast("Download failed.", "error")
    }
  }

  const isActionPending = assignMutation.isPending || unassignMutation.isPending || statusMutation.isPending

  if (bugQuery.isPending) {
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
              {isManager && (
                !bug.assignment ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => assignMutation.mutate()}
                    disabled={isActionPending}
                  >
                    {assignMutation.isPending ? (
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
                    onClick={() => unassignMutation.mutate()}
                    disabled={isActionPending}
                  >
                    {unassignMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <RotateCcw className="h-3 w-3 mr-1" />
                    )}
                    Unassign
                  </Button>
                )
              )}

              {/* Status dropdown */}
              <select
                className="h-9 rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--bg-2)] px-2 text-xs text-[var(--text-1)] focus:border-[var(--primary)] focus:outline-none transition-all font-mono"
                value={bug.status}
                onChange={(e) => statusMutation.mutate(e.target.value as BugStatus)}
                disabled={isActionPending}
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
                        {bug.assignment.user?.name ?? `${bug.assignment.userId.slice(0, 8)}…`}
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

                {bug.severityBreakdown && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--text-3)]">Confidence</span>
                      <span className="font-mono text-[var(--text-1)]">
                        {bug.severityBreakdown.confidence}%
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-1)] space-y-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-3)] font-semibold">
                        How this was scored
                      </p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono">
                        <span className="text-[var(--text-3)]">Keywords</span>
                        <span className="text-right text-[var(--text-2)]">+{bug.severityBreakdown.keywordScore}</span>
                        <span className="text-[var(--text-3)]">Module ({bug.module})</span>
                        <span className="text-right text-[var(--text-2)]">+{bug.severityBreakdown.moduleScore}</span>
                        <span className="text-[var(--text-3)]">Detail depth</span>
                        <span className="text-right text-[var(--text-2)]">+{bug.severityBreakdown.depthBonus}</span>
                        <span className="text-[var(--text-3)]">Environment</span>
                        <span className="text-right text-[var(--text-2)]">×{bug.severityBreakdown.envMultiplier}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader className="pb-3 border-b border-[var(--border-1)]">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-[var(--text-3)]" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {attachments.length === 0 ? (
                  <p className="text-xs text-[var(--text-3)] text-center py-2">No files attached yet.</p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((file) => {
                      const isImage = file.mimeType.startsWith("image/")
                      const canRemove = isManager || file.uploadedBy?.id === user?.id
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--bg-1)] px-2.5 py-2"
                        >
                          {isImage ? (
                            <ImageIcon className="h-3.5 w-3.5 text-[var(--text-3)] shrink-0" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 text-[var(--text-3)] shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-[var(--text-1)] truncate">{file.fileName}</p>
                            <p className="text-[10px] text-[var(--text-3)] font-mono">
                              {(file.sizeBytes / 1024).toFixed(0)}KB
                              {file.uploadedBy && ` • ${file.uploadedBy.name}`}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDownload(file)}
                            title="Download"
                            className="shrink-0 rounded p-1 text-[var(--text-3)] hover:bg-[var(--bg-2)] hover:text-[var(--primary-strong)] transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          {canRemove && (
                            <button
                              onClick={() => deleteAttachmentMutation.mutate(file.id)}
                              disabled={deleteAttachmentMutation.isPending && deleteAttachmentMutation.variables === file.id}
                              title="Remove"
                              className="shrink-0 rounded p-1 text-[var(--text-3)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] transition-colors"
                            >
                              {deleteAttachmentMutation.isPending && deleteAttachmentMutation.variables === file.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                <label className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--border-2)] py-2.5 text-xs text-[var(--text-3)] hover:text-[var(--primary-strong)] hover:border-[var(--primary)] transition-colors cursor-pointer">
                  {uploadMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Paperclip className="h-3.5 w-3.5" />
                  )}
                  Attach a file
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploadMutation.isPending}
                    accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain"
                  />
                </label>
                <p className="text-[10px] text-[var(--text-3)] text-center">Images, PDF, or text — 5MB max</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity: system events + comments, in order */}
        <Card>
          <CardHeader className="border-b border-[var(--border-1)]">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--text-3)]" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {events.length === 0 ? (
              <p className="text-sm text-[var(--text-3)] text-center py-4">Nothing here yet.</p>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <ActivityRow key={event.id} event={event} />
                ))}
              </div>
            )}

            <form onSubmit={handleAddComment} className="flex items-start gap-2 pt-2 border-t border-[var(--border-1)]">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Add a comment…"
                rows={2}
                className="flex-1 mt-3 rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--bg-1)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all resize-none"
              />
              <Button type="submit" size="sm" className="mt-3" disabled={commentMutation.isPending || !commentBody.trim()}>
                {commentMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
