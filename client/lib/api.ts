import type {
  Bug,
  BugSubmissionResponse,
  CreateBugInput,
  Engineer,
  AssignmentResult,
  PriorityItem,
  ApiResponse,
  BugStatus,
  AuthUser,
  LoginResponse,
  RegisterInput,
  Invite,
  CreateInviteInput,
  BugEvent,
  Attachment,
  NotificationsResponse,
  AppNotification,
  PaginatedBugs,
  AnalyticsResult,
} from "./types"

import axios, { AxiosRequestConfig } from "axios"
import { getToken, clearToken } from "./auth"

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

const client = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
})

// Attach the logged-in user's token to every request, if there is one.
client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`)
  }
  return config
})

// A 401 means the token is missing, expired, or invalid — clear it and send
// the user back to the login page rather than showing a confusing error.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && typeof window !== "undefined") {
      clearToken()
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

async function request<T>(
  path: string,
  options?: AxiosRequestConfig & { cache?: string; body?: string }
): Promise<ApiResponse<T>> {
  try {
    const dataToSend = options?.body ? JSON.parse(options.body) : options?.data;
    const res = await client.request<ApiResponse<T>>({
      url: path,
      method: options?.method || "GET",
      data: dataToSend,
      ...options,
    })

    return res.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(`[API Axios Error] ${path}:`, error.response?.data || error.message)
      return (error.response?.data as ApiResponse<T>) || { success: false, error: error.message }
    }
    console.error(`[API Fetch Error] ${path}:`, error)
    return { success: false, error: "Network error or server unreachable" }
  }
}

// ─── Bugs ─────────────────────────────────────────────────────────────────────

export interface ListBugsOptions {
  status?: string
  search?: string
  page?: number
  pageSize?: number
}

const EMPTY_PAGE: PaginatedBugs = { bugs: [], total: 0, page: 1, pageSize: 20 }

export async function listBugs(options: ListBugsOptions = {}): Promise<PaginatedBugs> {
  const params = new URLSearchParams()
  if (options.status) params.set("status", options.status)
  if (options.search) params.set("search", options.search)
  if (options.page) params.set("page", String(options.page))
  if (options.pageSize) params.set("pageSize", String(options.pageSize))
  const qs = params.toString() ? `?${params.toString()}` : ""

  const res = await request<PaginatedBugs>(`/bugs${qs}`, { cache: "no-store" })
  return res.data ?? EMPTY_PAGE
}

export async function getBug(id: string): Promise<Bug | null> {
  const res = await request<Bug>(`/bugs/${id}`, { cache: "no-store" })
  return res.data ?? null
}

export async function submitBug(
  input: CreateBugInput
): Promise<ApiResponse<BugSubmissionResponse>> {
  return request<BugSubmissionResponse>("/bugs", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function updateBugStatus(
  id: string,
  status: BugStatus
): Promise<ApiResponse<Bug>> {
  return request<Bug>(`/bugs/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function assignBug(
  bugId: string
): Promise<ApiResponse<AssignmentResult>> {
  return request<AssignmentResult>("/assign", {
    method: "POST",
    body: JSON.stringify({ bugId }),
  })
}

export async function assignBugToEngineer(
  bugId: string,
  engineerId: string
): Promise<ApiResponse<AssignmentResult>> {
  return request<AssignmentResult>("/assign/manual", {
    method: "POST",
    body: JSON.stringify({ bugId, engineerId }),
  })
}

export async function unassignBug(
  bugId: string
): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>(`/assign/${bugId}`, {
    method: "DELETE",
  })
}

// ─── Priority Queue ───────────────────────────────────────────────────────────

export async function getPriorityQueue(): Promise<PriorityItem[]> {
  const res = await request<PriorityItem[]>("/priority", { cache: "no-store" })
  return res.data ?? []
}

// ─── Users / Engineers ────────────────────────────────────────────────────────

export async function listUsers(): Promise<Engineer[]> {
  const res = await request<Engineer[]>("/users", { cache: "no-store" })
  return res.data ?? []
}

export async function getUser(id: string): Promise<Engineer | null> {
  const res = await request<Engineer>(`/users/${id}`, { cache: "no-store" })
  return res.data ?? null
}

