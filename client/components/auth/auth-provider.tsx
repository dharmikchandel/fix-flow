"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { getCurrentUser } from "@/lib/api"
import { getToken, clearToken } from "@/lib/auth"
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

/**
 * Gates every page except /login behind a valid session. Checks for a
 * stored token on mount and confirms it's still good by asking the API who
 * it belongs to (GET /auth/me) — a token that's merely present but expired
 * or revoked shouldn't be treated as "logged in".
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === "/login"

  const [user, setUser] = useState<AuthUser | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (isLoginPage) {
      // Already logged in and landed on /login anyway (e.g. typed the URL
      // directly) — send them straight to the app instead of showing the form.
      if (getToken()) {
        router.replace("/")
        return
      }
      setChecked(true)
      return
    }

    if (!getToken()) {
      router.replace("/login")
      return
    }

    getCurrentUser().then((current) => {
      if (!current) {
        clearToken()
        router.replace("/login")
        return
      }
      setUser(current)
      setChecked(true)
    })
  }, [isLoginPage, router])

  function logout() {
    clearToken()
    setUser(null)
    router.replace("/login")
  }

  if (isLoginPage) {
    return <AuthContext.Provider value={{ user, logout }}>{children}</AuthContext.Provider>
  }

  if (!checked) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  return <AuthContext.Provider value={{ user, logout }}>{children}</AuthContext.Provider>
}
