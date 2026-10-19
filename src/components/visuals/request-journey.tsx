"use client"

import { useEffect, useState, type CSSProperties, type ReactNode } from "react"
import { ServiceArt, artForType } from "./service-art"

/*
 * Request journey: Sent → Accepted → Working → Done.
 *
 * A row of picture steps that fill in as staff act on a request, so where
 * a request stands is understood from the pictures and colours alone. The
 * step in play animates (the plane flies, the gear turns), finished steps
 * get a tick, and a plain-language sentence spells it out on top.
 */

const STOPPED = ["cancelled", "rejected", "failed"] as const

type StepState = "done" | "current" | "todo" | "stopped"

export interface JourneyTimes {
  sent?: number
  accepted?: number
  started?: number
  done?: number
}

export function journeyStep(status: string) {
  switch (status) {
    case "pending": return 1
    case "acknowledged":
    case "confirmed": return 2
    case "in_progress": return 2
    case "completed":
    case "rated": return 4
    default: return 1
  }
}

function headline(status: string, staff?: string) {
  const who = staff || "Staff"
  switch (status) {
    case "pending": return { title: "Request sent", line: "Waiting for a staff member to accept it." }
    case "acknowledged":
    case "confirmed": return { title: `${who} accepted`, line: "Work will start soon." }
    case "in_progress": return { title: `${who} is working on it`, line: "We'll let you know when it's done." }
    case "completed": return { title: "All done!", line: "Please tell us how it went." }
    case "rated": return { title: "All done", line: "Thank you for your rating." }
    case "cancelled": return { title: "Request cancelled", line: "Nothing more will happen with this one." }
    case "rejected": return { title: "Request declined", line: "Contact reception if you still need help." }
    case "failed": return { title: "Could not be finished", line: "Contact reception and we'll sort it out." }
    default: return { title: status.replace(/_/g, " "), line: "" }
  }
}

const anim = (animation: string, delay = 0, extra?: CSSProperties): CSSProperties =>
  ({ ["--a" as string]: animation, ["--ad" as string]: `${delay}s`, ...extra })

// `still` keeps the current step's picture from moving (e.g. accepted, not started)
function StepIcon({ step, state, still }: { step: number; state: StepState; still?: boolean }) {
  const live = state === "current" && !still
  const common = {
    viewBox: "0 0 24 24",
    width: 22,
    height: 22,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "va",
    "data-motion": live ? "always" : "none",
    "aria-hidden": true,
    focusable: "false" as const,
  }
  if (state === "stopped") {
    return (
      <svg {...common}>
        <path d="M7 7l10 10M17 7 7 17" />
      </svg>
    )
  }
  if (state === "done") {
    return (
      <svg {...common}>
        <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} className="va-anim" style={anim("va-draw-once 500ms ease-out both", 0, { strokeDasharray: 1 })} />
      </svg>
    )
  }
  switch (step) {
    case 0: // sent — paper plane
      return (
        <svg {...common}>
          <g className="va-anim" style={anim("va-fly 2.4s ease-in-out infinite")}>
            <path d="M21 3 10.5 13.5" />
            <path d="M21 3 14.5 21l-4-7.5L3 9.5z" />
          </g>
        </svg>
      )
    case 1: // accepted — person with a tick
      return (
        <svg {...common}>
          <circle cx={9} cy={7.5} r={3.5} />
          <path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3a4.5 4.5 0 0 1 4.5 4.5V20" />
          <path d="M16 10.5l2 2 4-4" pathLength={1} className="va-anim" style={anim("va-draw 2.4s ease-out infinite both", 0, { strokeDasharray: 1 })} />
        </svg>
      )
    case 2: // working — turning gear
      return (
        <svg {...common}>
          <g className="va-anim" style={anim("va-spin 3s linear infinite")}>
            <circle cx={12} cy={12} r={3} />
            <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
          </g>
        </svg>
      )
    default: // done (not reached yet) — flag
      return (
        <svg {...common}>
          <path d="M5 21V4" />
          <path d="M5 4h11l-2 4 2 4H5" />
        </svg>
      )
  }
}

const STEP_LABELS = ["Sent", "Accepted", "Working", "Done"]

function fmt(ts?: number) {
  if (!ts) return ""
  const d = new Date(ts)
  const today = new Date().toDateString() === d.toDateString()
  return today
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" })
}

function useMountedFlag() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return on
}

