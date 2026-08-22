/**
 * Where the login token lives: the browser's localStorage. This is a
 * deliberate, simple choice — the API and the app run on different origins
 * in dev (localhost:3000 / localhost:4000), and there's no server-side proxy
 * between them, so an httpOnly cookie would need extra cross-origin cookie
 * plumbing for no real security gain here. The token is sent as a normal
 * `Authorization` header (see the interceptor in `lib/api.ts`), the same way
 * most API clients do it.
 */
const TOKEN_KEY = "fixflow_token"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(TOKEN_KEY)
}
