import { Bug } from "lucide-react"

/** Shared input styling across the login/register/accept-invite forms. */
export const authInputClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--bg-1)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"

/** The shared frame around every auth screen: logo, title, subtitle, card, optional footer link. */
export function AuthCard({
  subtitle,
  children,
  footer,
}: {
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--bg-0)] p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-10 w-10 rounded-[var(--radius-md)] flex items-center justify-center bg-[linear-gradient(135deg,var(--primary)_0%,var(--info)_100%)]">
            <Bug className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">FixFlow</h1>
            <p className="text-sm text-[var(--text-3)] mt-1">{subtitle}</p>
          </div>
        </div>

        <div className="space-y-4 rounded-[var(--radius-xl)] border border-[var(--border-1)] bg-[var(--bg-1)] p-6 shadow-[var(--shadow-md)]">
          {children}
        </div>

        {footer && <p className="text-center text-sm text-[var(--text-3)]">{footer}</p>}
      </div>
    </div>
  )
}
