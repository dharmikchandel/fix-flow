// ─── Core API shapes mirroring server/src/models/types.ts ────────────────────

export type SeverityLabel = "Low" | "Medium" | "High" | "Critical"

export interface SeverityResult {
  score: number
  label: SeverityLabel
}

export interface DuplicateMatch {
  bugId: string
  title: string
  similarity: number
}

/** The subset of an engineer's profile the API includes alongside an assignment. */
export interface AssigneeSummary {
  id: string
  name: string
  email: string
  role: string
}

export interface BugAssignment {
  id: string
  bugId: string
  userId: string
  reason: string
  createdAt: string
  user?: AssigneeSummary
}

/**
 * How a bug's severity score was arrived at — keyword hits, module weight,
 * description depth, environment multiplier — plus a confidence read on the
 * label. Only present on the single-bug detail response, not list views.
 */
export interface SeverityBreakdown {
  score: number
  label: SeverityLabel
  confidence: number
  keywordScore: number
  moduleScore: number
  depthBonus: number
  envMultiplier: number
}

export interface Bug {
  id: string
  title: string
  description: string
  stepsToReproduce?: string | null
  module: string
  environment?: string | null
  severityScore: number
  severityLabel: string
  status: string
  createdAt: string
  updatedAt: string
  assignment?: BugAssignment | null
  severityBreakdown?: SeverityBreakdown
}

export interface BugSubmissionResponse {
  bugId: string
  severity: SeverityResult
  duplicates: DuplicateMatch[]
}

export interface Engineer {
  id: string
  name: string
  email: string
  role: string
  expertise: string[]
  workload: number
  maxCapacity: number
  available: boolean
  createdAt: string
}

export interface AssignmentResult {
  assignedTo: string
  engineerName: string
  reason: string
}

export interface PriorityItem {
  bugId: string
  title: string
  severityScore: number
  severityLabel: string
  ageHours: number
  priorityScore: number
  priority: number
  assignedTo: string | null
  status: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export type BugStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed"

export interface CreateBugInput {
  title: string
  description: string
  stepsToReproduce?: string
  module: string
  environment?: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  organizationId: string
  organizationName: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export interface RegisterInput {
  organizationName: string
  name: string
  email: string
  password: string
}

// ─── Invites ──────────────────────────────────────────────────────────────────

export interface Invite {
  id: string
  email: string
  role: string
  expertise: string[]
  maxCapacity: number
  token: string
  expiresAt: string
  createdAt: string
}

export interface CreateInviteInput {
  email: string
  role?: string
  expertise?: string[]
  maxCapacity?: number
}

// ─── Bug timeline (events + comments) ────────────────────────────────────────

export type BugEventType = "created" | "status_changed" | "assigned" | "unassigned" | "comment"

export interface BugEvent {
  id: string
  bugId: string
  type: BugEventType
  comment?: string | null
  fromStatus?: string | null
  toStatus?: string | null
  reason?: string | null
  createdAt: string
  actor?: { id: string; name: string } | null
  assignee?: { id: string; name: string } | null
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export interface Attachment {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
  uploadedBy?: { id: string; name: string } | null
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | "bug_assigned"
  | "critical_bug"
  | "comment_on_your_bug"
  | "status_changed_on_your_bug"

export interface AppNotification {
  id: string
  type: NotificationType
  message: string
  bugId?: string | null
  readAt?: string | null
  createdAt: string
}

export interface NotificationsResponse {
  notifications: AppNotification[]
  unreadCount: number
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsTotals {
  openBugs: number
  criticalBugs: number
  unassignedBugs: number
  engineersOverloaded: number
  duplicateRatePercent: number
  avgTriageHours: number | null
}

export interface AnalyticsResult {
  totals: AnalyticsTotals
  severityDistribution: { label: string; count: number }[]
  statusBreakdown: { status: string; count: number }[]
  moduleBreakdown: { module: string; count: number; criticalCount: number }[]
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedBugs {
  bugs: Bug[]
  total: number
  page: number
  pageSize: number
}
