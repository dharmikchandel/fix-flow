"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthCard, authInputClass } from "@/components/auth/auth-card"
import { register } from "@/lib/api"
import { setToken } from "@/lib/auth"

export default function RegisterPage() {
  const router = useRouter()
  const [organizationName, setOrganizationName] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    startTransition(async () => {
      const res = await register({ organizationName, name, email, password })
      if (!res.success || !res.data) {
        setError(res.error ?? "Could not create your workspace.")
        return
      }
      setToken(res.data.token)
      router.replace("/dashboard")
    })
  }

  return (
    <AuthCard
      subtitle="Create a new workspace for your team."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--primary-strong)] hover:text-[var(--primary)] transition-colors">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">Workspace name</label>
          <input
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="Acme Engineering"
            className={authInputClass}
            required
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jordan Lee"
            className={authInputClass}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className={authInputClass}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className={authInputClass}
            required
            minLength={6}
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
          Create workspace
        </Button>
      </form>
    </AuthCard>
  )
}
