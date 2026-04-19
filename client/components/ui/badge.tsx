import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "critical" | "high" | "medium" | "low" | "duplicate" | "assigned" | "inProgress" | "resolved"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        {
          "bg-[var(--bg-3)] text-[var(--text-2)]": variant === "default" || variant === "low",
          "bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger-soft)]": variant === "critical",
          "bg-gradient-to-r from-[var(--danger-soft)] to-[var(--primary-soft)] text-[#E090F0] border border-[#a66aa8]/30": variant === "high",
          "bg-[var(--primary-soft)] text-[var(--primary-strong)] border border-[var(--primary-soft)]": variant === "medium" || variant === "assigned",
          "bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning-soft)]": variant === "duplicate",
          "bg-[var(--info-soft)] text-[var(--info)] border border-[var(--info-soft)]": variant === "inProgress",
          "bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-soft)]": variant === "resolved",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
