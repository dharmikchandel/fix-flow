"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { login } from "@/lib/api"
import { setToken } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    startTransition(async () => {
      const res = await login(email, password)
      if (!res.success || !res.data) {
        setError(res.error ?? "Login failed.")
        return
      }
      setToken(res.data.token)
      router.replace("/")
    })
  }

  const inputClass =
    "w-full rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--bg-1)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"

  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--bg-0)] p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-10 w-10 rounded-[var(--radius-md)] flex items-center justify-center bg-[linear-gradient(135deg,var(--primary)_0%,var(--info)_100%)]">
            <Bug className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">FixFlow</h1>
            <p className="text-sm text-[var(--text-3)] mt-1">Sign in to the triage console.</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[var(--radius-xl)] border border-[var(--border-1)] bg-[var(--bg-1)] p-6 shadow-[var(--shadow-md)]"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@fixflow.dev"
              className={inputClass}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-[var(--danger-soft)] border border-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" variant="default" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
