"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Bug, ListTodo, Users, BarChart2, Settings } from "lucide-react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bugs", label: "Bugs", icon: Bug },
  { href: "/triage", label: "Triage Queue", icon: ListTodo },
  { href: "/assignments", label: "Assignments", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-[var(--border-1)] bg-[var(--bg-0)] hidden md:block">
      <div className="flex h-16 items-center border-b border-[var(--border-1)] px-6">
        <div className="flex items-center gap-2 font-mono text-lg font-bold">
          <div className="h-6 w-6 rounded flex items-center justify-center bg-[linear-gradient(135deg,var(--primary)_0%,var(--info)_100%)]">
            <span className="text-xs text-white">FT</span>
          </div>
          <span className="bg-clip-text text-transparent bg-[linear-gradient(135deg,var(--text-1)_0%,var(--text-3)_100%)]">
            FixFlow
          </span>
        </div>
      </div>
      <nav className="p-4 space-y-1">
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
    </aside>
  )
}
