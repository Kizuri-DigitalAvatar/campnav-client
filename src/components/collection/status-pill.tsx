"use client"

import { AlertCircle, CheckCircle2, Clock, PlayCircle, Send, Star, Truck, XCircle } from "lucide-react"

/*
 * One status pill for every list in the client — same colours and icons for
 * requests, tasks and orders. Wording depends on who is reading: a resident's
 * "pending" request is "Waiting"; for the worker it's "To accept".
 */

type Audience = "staff" | "resident" | "order"

const TONE: Record<string, string> = {
  amber: "bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/25",
  sky: "bg-sky-500/12 text-sky-700 dark:text-sky-400 border-sky-500/25",
  primary: "bg-primary/12 text-primary border-primary/25",
  emerald: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  violet: "bg-violet-500/12 text-violet-700 dark:text-violet-400 border-violet-500/25",
  rose: "bg-rose-500/12 text-rose-700 dark:text-rose-400 border-rose-500/25",
  muted: "bg-muted text-muted-foreground border-border",
}

const STATUS: Record<string, { tone: keyof typeof TONE; icon: typeof Clock; label: Record<Audience, string> }> = {
  pending: { tone: "amber", icon: AlertCircle, label: { staff: "To accept", resident: "Waiting", order: "Received" } },
  acknowledged: { tone: "sky", icon: Clock, label: { staff: "Accepted", resident: "Accepted", order: "Accepted" } },
  confirmed: { tone: "sky", icon: Clock, label: { staff: "Accepted", resident: "Accepted", order: "Confirmed" } },
  in_progress: { tone: "primary", icon: PlayCircle, label: { staff: "In progress", resident: "Being done", order: "On the way" } },
  completed: { tone: "emerald", icon: CheckCircle2, label: { staff: "Completed", resident: "Done", order: "Delivered" } },
  rated: { tone: "violet", icon: Star, label: { staff: "Rated", resident: "Rated", order: "Rated" } },
  cancelled: { tone: "muted", icon: XCircle, label: { staff: "Cancelled", resident: "Cancelled", order: "Cancelled" } },
  rejected: { tone: "rose", icon: XCircle, label: { staff: "Declined", resident: "Declined", order: "Declined" } },
  failed: { tone: "rose", icon: XCircle, label: { staff: "Failed", resident: "Not done", order: "Failed" } },
}

export function statusLabel(status: string, audience: Audience = "resident") {
  return STATUS[status]?.label[audience] ?? status.replace(/_/g, " ")
}

export function StatusPill({
  status,
  audience = "resident",
  className = "",
}: {
  status: string
  audience?: Audience
  className?: string
}) {
  const s = STATUS[status]
  const Icon = s ? (audience === "order" && status === "in_progress" ? Truck : audience === "resident" && status === "pending" ? Send : s.icon) : AlertCircle
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${TONE[s?.tone ?? "muted"]} ${className}`}>
      <Icon className="h-3 w-3" aria-hidden />
      {statusLabel(status, audience)}
    </span>
  )
}
