import Link from "next/link"
import {
  ArrowRight, Gauge, Scan, UserCheck, ListTodo, Eye,
  MessageSquare, Paperclip, Bell, Shield, ChartColumn,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/landing/reveal"
import { TriageDemo } from "@/components/landing/triage-demo"

export const metadata = {
  title: "FixFlow — Bug triage that shows its work",
  description:
    "FixFlow scores every bug's severity, flags duplicates, and assigns the right engineer using fixed, readable rules — not a black-box model.",
}

const ENGINE_FEATURES = [
  {
    icon: Gauge,
    title: "Severity scoring",
    body: "Every bug gets a score from 0–100 the instant it's submitted — built from keyword signals, which part of the product is affected, how much detail was given, and where it happened. A confidence reading comes with it, so you know how sure the number actually is.",
  },
  {
    icon: Scan,
    title: "Duplicate detection",
    body: "New reports are automatically compared against everything already open. Likely duplicates are flagged the moment they land, ranked by how closely they match — no more triaging the same bug three times.",
  },
  {
    icon: UserCheck,
    title: "Smart assignment",
    body: "Bugs go to whichever available engineer knows that part of the product and currently has the lightest workload — with a plain-English reason attached, every time. A lead can still hand-pick someone when it matters.",
  },
  {
    icon: ListTodo,
    title: "Priority queue",
    body: "One ranked list of everything that needs attention, blending severity, how long a bug has waited, and whether it's assigned yet — so nothing important gets buried under whatever came in most recently.",
  },
]

const TEAM_FEATURES = [
  {
    icon: MessageSquare,
    title: "Talk it through",
    body: "Every bug carries a running history and a real comment thread, so the context lives with the bug — not scattered across a chat channel nobody can search.",
  },
  {
    icon: Paperclip,
    title: "Bring the evidence",
    body: "Attach screenshots and logs straight to the bug. No more hunting for “was there a screenshot for this?” three threads back.",
  },
  {
    icon: Bell,
    title: "Know the moment it matters",
    body: "Get notified the instant a bug lands in your queue, someone comments on your report, or something Critical comes in.",
  },
]

const HEATMAP_DEMO = [
  { module: "payment", intensity: 0.5, critical: true },
  { module: "auth", intensity: 0.32, critical: false },
  { module: "ui", intensity: 0.14, critical: false },
  { module: "api", intensity: 0.22, critical: false },
  { module: "database", intensity: 0.06, critical: false },
  { module: "docs", intensity: 0.06, critical: false },
]

export default function LandingPage() {
  return (
    <div className="h-full w-full overflow-y-auto bg-[var(--bg-0)] text-[var(--text-1)]">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-1)] bg-[var(--bg-0)]/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-5 md:px-8 h-16">
          <div className="flex items-center gap-2 font-mono text-lg font-bold">
            <div className="h-6 w-6 rounded flex items-center justify-center bg-[linear-gradient(135deg,var(--primary)_0%,var(--info)_100%)]">
              <span className="text-xs text-white">FT</span>
            </div>
            <span className="bg-clip-text text-transparent bg-[linear-gradient(135deg,var(--text-1)_0%,var(--text-3)_100%)]">
              FixFlow
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-[var(--text-2)]">
            <a href="#engine" className="hover:text-[var(--text-1)] transition-colors">Engine</a>
            <a href="#explainable" className="hover:text-[var(--text-1)] transition-colors">Explainability</a>
            <a href="#analytics" className="hover:text-[var(--text-1)] transition-colors">Analytics</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button variant="default" size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(182,192,206,0.08) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          } as React.CSSProperties}
        />
        <div
          className="absolute -top-32 right-[-10%] h-[520px] w-[520px] rounded-full opacity-30 blur-[110px]"
          style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-40 left-[-15%] h-[420px] w-[420px] rounded-full opacity-20 blur-[110px]"
          style={{ background: "radial-gradient(circle, var(--info) 0%, transparent 70%)" }}
        />

        <div className="relative mx-auto max-w-6xl px-5 md:px-8 pt-16 pb-20 md:pt-24 md:pb-28 grid gap-14 lg:grid-cols-2 lg:items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-2)] bg-[var(--bg-1)] px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-[var(--primary-strong)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
              Deterministic triage engine
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight leading-[1.05] text-balance">
              Bug triage that{" "}
              <span className="bg-clip-text text-transparent bg-[linear-gradient(135deg,var(--primary-strong)_0%,var(--info)_100%)]">
                shows its work.
              </span>
            </h1>

            <p className="text-lg text-[var(--text-2)] leading-relaxed max-w-xl">
              FixFlow scores every bug&rsquo;s severity, flags duplicates, and assigns the right engineer —
              using fixed, readable rules instead of a black-box model, so your team always knows exactly why.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/register">
                <Button variant="default" size="lg" className="gap-2">
                  Get started free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">Sign in</Button>
              </Link>
            </div>

            <p className="text-xs text-[var(--text-3)] font-mono">
              No credit card. Set up a workspace in under a minute.
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <TriageDemo />
          </div>
        </div>
      </section>

      {/* ── Engine features ─────────────────────────────────────────────── */}
      <section id="engine" className="border-t border-[var(--border-1)] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal className="max-w-2xl mb-14">
            <p className="text-[11px] font-mono uppercase tracking-widest text-[var(--primary-strong)] mb-3">
              The engine
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
              Four decisions, made the moment a bug lands.
            </h2>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ENGINE_FEATURES.map((feature, i) => {
              const Icon = feature.icon
              return (
                <Reveal key={feature.title} delayMs={i * 90}>
                  <div className="h-full rounded-[var(--radius-lg)] border border-[var(--border-1)] bg-[var(--bg-2)] p-6 transition-all duration-150 hover:border-[var(--border-2)] hover:shadow-[var(--shadow-md)]">
                    <div className="h-10 w-10 rounded-[var(--radius-md)] bg-[var(--primary-soft)] flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5 text-[var(--primary-strong)]" />
                    </div>
                    <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-[var(--text-3)] leading-relaxed">{feature.body}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Explainability ──────────────────────────────────────────────── */}
      <section id="explainable" className="border-t border-[var(--border-1)] py-20 md:py-28 bg-[var(--bg-1)]">
        <div className="mx-auto max-w-6xl px-5 md:px-8 grid gap-14 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="text-[11px] font-mono uppercase tracking-widest text-[var(--primary-strong)] mb-3">
              No black boxes
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance mb-5">
              Every score comes with its receipt.
            </h2>
            <p className="text-[var(--text-2)] leading-relaxed max-w-lg">
              Most triage tools make you sort everything by hand, or hand the decision to a model nobody can
              question. FixFlow does neither. Every severity score is built from fixed, visible rules, and the
              full breakdown is always one click away — so your team never has to just take the number&rsquo;s word for it.
            </p>
          </Reveal>

          <Reveal delayMs={120} className="flex justify-center lg:justify-end">
            <div className="w-full max-w-sm rounded-[var(--radius-xl)] border border-[var(--border-1)] bg-[var(--bg-2)] shadow-[var(--shadow-md)] p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-semibold text-[var(--text-1)]">Why this bug is Critical</p>
                <Eye className="h-4 w-4 text-[var(--text-3)]" />
              </div>
              <div className="space-y-2.5 font-mono text-[12px]">
                {[
                  ["Keywords matched", "+45"],
                  ["Module impact (payment)", "+30"],
                  ["Description depth", "+10"],
                  ["Environment ×1.3", "→ 92"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-dashed border-[var(--border-1)] pb-2">
                    <span className="text-[var(--text-3)]">{label}</span>
                    <span className="text-[var(--text-2)]">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-1">
                <span className="text-xs text-[var(--text-3)]">Confidence</span>
                <span className="text-sm font-mono font-semibold text-[var(--text-1)]">94%</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Team & security ─────────────────────────────────────────────── */}
      <section className="border-t border-[var(--border-1)] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal className="max-w-2xl mb-14">
            <p className="text-[11px] font-mono uppercase tracking-widest text-[var(--primary-strong)] mb-3">
              Built for a real team
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
              The context stays with the bug.
            </h2>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-3 mb-8">
            {TEAM_FEATURES.map((feature, i) => {
              const Icon = feature.icon
              return (
                <Reveal key={feature.title} delayMs={i * 90}>
                  <div className="h-full rounded-[var(--radius-lg)] border border-[var(--border-1)] bg-[var(--bg-2)] p-6">
                    <Icon className="h-5 w-5 text-[var(--primary-strong)] mb-4" />
                    <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-[var(--text-3)] leading-relaxed">{feature.body}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>

          <Reveal>
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-2)] bg-[var(--primary-soft)] p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <Shield className="h-8 w-8 text-[var(--primary-strong)] shrink-0" />
              <div>
                <h3 className="text-base font-semibold mb-1">Every team is its own island</h3>
                <p className="text-sm text-[var(--text-2)] leading-relaxed">
                  Sign up and you get a private workspace — two different teams on FixFlow never see each
                  other&rsquo;s bugs, people, or stats. Growing your team happens through invite links; whoever
                  joins picks their own password, so you&rsquo;re never the one who knows it.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Analytics teaser ────────────────────────────────────────────── */}
      <section id="analytics" className="border-t border-[var(--border-1)] py-20 md:py-28 bg-[var(--bg-1)]">
        <div className="mx-auto max-w-6xl px-5 md:px-8 grid gap-14 lg:grid-cols-2 lg:items-center">
          <Reveal className="order-2 lg:order-1 flex justify-center lg:justify-start">
            <div className="w-full max-w-sm rounded-[var(--radius-xl)] border border-[var(--border-1)] bg-[var(--bg-2)] shadow-[var(--shadow-md)] p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-semibold text-[var(--text-1)]">Module hotspots</p>
                <ChartColumn className="h-4 w-4 text-[var(--text-3)]" />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {HEATMAP_DEMO.map((cell) => (
                  <div
                    key={cell.module}
                    className="relative rounded-[var(--radius-md)] border border-[var(--border-1)] px-3 py-3"
                    style={{ backgroundColor: `rgba(47, 128, 255, ${cell.intensity})` }}
                  >
                    {cell.critical && (
                      <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--danger)] shadow-[var(--shadow-glow-danger)]" />
                    )}
                    <p className="text-[10px] font-mono text-[var(--text-1)] truncate">{cell.module}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={120} className="order-1 lg:order-2">
            <p className="text-[11px] font-mono uppercase tracking-widest text-[var(--primary-strong)] mb-3">
              See the whole board
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance mb-5">
              Know where it hurts before it becomes a fire.
            </h2>
            <p className="text-[var(--text-2)] leading-relaxed max-w-lg">
              A live view of open and critical bugs, which part of the product is causing the most trouble,
              how overloaded your engineers are, and how fast bugs actually get triaged — not a spreadsheet
              somebody has to remember to update.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="border-t border-[var(--border-1)] py-20 md:py-28">
        <Reveal className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-2)] bg-[var(--bg-1)] px-8 py-16 text-center">
            <div
              className="absolute inset-0 opacity-40"
              style={{ background: "radial-gradient(ellipse 60% 80% at 50% 0%, var(--primary-soft), transparent 70%)" }}
            />
            <div className="relative space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
                Stop sorting bugs by hand.
              </h2>
              <p className="text-[var(--text-2)] max-w-lg mx-auto leading-relaxed">
                Create a workspace, invite your team, and let the engine take the first pass — free, no
                credit card, ready in under a minute.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link href="/register">
                  <Button variant="default" size="lg" className="gap-2">
                    Get started free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" size="lg">Sign in</Button>
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border-1)]">
        <div className="mx-auto max-w-6xl px-5 md:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-sm font-bold">
              <div className="h-5 w-5 rounded flex items-center justify-center bg-[linear-gradient(135deg,var(--primary)_0%,var(--info)_100%)]">
                <span className="text-[10px] text-white">FT</span>
              </div>
              <span className="text-[var(--text-1)]">FixFlow</span>
            </div>
            <p className="text-xs text-[var(--text-3)] mt-1.5">Bug triage that shows its work.</p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--text-3)]">
            <a href="#engine" className="hover:text-[var(--text-1)] transition-colors">Engine</a>
            <a href="#explainable" className="hover:text-[var(--text-1)] transition-colors">Explainability</a>
            <a href="#analytics" className="hover:text-[var(--text-1)] transition-colors">Analytics</a>
            <Link href="/login" className="hover:text-[var(--text-1)] transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-[var(--text-1)] transition-colors">Get started</Link>
          </nav>
        </div>
        <div className="border-t border-[var(--border-1)]">
          <p className="mx-auto max-w-6xl px-5 md:px-8 py-5 text-xs text-[var(--text-3)] font-mono">
            © 2026 FixFlow. Built for engineering teams who&rsquo;d rather be fixing things.
          </p>
        </div>
      </footer>
    </div>
  )
}
