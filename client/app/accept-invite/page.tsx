"use client"

import { Suspense, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthCard, authInputClass } from "@/components/auth/auth-card"
import { acceptInvite } from "@/lib/api"
import { setToken } from "@/lib/auth"

function AcceptInviteForm() {
  const router = useRouter()
  const token = useSearchParams().get("token")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  if (!token) {
    return (
      <AuthCard subtitle="Join a workspace.">
        <div className="flex items-center gap-2 rounded-md bg-[var(--danger-soft)] border border-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          This invite link is missing its token. Ask whoever invited you for a fresh link.
        </div>
      </AuthCard>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    startTransition(async () => {
      const res = await acceptInvite(token!, name, password)
      if (!res.success || !res.data) {
        setError(res.error ?? "Could not accept this invite.")
        return
      }
      setToken(res.data.token)
      router.replace("/")
    })
  }

  return (
    <AuthCard
      subtitle="Set a name and password to join your team's workspace."
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
          <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className={authInputClass}
            required
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">Choose a password</label>
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
          Join workspace
        </Button>
      </form>
    </AuthCard>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteForm />
    </Suspense>
  )
}
