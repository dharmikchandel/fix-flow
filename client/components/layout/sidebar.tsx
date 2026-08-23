"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Bug, ListTodo, Users, BarChart2, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"

// Settings will be added back once that page exists — linking to it before
// then would just produce a 404 from the sidebar.
const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bugs", label: "Bugs", icon: Bug },
  { href: "/triage", label: "Triage Queue", icon: ListTodo },
  { href: "/assignments", label: "Assignments", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside className="w-64 border-r border-[var(--border-1)] bg-[var(--bg-0)] hidden md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-[var(--border-1)] px-6 shrink-0">
        <div className="flex items-center gap-2 font-mono text-lg font-bold">
          <div className="h-6 w-6 rounded flex items-center justify-center bg-[linear-gradient(135deg,var(--primary)_0%,var(--info)_100%)]">
            <span className="text-xs text-white">FT</span>
          </div>
          <span className="bg-clip-text text-transparent bg-[linear-gradient(135deg,var(--text-1)_0%,var(--text-3)_100%)]">
            FixFlow
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[var(--bg-2)] text-[var(--text-1)] shadow-[0_0_12px_var(--primary-soft)]"
                  : "text-[var(--text-3)] hover:bg-[var(--bg-1)] hover:text-[var(--text-1)]"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -mt-2 h-4 w-1 rounded-r bg-[var(--primary)] shadow-[var(--shadow-glow-primary)]" />
              )}
              <Icon
                className={cn("h-4 w-4 transition-colors", isActive ? "text-[var(--primary)]" : "text-[var(--text-3)] group-hover:text-[var(--text-2)]")}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out — pinned to the bottom left, styled like a nav row so it
          reads as part of the same list instead of a bolted-on extra. */}
      {user && (
        <div className="border-t border-[var(--border-1)] p-4 shrink-0">
          <button
            onClick={logout}
            className="cursor-pointer group flex w-full justify-center items-center gap-4 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--text-3)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] transition-all duration-150"
          >
            Log out
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border-1)] bg-[var(--bg-2)] transition-colors group-hover:border-[var(--danger-soft)] group-hover:bg-[var(--bg-0)]">
              <LogOut className="h-3.5 w-3.5 text-[var(--text-3)] group-hover:text-[var(--danger)] transition-colors" />
            </span>
          </button>
        </div>
      )}
    </aside>
  )
}
