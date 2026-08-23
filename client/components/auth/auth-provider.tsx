"use client"

import { createContext, useContext, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { getCurrentUser } from "@/lib/api"
import { getToken, clearToken } from "@/lib/auth"
import { queryKeys } from "@/lib/queryKeys"
import type { AuthUser } from "@/lib/types"

interface AuthContextValue {
  user: AuthUser | null
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}

// The landing page, /login, and /register all redirect straight to the app
// if you're already signed in — there's no reason to show a marketing page
// or a login form to someone who's already in. /accept-invite never
// redirects either way — someone might deliberately want to accept a
// different invite while a stale session is still around.
const AUTH_PAGES = ["/", "/login", "/register"]
const OPEN_PAGES = ["/accept-invite"]

/**
 * Gates every page except the ones above behind a valid session. "Logged in"
 * means both a token is present *and* the API still recognizes it — asking
 * GET /auth/me (via React Query) catches a token that's merely present but
 * expired or revoked, and gives every other page a shared, cached answer to
 * "who am I" instead of each one asking separately.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()

  const isAuthPage = AUTH_PAGES.includes(pathname)
  const isOpenPage = OPEN_PAGES.includes(pathname)
  const isPublicPage = isAuthPage || isOpenPage
  const hasToken = getToken() !== null

  const userQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const current = await getCurrentUser()
      if (!current) throw new Error("Not authenticated")
      return current
    },
    enabled: !isPublicPage && hasToken,
    retry: false,
  })

  useEffect(() => {
    if (isAuthPage) {
      if (hasToken) router.replace("/dashboard")
      return
    }
    if (isOpenPage) return

    if (!hasToken) {
      router.replace("/login")
      return
    }
    if (userQuery.isError) {
      clearToken()
      router.replace("/login")
    }
  }, [isAuthPage, isOpenPage, hasToken, userQuery.isError, router])

  function logout() {
    clearToken()
    queryClient.clear()
    router.replace("/login")
  }

  if (isPublicPage) {
    return <AuthContext.Provider value={{ user: null, logout }}>{children}</AuthContext.Provider>
  }

  if (!hasToken || userQuery.isPending) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  return <AuthContext.Provider value={{ user: userQuery.data ?? null, logout }}>{children}</AuthContext.Provider>
}
