"use client"

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import { ServiceArt, type ArtKind } from "./service-art"

/*
 * Full-screen "it worked" moment after a resident sends something: a tick
 * draws itself inside a ring, confetti bursts, and one short sentence says
 * what happens next. Replaces the browser's alert() boxes.
 *
 *   celebrate({ title: "Request sent!", message: "Staff will be with you soon.", kind: "laundry" })
 *
 * <CelebrationHost /> must be mounted once (it is, in the app layout). It
 * survives route changes, so callers can navigate straight after.
 */

export interface Celebration {
  title: string
  message?: string
  /** Service illustration shown under the tick */
  kind?: ArtKind
  /** Auto-dismiss after this many ms (default 2600) */
  duration?: number
}

const EVENT = "campnav:celebrate"

export function celebrate(c: Celebration) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<Celebration>(EVENT, { detail: c }))
  try { navigator.vibrate?.(35) } catch {}
}

const COLORS = [
  "oklch(0.7 0.17 150)", "oklch(0.84 0.16 85)", "oklch(0.63 0.2 259)",
  "oklch(0.66 0.2 18)", "oklch(0.65 0.18 293)", "oklch(0.75 0.13 232)",
]

// Fixed burst pattern (no randomness, so it looks the same every time)
const BITS = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2 + (i % 2 ? 0.2 : 0)
  const dist = 78 + (i % 3) * 22
  return {
    cx: `${Math.round(Math.cos(angle) * dist)}px`,
    cy: `${Math.round(Math.sin(angle) * dist)}px`,
    cr: `${(i % 2 ? 1 : -1) * (180 + i * 25)}deg`,
    color: COLORS[i % COLORS.length],
    round: i % 3 === 0,
  }
})

export function CelebrationHost() {
  const [current, setCurrent] = useState<(Celebration & { id: number }) | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const close = useCallback(() => {
    window.clearTimeout(timer.current)
    setCurrent(null)
  }, [])

  useEffect(() => {
    const onCelebrate = (e: Event) => {
      const detail = (e as CustomEvent<Celebration>).detail
      window.clearTimeout(timer.current)
      setCurrent({ ...detail, id: Date.now() })
      timer.current = window.setTimeout(() => setCurrent(null), detail.duration ?? 2600)
    }
    window.addEventListener(EVENT, onCelebrate)
    return () => {
      window.removeEventListener(EVENT, onCelebrate)
      window.clearTimeout(timer.current)
    }
  }, [])

  useEffect(() => {
    if (!current) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [current, close])

  if (!current) return null

  return (
    <div
      key={current.id}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200"
      onClick={close}
      role="status"
      aria-live="assertive"
    >
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      <div className="va-celebrate-card relative w-full max-w-xs overflow-hidden rounded-[2rem] glass-panel shadow-pop px-6 pb-6 pt-8 text-center">
        <div className="relative mx-auto h-28 w-28">
          {/* confetti */}
          <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden>
            {BITS.map((b, i) => (
              <span
                key={i}
                className={`va-celebrate-bit absolute -left-1 -top-1 block w-2 ${b.round ? "h-2 rounded-full" : "h-3 rounded-[2px]"}`}
                style={{ background: b.color, ["--cx" as string]: b.cx, ["--cy" as string]: b.cy, ["--cr" as string]: b.cr } as CSSProperties}
              />
            ))}
          </div>
          <svg viewBox="0 0 80 80" className="relative h-full w-full" aria-hidden>
            <circle cx={40} cy={40} r={34} className="fill-emerald-500/12" />
            <circle
              cx={40} cy={40} r={34}
              fill="none"
              stroke="oklch(0.7 0.17 155)"
              strokeWidth={5}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              className="va-celebrate-ring"
              transform="rotate(-90 40 40)"
            />
            <path
              d="M25 41l10 10 20-22"
              fill="none"
              stroke="oklch(0.62 0.17 155)"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              className="va-celebrate-tick"
            />
          </svg>
        </div>
        <div className="va-celebrate-text">
          <p className="mt-4 text-xl font-black tracking-tight">{current.title}</p>
          {current.message && <p className="mt-1 text-sm text-muted-foreground">{current.message}</p>}
          {current.kind && (
            <div className="mt-4 flex justify-center">
              <ServiceArt kind={current.kind} size={52} motion="always" />
            </div>
          )}
          <p className="mt-4 text-[11px] font-semibold text-muted-foreground/70">Tap anywhere to close</p>
        </div>
        <span
          className="va-celebrate-timer absolute bottom-0 left-0 h-1 w-full bg-emerald-500/60"
          style={{ ["--dur" as string]: `${current.duration ?? 2600}ms` } as CSSProperties}
          aria-hidden
        />
      </div>
    </div>
  )
}
