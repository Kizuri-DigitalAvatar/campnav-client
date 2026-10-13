"use client"

import Link from "next/link"
import { useId, type ElementType, type ReactNode } from "react"
import { ChevronRight } from "lucide-react"

// Shared building blocks for the resident and staff home dashboards

export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

export function DashboardHeader({
  name,
  subtitle,
  badges,
}: {
  name: string
  subtitle: string
  badges?: ReactNode
}) {
  const now = new Date()
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground">
          <time dateTime={now.toISOString().slice(0, 10)}>
            {now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          </time>
        </p>
        <h1 className="mt-1 text-2xl md:text-3xl font-black tracking-tight truncate">
          {greeting(now)}, {name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {badges && <div className="flex flex-wrap items-center gap-2">{badges}</div>}
    </header>
  )
}

export function Pill({ icon: Icon, children, tone = "neutral" }: {
  icon?: ElementType
  children: ReactNode
  tone?: "neutral" | "primary" | "success" | "warning"
}) {
  const tones = {
    neutral: "bg-card text-foreground border-border",
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${tones[tone]}`}>
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
      {children}
    </span>
  )
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = "primary",
  loading,
}: {
  label: string
  value: number | string
  hint?: string
  icon: ElementType
  href: string
  tone?: "primary" | "amber" | "emerald" | "violet"
  loading?: boolean
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  }
  return (
    <Link
      href={href}
      aria-label={`${label}: ${loading ? "loading" : value}${hint ? `, ${hint}` : ""}`}
      className={`glass-card card-lift group flex flex-col gap-3 p-4 md:p-5 ${focusRing}`}
    >
      <div className="flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
      </div>
      <div>
        {loading ? (
          <span className="block h-8 w-12 rounded-lg bg-muted animate-pulse" />
        ) : (
          <p className="text-2xl md:text-3xl font-black tabular-nums leading-none">{value}</p>
        )}
        <p className="mt-1.5 text-xs font-semibold text-foreground">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{hint}</p>}
      </div>
    </Link>
  )
}

export function Panel({
  title,
  icon: Icon,
  action,
  children,
  className = "",
}: {
  title: string
  icon?: ElementType
  action?: { label: string; href: string }
  children: ReactNode
  className?: string
}) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className={`glass-card p-4 md:p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={headingId} className="flex items-center gap-2 text-sm font-bold">
          {Icon && <Icon className="h-4 w-4 text-primary" aria-hidden />}
          {title}
        </h2>
        {action && (
          <Link
            href={action.href}
            className={`inline-flex items-center gap-0.5 rounded-md text-xs font-semibold text-primary hover:underline ${focusRing}`}
          >
            {action.label}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

export function EmptyState({ icon: Icon, title, hint, action }: {
  icon: ElementType
  title: string
  hint?: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-4 py-8 text-center">
      <Icon className="h-7 w-7 text-muted-foreground" aria-hidden />
      <p className="mt-2 text-sm font-semibold">{title}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      {action && (
        <Link href={action.href} className={`mt-3 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 ${focusRing}`}>
          {action.label}
        </Link>
      )}
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  acknowledged: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  rated: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  failed: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  cancelled: "bg-muted text-muted-foreground",
  overdue: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
}

// Status is spelled out, never colour-only
export function StatusBadge({ status }: { status: string }) {
  const label = status === "acknowledged" ? "accepted" : status.replace("_", " ")
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"}`}>
      {label}
    </span>
  )
}

export function ListRow({ href, icon, title, meta, status }: {
  href: string
  icon: ReactNode
  title: string
  meta?: ReactNode
  status?: string
}) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center gap-3 rounded-xl p-2 -mx-2 transition-colors hover:bg-muted/50 ${focusRing}`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{title}</span>
          {meta && <span className="block truncate text-xs text-muted-foreground">{meta}</span>}
        </span>
        {status && <StatusBadge status={status} />}
      </Link>
    </li>
  )
}

export function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d < 7 ? `${d}d ago` : new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function dayLabel(ts: number) {
  const d = new Date(ts)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return "Today"
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow"
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })
}