export async function toggleAvailability(
  userId: string,
  available: boolean
): Promise<ApiResponse<{ id: string; name: string; available: boolean }>> {
  return request(`/users/${userId}/availability`, {
    method: "PATCH",
    body: JSON.stringify({ available }),
  })
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<ApiResponse<LoginResponse>> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const res = await request<AuthUser>("/auth/me", { cache: "no-store" })
  return res.data ?? null
}

export async function register(input: RegisterInput): Promise<ApiResponse<LoginResponse>> {
  return request<LoginResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

// ─── Invites ──────────────────────────────────────────────────────────────────

export async function listInvites(): Promise<Invite[]> {
  const res = await request<Invite[]>("/invites", { cache: "no-store" })
  return res.data ?? []
}

export async function createInvite(input: CreateInviteInput): Promise<ApiResponse<Invite>> {
  return request<Invite>("/invites", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function revokeInvite(inviteId: string): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>(`/invites/${inviteId}`, { method: "DELETE" })
}

export async function acceptInvite(
  token: string,
  name: string,
  password: string
): Promise<ApiResponse<LoginResponse>> {
  return request<LoginResponse>("/invites/accept", {
    method: "POST",
    body: JSON.stringify({ token, name, password }),
  })
}

// ─── Bug timeline (events + comments) ────────────────────────────────────────

export async function listEvents(bugId: string): Promise<BugEvent[]> {
  const res = await request<BugEvent[]>(`/bugs/${bugId}/events`, { cache: "no-store" })
  return res.data ?? []
}

export async function addComment(bugId: string, body: string): Promise<ApiResponse<BugEvent>> {
  return request<BugEvent>(`/bugs/${bugId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  })
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export async function listAttachments(bugId: string): Promise<Attachment[]> {
  const res = await request<Attachment[]>(`/bugs/${bugId}/attachments`, { cache: "no-store" })
  return res.data ?? []
}

export async function uploadAttachment(bugId: string, file: File): Promise<ApiResponse<Attachment>> {
  const form = new FormData()
  form.append("file", file)
  try {
    // The shared client defaults to "Content-Type: application/json" — override
    // it to `undefined` here so the browser sets the multipart boundary itself
    // instead of axios sending the wrong content type with a FormData body.
    const res = await client.post<ApiResponse<Attachment>>(`/bugs/${bugId}/attachments`, form, {
      headers: { "Content-Type": undefined },
    })
    return res.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return (error.response?.data as ApiResponse<Attachment>) || { success: false, error: error.message }
    }
    return { success: false, error: "Network error or server unreachable" }
  }
}

export async function deleteAttachment(attachmentId: string): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>(`/attachments/${attachmentId}`, { method: "DELETE" })
}

/** Downloads a file with the logged-in user's auth header and saves it via the browser. */
export async function downloadAttachment(attachmentId: string, fileName: string): Promise<void> {
  const res = await client.get(`/attachments/${attachmentId}`, { responseType: "blob" })
  const url = window.URL.createObjectURL(res.data as Blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function listNotifications(): Promise<NotificationsResponse> {
  const res = await request<NotificationsResponse>("/notifications", { cache: "no-store" })
  return res.data ?? { notifications: [], unreadCount: 0 }
}

export async function markNotificationRead(id: string): Promise<ApiResponse<AppNotification>> {
  return request<AppNotification>(`/notifications/${id}/read`, { method: "PATCH" })
}

export async function markAllNotificationsRead(): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>("/notifications/read-all", { method: "POST" })
}

// ─── Analytics ────────────────────────────────────────────────────────────────

const EMPTY_ANALYTICS: AnalyticsResult = {
  totals: {
    openBugs: 0,
    criticalBugs: 0,
    unassignedBugs: 0,
    engineersOverloaded: 0,
    duplicateRatePercent: 0,
    avgTriageHours: null,
  },
  severityDistribution: [],
  statusBreakdown: [],
  moduleBreakdown: [],
}

export async function getAnalytics(): Promise<AnalyticsResult> {
  const res = await request<AnalyticsResult>("/analytics", { cache: "no-store" })
  return res.data ?? EMPTY_ANALYTICS
}
