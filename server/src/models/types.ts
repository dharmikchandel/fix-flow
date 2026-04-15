// ─── Bug Report Types ────────────────────────────────────────────────────────

export interface CreateBugInput {
  title: string;
  description: string;
  stepsToReproduce?: string;
  module: string;
  environment?: string;
}

export interface SeverityResult {
  score: number;
  label: SeverityLabel;
}

export type SeverityLabel = "Low" | "Medium" | "High" | "Critical";

export interface DuplicateMatch {
  bugId: string;
  title: string;
  similarity: number;
}

export interface BugSubmissionResponse {
  bugId: string;
  severity: SeverityResult;
  duplicates: DuplicateMatch[];
}

// ─── User / Engineer Types ───────────────────────────────────────────────────

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: string;
  expertise: string[];
  maxCapacity?: number;
}

export interface EngineerProfile {
  id: string;
  name: string;
  expertise: string[];
  workload: number;
  maxCapacity: number;
  available: boolean;
}

// ─── Assignment Types ────────────────────────────────────────────────────────

export interface AssignmentInput {
  bugId: string;
}

export interface AssignmentResult {
  assignedTo: string;
  engineerName: string;
  reason: string;
}

// ─── Priority Queue Types ────────────────────────────────────────────────────

export interface PriorityItem {
  bugId: string;
  title: string;
  severityScore: number;
  severityLabel: string;
  ageHours: number;
  priorityScore: number;
  priority: number;
  assignedTo: string | null;
  status: string;
}

// ─── API Response Wrapper ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
