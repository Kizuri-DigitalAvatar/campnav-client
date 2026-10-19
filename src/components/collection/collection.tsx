"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { CSSProperties, ReactNode } from "react"
import { ArrowLeft, Search, X } from "lucide-react"
import { EmptyArt, ServiceArt, type ArtKind, type ArtTone } from "@/components/visuals"
import type { CollectionView } from "./view-toggle"

/*
 * Building blocks every list screen in the client shares, so requests,
 * orders, tasks, updates and jobs all look and behave the same: a picture
 * header, tap-sized filter chips, search, a grid/list switch, whole-card links
 * and illustrated empty states.
 */

export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"

// ── Header ────────────────────────────────────────────────────────────────

export function PageHeader({
  art,
  artTone,
  title,
  subtitle,
  back,
  actions,
}: {
  art?: ArtKind
  artTone?: ArtTone
  title: string
  subtitle?: ReactNode
  /** Breadcrumb-style link back; `true` uses the browser history */
  back?: { href: string; label: string } | true
  actions?: ReactNode
}) {
  const router = useRouter()
  return (
    <header className="space-y-3">
      {back && (
        back === true ? (
          <button type="button" onClick={() => router.back()} className={`inline-flex items-center gap-1 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground ${focusRing}`}>
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back
          </button>
        ) : (
          <Link href={back.href} className={`inline-flex items-center gap-1 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground ${focusRing}`}>
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {back.label}
          </Link>
        )
      )}
      <div className="flex items-center gap-3 md:gap-4">
        {art && (
          <ServiceArt kind={art} tone={artTone} size={52} motion="ambient" className="md:h-14 md:w-14" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-black tracking-tight md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="hidden shrink-0 items-center gap-2 sm:flex">{actions}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 sm:hidden">{actions}</div>}
    </header>
  )
}

// ── Filters & search ──────────────────────────────────────────────────────

export interface ChipOption<K extends string> {
  key: K
  label: string
  count?: number
  /** Dot colour shown before the label, e.g. "bg-amber-500" */
  dot?: string
}

/**
 * Horizontally scrollable filter chips. On phones the row sticks under the
 * app header so filters stay in thumb reach while scrolling a long list.
 */
export function FilterChips<K extends string>({
  options,
  value,
  onChange,
  label = "Filter",
  sticky = true,
}: {
  options: ChipOption<K>[]
  value: K
  onChange: (key: K) => void
  label?: string
  sticky?: boolean
}) {
  return (
    <div
      className={sticky
        ? "sticky top-16 z-20 -mx-4 bg-background/85 px-4 py-2 backdrop-blur-md md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
        : ""}
    >
      <div role="group" aria-label={label} className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {options.map((o) => {
          const active = o.key === value
          return (
            <button
              key={o.key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.key)}
              className={`inline-flex h-10 shrink-0 snap-start items-center gap-2 rounded-full border px-4 text-xs font-bold transition-all active:scale-95 ${focusRing} ${active
                ? "border-primary bg-primary text-primary-foreground shadow-primary-glow"
                : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
            >
              {o.dot && <span className={`h-2 w-2 rounded-full ${o.dot}`} aria-hidden />}
              {o.label}
              {o.count !== undefined && (
                <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${active ? "bg-white/20" : "bg-muted text-muted-foreground"}`}>
                  {o.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SearchField({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <label className={`relative flex min-w-0 flex-1 items-center ${className}`}>
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        enterKeyHint="search"
        className="h-11 w-full rounded-full border bg-card pl-10 pr-10 text-sm shadow-card outline-none transition-shadow placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/15 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </label>
  )
}

/** Search box with the view switch beside it. */
export function CollectionToolbar({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>
}

/** Case-insensitive match of `query` against any of the given fields. */
export function matches(query: string, ...fields: (string | number | undefined | null)[]) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return fields.some((f) => f !== undefined && f !== null && String(f).toLowerCase().includes(q))
}

// ── Layout ────────────────────────────────────────────────────────────────

/** Lays items out as a responsive grid or a single-column list. */
export function Collection({
  view,
  children,
  className = "",
  gridClassName = "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  label,
}: {
  view: CollectionView
  children: ReactNode
  className?: string
  gridClassName?: string
  label?: string
}) {
  return (
    <ul
      aria-label={label}
      className={view === "grid"
        ? `grid gap-4 md:gap-5 ${gridClassName} ${className}`
        : `flex flex-col gap-2.5 md:gap-3 ${className}`}
    >
      {children}
    </ul>
  )
}

/** One item; enters with a short fade-up, staggered by position. */
export function CollectionItem({ index = 0, children, className = "" }: { index?: number; children: ReactNode; className?: string }) {
  return (
    <li
      className={`va-enter min-w-0 ${className}`}
      style={{ ["--enter-delay" as string]: `${Math.min(index, 10) * 45}ms` } as CSSProperties}
    >
      {children}
    </li>
  )
}

export function SectionLabel({ title, count, hint }: { title: string; count?: number; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-1">
      <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
        {title}
        {count !== undefined && <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">{count}</span>}
      </h2>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

/**
 * Invisible link stretched over a whole card so tapping anywhere opens the
 * item. Keep buttons inside the card above it with `relative z-20`.
 */
export function CardLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="absolute inset-0 z-10 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    />
  )
}

// ── Empty & loading ───────────────────────────────────────────────────────

export function CollectionEmpty({
  art,
  title,
  hint,
  action,
  onReset,
}: {
  art: ArtKind
  title: string
  hint?: string
  action?: { label: string; href: string }
  /** Shown when filters/search hid everything */
  onReset?: () => void
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
      <EmptyArt kind={art} size={96} />
      <p className="mt-4 text-base font-bold">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {onReset && (
          <button type="button" onClick={onReset} className={`h-10 rounded-full border bg-card px-5 text-xs font-bold hover:bg-muted ${focusRing}`}>
            Clear filters
          </button>
        )}
        {action && (
          <Link href={action.href} className={`inline-flex h-10 items-center rounded-full bg-primary px-5 text-xs font-bold text-primary-foreground shadow-primary-glow hover:brightness-110 ${focusRing}`}>
            {action.label}
          </Link>
        )}
      </div>
    </div>
  )
}

export function CollectionSkeleton({ view = "grid", count = 6 }: { view?: CollectionView; count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" className={view === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-2.5"}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`glass-card animate-pulse ${view === "grid" ? "h-64 rounded-3xl p-5" : "h-24 rounded-2xl p-3"}`}>
          <div className="flex items-center gap-3">
            <div className={`${view === "grid" ? "h-13 w-13" : "h-12 w-12"} rounded-2xl bg-muted`} />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton({ view = "grid" }: { view?: CollectionView }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-13 w-13 animate-pulse rounded-2xl bg-muted" />
        <div className="space-y-2">
          <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-muted" />)}
      </div>
      <CollectionSkeleton view={view} />
    </div>
  )
}

/** Sticky bottom action bar on phones (thumb reach), inline on desktop. */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-[var(--app-bottom,0px)] z-20 -mx-4 border-t bg-background/90 px-4 pt-3 [&:has(>div:empty)]:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
      <div className="flex gap-3">{children}</div>
    </div>
  )
}
