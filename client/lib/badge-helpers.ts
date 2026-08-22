import type { BadgeProps } from "@/components/ui/badge"

type BadgeVariant = NonNullable<BadgeProps["variant"]>

/**
 * Shared display helpers for bug severity/status badges and relative
 * timestamps. Previously copy-pasted verbatim into four page files —
 * centralized here so a color or wording change only has to happen once.
 */

export function severityVariant(label: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    Critical: "critical",
    High: "high",
    Medium: "medium",
    Low: "low",
  }
  return map[label] ?? "default"
}

export function statusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    open: "default",
    assigned: "assigned",
    in_progress: "inProgress",
    resolved: "resolved",
    closed: "default",
  }
  return map[status] ?? "default"
}

export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
