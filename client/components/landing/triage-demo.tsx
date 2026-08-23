"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { CheckCircle2 } from "lucide-react"

/**
 * The hero visual: a looping, four-stage dramatization of the real triage
 * engine — intake, severity scoring, duplicate detection, assignment — using
 * the exact numbers those services would actually produce for this example.
 * It's not a screenshot; it's the product's actual reasoning, staged.
 */

const STAGE_DURATIONS_MS = [2800, 4800, 2900, 3400]

const SEVERITY_BREAKDOWN = [
  { label: "Keywords", value: "+45" },
  { label: "Module (payment)", value: "+30" },
  { label: "Detail depth", value: "+10" },
  { label: "Environment", value: "×1.3" },
]

function subscribeToMotionPreference(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
  mq.addEventListener("change", callback)
  return () => mq.removeEventListener("change", callback)
}
function getMotionPreference() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
function getServerMotionPreference() {
  // No media queries during SSR — assume motion is fine; the real value
  // (from the browser) is read on the client via useSyncExternalStore
  // before paint, so this never causes a visible flash either way.
  return false
}

/** Subscribes directly to the browser's media query — no effect, no setState-on-mount. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeToMotionPreference, getMotionPreference, getServerMotionPreference)
}

function StageIntake() {
  return (
    <div className="fixflow-stage-enter space-y-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-3)]">New bug report</p>
      <h3 className="text-base font-semibold text-[var(--text-1)] leading-snug">
        Checkout hangs after payment confirmation
      </h3>
      <p className="text-xs text-[var(--text-3)] leading-relaxed">
        The checkout flow freezes right after the payment provider confirms the charge, leaving the order stuck.
      </p>
      <div className="flex gap-2 pt-1">
        <span className="px-2 py-0.5 rounded-full border border-[var(--border-1)] bg-[var(--bg-2)] text-[10px] font-mono text-[var(--text-2)]">
          payment
        </span>
        <span className="px-2 py-0.5 rounded-full border border-[var(--border-1)] bg-[var(--bg-2)] text-[10px] font-mono text-[var(--text-2)]">
          production
        </span>
      </div>
    </div>
  )
}

function StageSeverity() {
  const [score, setScore] = useState(0)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const duration = 900
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      setScore(Math.round(progress * 92))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="fixflow-stage-enter space-y-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-3)] flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--info)] animate-pulse" />
        Analyzing severity…
      </p>

      <div className="flex items-end justify-between">
        <div>
          <span className="text-4xl font-bold font-mono text-[var(--danger)]">{score}</span>
          <span className="text-sm font-mono text-[var(--text-3)]">/100</span>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-[var(--danger)] bg-[var(--danger-soft)] border border-[var(--danger)] shadow-[var(--glow-danger)]">
          Critical
        </span>
      </div>

      <div className="space-y-1.5">
        {SEVERITY_BREAKDOWN.map((row, i) => (
          <div
            key={row.label}
            className="flex items-center justify-between text-[11px] font-mono fixflow-stage-enter"
            style={{ animationDelay: `${200 + i * 140}ms` }}
          >
            <span className="text-[var(--text-3)]">{row.label}</span>
            <span className="text-[var(--text-2)]">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-1)] text-xs">
        <span className="text-[var(--text-3)]">Confidence</span>
        <span className="font-mono text-[var(--text-1)]">94%</span>
      </div>
    </div>
  )
}

function StageDuplicate() {
  return (
    <div className="fixflow-stage-enter space-y-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-3)] flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)] animate-pulse" />
        Scanning open bugs for duplicates…
      </p>

      <div
        className="rounded-[var(--radius-md)] border border-[var(--warning-soft)] bg-[var(--bg-2)] p-3.5 space-y-2 fixflow-stage-enter"
        style={{ animationDelay: "300ms" }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[var(--text-1)]">Payment confirmation freezes UI</span>
          <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--warning-soft)] text-[var(--warning)]">
            78% match
          </span>
        </div>
        <p className="text-[11px] text-[var(--text-3)] font-mono">reported 2 days ago · payment</p>
      </div>

      <p className="text-[11px] text-[var(--text-3)] leading-relaxed">
        Likely duplicate found — linked automatically so it doesn&rsquo;t get triaged twice.
      </p>
    </div>
  )
}

function StageAssignment() {
  return (
    <div className="fixflow-stage-enter space-y-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-3)] flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
        Matched to an engineer
      </p>

      <div className="flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--bg-3)] border border-[var(--border-1)] flex items-center justify-center text-xs font-semibold text-[var(--primary-strong)]">
          DA
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text-1)]">Diego Alvarez</p>
          <p className="text-[11px] font-mono text-[var(--text-3)]">Payment expert · lowest workload</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-[var(--text-3)]">Workload</span>
          <span className="text-[var(--text-2)]">3 / 4</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[var(--bg-3)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--primary)] fixflow-grow-bar"
            style={{ "--fixflow-target-width": "75%" } as React.CSSProperties}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--border-1)]">
        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
        <span className="text-xs font-medium text-[var(--success)]">Assigned</span>
      </div>
    </div>
  )
}

const STAGES = [StageIntake, StageSeverity, StageDuplicate, StageAssignment]

export function TriageDemo() {
  const reducedMotion = usePrefersReducedMotion()
  const [stage, setStage] = useState(0)

  useEffect(() => {
    if (reducedMotion) return
    const timer = setTimeout(() => setStage((s) => (s + 1) % STAGES.length), STAGE_DURATIONS_MS[stage])
    return () => clearTimeout(timer)
  }, [stage, reducedMotion])

  const activeStage = reducedMotion ? STAGES.length - 1 : stage
  const ActiveStage = STAGES[activeStage]!

  return (
    <div className="relative w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--border-2)] bg-[var(--bg-1)] shadow-[var(--shadow-md)] overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-3)]">Live triage</span>
        <div className="flex gap-1.5">
          {STAGES.map((_, i) => (
            <span
              key={i}
              className={`h-1 w-6 rounded-full transition-colors duration-500 ${
                i === activeStage ? "bg-[var(--primary)]" : i < activeStage ? "bg-[var(--primary-soft)]" : "bg-[var(--bg-3)]"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-5 min-h-[268px]">
        <ActiveStage />
      </div>
    </div>
  )
}
