import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "secondary" | "destructive" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild: _asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          {
            "bg-[linear-gradient(135deg,var(--primary)_0%,var(--info)_100%)] text-white hover:scale-[1.02] hover:shadow-[var(--glow-primary)]": variant === "default",
            "bg-[var(--bg-2)] border border-[var(--border-2)] text-[var(--primary-strong)] hover:border-[var(--primary)] hover:shadow-[var(--glow-primary)]": variant === "secondary",
            "bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)] hover:bg-[var(--danger)] hover:text-white hover:shadow-[var(--glow-danger)]": variant === "destructive",
            "text-[var(--text-2)] hover:bg-[var(--bg-2)] hover:text-[var(--text-1)]": variant === "ghost",
            "h-10 px-4 py-2": size === "default",
            "h-9 px-3": size === "sm",
            "h-11 px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }

