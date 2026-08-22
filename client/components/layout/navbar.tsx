"use client"

import { Search, Bell, Building2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"

export function Navbar() {
  const { user } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--border-1)] bg-[var(--bg-0)] px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden md:flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-[var(--text-3)]" />
          <input 
            type="text" 
            placeholder="Search bug ID, module, or keyword..."
            className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--bg-1)] pl-9 pr-4 text-[14.7px] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
          />
          <div className="absolute right-3 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-[var(--border-1)] bg-[var(--bg-2)] px-1.5 font-mono text-[10.5px] font-medium text-[var(--text-3)]">
              <span className="text-sm">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Current workspace */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--info-soft)] bg-[var(--bg-1)] px-3 py-1 font-mono text-sm text-[var(--info)]">
            <Building2 className="h-3 w-3" />
            <span>{user.organizationName}</span>
          </div>
        )}
        
        {/* Notifications */}
        <button className="relative rounded-full p-2 text-[var(--text-3)] hover:bg-[var(--bg-2)] hover:text-[var(--text-1)] transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-[var(--danger)] shadow-[var(--shadow-glow-danger)]"></span>
        </button>

        {/* Current user */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-[var(--text-1)] leading-tight">{user.name}</p>
              <p className="text-xs text-[var(--text-3)] font-mono leading-tight">{user.role}</p>
            </div>
            <div className="h-8 w-8 rounded-full border border-[var(--border-2)] bg-[var(--bg-2)] overflow-hidden flex items-center justify-center text-sm font-semibold text-[var(--primary-strong)]">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
