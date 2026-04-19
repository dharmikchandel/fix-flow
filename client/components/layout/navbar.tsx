import { Search, Bell, Activity } from "lucide-react"

export function Navbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--border-1)] bg-[var(--bg-0)] px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden md:flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-[var(--text-3)]" />
          <input 
            type="text" 
            placeholder="Search bug ID, module, or keyword..."
            className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--bg-1)] pl-9 pr-4 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
          />
          <div className="absolute right-3 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-[var(--border-1)] bg-[var(--bg-2)] px-1.5 font-mono text-[10px] font-medium text-[var(--text-3)]">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Environment Indicator */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--info-soft)] bg-[var(--bg-1)] px-3 py-1 font-mono text-xs text-[var(--info)]">
          <Activity className="h-3 w-3" />
          <span>backend: connected</span>
        </div>
        
        {/* Notifications */}
        <button className="relative rounded-full p-2 text-[var(--text-3)] hover:bg-[var(--bg-2)] hover:text-[var(--text-1)] transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-[var(--danger)] shadow-[var(--shadow-glow-danger)]"></span>
        </button>

        {/* User Profile Stub */}
        <div className="h-8 w-8 rounded-full border border-[var(--border-2)] bg-[var(--bg-2)] overflow-hidden">
          <div className="h-full w-full bg-[linear-gradient(135deg,#2F80FF_0%,#1A2130_100%)] opacity-80" />
        </div>
      </div>
    </header>
  )
}
