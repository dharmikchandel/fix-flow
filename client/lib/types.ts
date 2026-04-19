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

export interface BugAssignment {
  id: string
  bugId: string
  userId: string
  reason: string
  createdAt: string
  user?: Engineer
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
