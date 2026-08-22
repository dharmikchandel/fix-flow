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

export async function listBugs(status?: string): Promise<Bug[]> {
  const qs = status ? `?status=${status}` : ""
  const res = await request<Bug[]>(`/bugs${qs}`, {
    cache: "no-store",
  })
  return res.data ?? []
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