export function RequestJourney({
  status,
  type,
  staffName,
  times = {},
  showHeadline = true,
  action,
  className = "",
}: {
  status: string
  type?: string
  staffName?: string
  times?: JourneyTimes
  showHeadline?: boolean
  /** Optional element shown under the headline (e.g. a "Rate" button) */
  action?: ReactNode
  className?: string
}) {
  const mounted = useMountedFlag()
  const stopped = (STOPPED as readonly string[]).includes(status)
  const stamps = [times.sent, times.accepted, times.started, times.done]

  // How many steps are finished; a stopped request ends after the last step it reached
  let reached = journeyStep(status)
  if (stopped) {
    reached = 1
    for (let i = 3; i >= 1; i--) if (stamps[i]) { reached = i + 1; break }
  }
  const finished = reached >= 4
  const stepState = (i: number): StepState => {
    if (i < reached) return "done"
    if (stopped) return i === reached ? "stopped" : "todo"
    return i === reached ? "current" : "todo"
  }

  const h = headline(status, staffName)
  const tone = stopped ? "rose" : finished ? "emerald" : "blue"
  const nodeColor = finished ? "var(--color-emerald-500, oklch(0.696 0.17 162.5))" : "var(--primary)"

  return (
    <div className={className}>
      {showHeadline && (
        <div className="mb-5 flex items-center gap-4">
          <ServiceArt
            kind={stopped ? "requests" : artForType(type)}
            tone={tone}
            size={60}
            motion={!stopped && !finished ? "always" : "none"}
          />
          <div className="min-w-0 flex-1" role="status" aria-live="polite">
            <p className="text-lg font-black leading-tight tracking-tight">{h.title}</p>
            {h.line && <p className="mt-0.5 text-sm text-muted-foreground">{h.line}</p>}
            {action && <div className="mt-3">{action}</div>}
          </div>
        </div>
      )}

      <ol className="flex items-start" aria-label={`Progress: step ${Math.min(reached + 1, 4)} of 4`}>
        {STEP_LABELS.map((label, i) => {
          const state = stepState(i)
          const segment = i < 3 ? (i + 1 < reached ? "done" : i + 1 === reached && !stopped && !finished ? "active" : "todo") : null
          const nodeStyles: Record<StepState, string> = {
            done: finished
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "bg-primary border-primary text-primary-foreground",
            current: "bg-card border-primary text-primary scale-110",
            todo: "bg-muted/60 border-dashed border-muted-foreground/30 text-muted-foreground/50",
            stopped: "bg-rose-500 border-rose-500 text-white",
          }
          return (
            <li key={label} className="flex flex-1 items-start last:flex-none" aria-current={state === "current" ? "step" : undefined}>
              <div className="flex w-14 shrink-0 flex-col items-center text-center">
                <span
                  data-state={state}
                  className={`va-journey-node flex h-11 w-11 items-center justify-center rounded-full border-2 ${nodeStyles[state]}`}
                  style={{ ["--node" as string]: nodeColor }}
                >
                  <StepIcon step={i} state={state} still={i === 2 && status !== "in_progress"} />
                </span>
                <span className={`mt-2 text-[11px] font-bold leading-tight ${state === "todo" ? "text-muted-foreground/60" : "text-foreground"}`}>
                  {state === "stopped" ? (status === "rejected" ? "Declined" : status === "failed" ? "Stopped" : "Cancelled") : label}
                </span>
                {stamps[i] && state === "done" ? (
                  <span className="text-[10px] tabular-nums text-muted-foreground">{fmt(stamps[i])}</span>
                ) : state === "current" ? (
                  <span className="text-[10px] font-semibold text-primary">Now</span>
                ) : null}
              </div>
              {segment && (
                <div className="relative mt-5 h-1 flex-1 -mx-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div
                    className={`va-journey-fill absolute inset-0 rounded-full ${finished ? "bg-emerald-500" : "bg-primary"}`}
                    style={{ transform: `scaleX(${mounted && segment === "done" ? 1 : 0})`, transitionDelay: `${i * 150}ms` }}
                  />
                  {segment === "active" && (
                    <svg className="absolute inset-0 h-full w-full text-primary" preserveAspectRatio="none" viewBox="0 0 100 4">
                      <line x1={0} y1={2} x2={100} y2={2} stroke="currentColor" strokeWidth={4} className="va-marching" />
                    </svg>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/**
 * Compact four-segment bar for request cards and lists: the same journey,
 * readable at a glance.
 */
export function JourneyBar({ status, showLabel = false, className = "" }: { status: string; showLabel?: boolean; className?: string }) {
  const stopped = (STOPPED as readonly string[]).includes(status)
  const reached = journeyStep(status)
  const finished = reached >= 4
  const label = stopped
    ? headline(status).title
    : finished ? "Done"
    : status === "in_progress" ? "Being worked on"
    : reached === 2 ? "Accepted, starting soon"
    : "Waiting to be accepted"
  return (
    <div className={className}>
      <div className="flex gap-1" role="img" aria-label={`${label}, step ${Math.min(reached + 1, 4)} of 4`}>
        {[0, 1, 2, 3].map((i) => {
          const cls = stopped
            ? i < reached ? "bg-rose-400/70" : "bg-muted"
            : finished
              ? "bg-emerald-500"
              : i < reached ? "bg-primary" : i === reached ? "bg-primary/35 animate-pulse" : "bg-muted"
          return <span key={i} className={`h-1.5 flex-1 rounded-full ${cls}`} />
        })}
      </div>
      {showLabel && <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{label}</p>}
    </div>
  )
}
