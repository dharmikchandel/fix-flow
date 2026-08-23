"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell, Building2, Check, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { listNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api"
import type { AppNotification } from "@/lib/types"

const POLL_INTERVAL_MS = 30_000

function notificationTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function NotificationBell() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const res = await listNotifications()
    setNotifications(res.notifications)
    setUnreadCount(res.unreadCount)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleOpenNotification(n: AppNotification) {
    if (!n.readAt) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)))
      setUnreadCount((c) => Math.max(c - 1, 0))
      markNotificationRead(n.id)
    }
    setOpen(false)
    if (n.bugId) router.push(`/bugs/${n.bugId}`)
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })))
    setUnreadCount(0)
    await markAllNotificationsRead()
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer relative rounded-full p-2 text-[var(--text-3)] hover:bg-[var(--bg-2)] hover:text-[var(--text-1)] transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-[var(--danger)] shadow-[var(--shadow-glow-danger)]"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-[var(--radius-lg)] border border-[var(--border-2)] bg-[var(--bg-1)] shadow-[var(--shadow-md)] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-1)]">
            <span className="text-sm font-semibold uppercase tracking-wider text-[var(--text-2)]">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-[var(--primary-strong)] hover:text-[var(--primary)] transition-colors"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-[var(--text-3)] text-center py-8">You&rsquo;re all caught up.</p>
            ) : (
              <div className="divide-y divide-[var(--border-1)]">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleOpenNotification(n)}
                    className={`cursor-pointer w-full text-left px-4 py-3 hover:bg-[var(--bg-2)] transition-colors flex items-start gap-2 ${
                      !n.readAt ? "bg-[var(--primary-soft)]" : ""
                    }`}
                  >
                    {!n.readAt && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--primary)] shrink-0" />}
                    <div className={`min-w-0 ${n.readAt ? "pl-3.5" : ""}`}>
                      <p className="text-sm text-[var(--text-1)] leading-snug">{n.message}</p>
                      <p className="text-xs text-[var(--text-3)] font-mono mt-0.5">
                        {notificationTimeAgo(n.createdAt)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

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
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-[var(--border-1)] bg-[var(--bg-2)] px-1.5 font-mono text-xs font-medium text-[var(--text-3)]">
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

        <NotificationBell />

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
