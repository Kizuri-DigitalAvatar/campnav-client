"use client"

import { Calendar, ChevronRight, Repeat } from "lucide-react"
import { ServiceArt } from "@/components/visuals"
import { CardLink, type CollectionView } from "@/components/collection"

const DAY = 24 * 60 * 60 * 1000

export function whenLabel(item: any) {
    const start = new Date(item.nextDue)
    const startText = start.toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    if (!item.durationMinutes) return startText
    const end = new Date(item.nextDue + item.durationMinutes * 60000)
    return `${startText} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
}

export type DueKey = "overdue" | "soon" | "upcoming"

export function dueState(nextDue: number, now = Date.now()): { key: DueKey; label: string; className: string } {
    const diff = nextDue - now
    if (diff < 0) return { key: "overdue", label: "Overdue", className: "bg-rose-500/12 text-rose-700 dark:text-rose-400 border-rose-500/25" }
    if (diff <= DAY) return { key: "soon", label: "Due soon", className: "bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/25" }
    return { key: "upcoming", label: "Upcoming", className: "bg-muted text-muted-foreground border-border" }
}

/** Ring that fills as checklist items are ticked */
export function ChecklistRing({ done, total, size = 44 }: { done: number; total: number; size?: number }) {
    const pct = total ? (done / total) * 100 : 0
    return (
        <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} aria-label={`${done} of ${total} checklist items done`}>
            <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
                <circle cx={18} cy={18} r={15} fill="none" strokeWidth={4} className="stroke-muted" />
                <circle
                    cx={18} cy={18} r={15} fill="none" strokeWidth={4} strokeLinecap="round"
                    pathLength={100} strokeDasharray={`${pct} 100`}
                    className={`${done === total && total > 0 ? "stroke-emerald-500" : "stroke-primary"} transition-[stroke-dasharray] duration-700 motion-reduce:transition-none`}
                />
            </svg>
            <span className="text-[10px] font-black tabular-nums">{done}/{total}</span>
        </span>
    )
}

export function PreventiveCard({ item, variant = "list", now }: { item: any; variant?: CollectionView; now: number }) {
    const state = dueState(item.nextDue, now)
    const done = item.checklist.filter((c: any) => c.completed).length
    const total = item.checklist.length
    const pill = <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${state.className}`}>{state.label}</span>
    const link = <CardLink href={`/app/preventive/${item._id}`} label={`Open job: ${item.title}, ${state.label}`} />

    if (variant === "list") {
        return (
            <article className="va-trigger glass-card group relative rounded-2xl p-3 sm:p-4 transition-transform active:scale-[0.985]">
                {link}
                <div className="flex items-center gap-3">
                    <ServiceArt kind="maintenance" size={48} motion={state.key === "overdue" ? "always" : "hover"} tone={state.key === "overdue" ? "rose" : "blue"} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="truncate text-sm font-black leading-tight">{item.title}</h3>
                            {pill}
                        </div>
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">{whenLabel(item)}</p>
                    </div>
                    <ChecklistRing done={done} total={total} size={40} />
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </div>
            </article>
        )
    }

    return (
        <article className="va-trigger glass-card group relative flex h-full flex-col gap-4 rounded-3xl p-4 sm:p-5 transition-transform active:scale-[0.99]">
            {link}
            <header className="flex items-start gap-3">
                <ServiceArt kind="maintenance" size={52} motion={state.key === "overdue" ? "always" : "hover"} tone={state.key === "overdue" ? "rose" : "blue"} />
                <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-base font-black leading-tight">{item.title}</h3>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{item.type.replaceAll("_", " ")}</p>
                </div>
                {pill}
            </header>
            <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" aria-hidden />{whenLabel(item)}</p>
                <p className="flex items-center gap-2 capitalize"><Repeat className="h-3.5 w-3.5" aria-hidden />{item.frequency}</p>
            </div>
            <div className="mt-auto flex items-center gap-3 rounded-2xl border bg-muted/30 p-3">
                <ChecklistRing done={done} total={total} />
                <div className="min-w-0 text-xs">
                    <p className="font-bold">Checklist</p>
                    <p className="text-muted-foreground">{done === total && total > 0 ? "All ticked — ready to mark done" : `${total - done} item${total - done === 1 ? "" : "s"} left`}</p>
                </div>
            </div>
        </article>
    )
}
