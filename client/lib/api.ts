import type {
  Bug,
  BugSubmissionResponse,
  CreateBugInput,
  Engineer,
  AssignmentResult,
  PriorityItem,
  ApiResponse,
  BugStatus,
} from "./types"

import axios, { AxiosRequestConfig } from "axios"

const isServer = typeof window === "undefined"
const BASE = isServer ? process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000/api" : "/api"

const client = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
})

async function request<T>(
  path: string,
  options?: AxiosRequestConfig & { cache?: string; body?: any }
): Promise<ApiResponse<T>> {
  try {
    const dataToSend = options?.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : options?.data;
    const res = await client.request<ApiResponse<T>>({
      url: path,
      method: options?.method || "GET",
      data: dataToSend,
      ...options,
    })
    
    return res.data
  } catch (error: any) {
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
