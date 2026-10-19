"use client"

import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import {
    CheckCircle2, ChevronRight, Clock, ImageIcon, Loader2, MessageSquarePlus, PlayCircle,
} from "lucide-react"
import { Id } from "../../convex/_generated/dataModel"
import { JourneyBar, ServiceArt, artForType, celebrate } from "@/components/visuals"
import { timeAgo } from "@/components/home/dashboard-ui"
import { CardLink, StatusPill, statusLabel } from "@/components/collection"

type Handler = (id: Id<"tasks">) => void | Promise<unknown>

export type TaskCardVariant = "grid" | "list"

interface TaskCardProps {
    assignment: {
        _id: Id<"tasks">
        staffId?: Id<"users">
        roomNumber: string
        serviceType: string
        status: string
        assignedAt: number
        acknowledgedAt?: number
        startedAt?: number
        completedAt?: number
        rating?: number
        feedback?: string
        updates?: Array<{
            timestamp: number
            text?: string
            images?: string[]
            audio?: string
        }>
        requestDetails?: {
            description: string
            priority: string
            imageUrl?: string | null
        } | null
    }
    onAcknowledge?: Handler
    onStart?: Handler
    onAddUpdate?: Handler
    onComplete?: Handler
    readOnly?: boolean
    /** "grid" is the full card; "list" is a compact row for scanning on a phone */
    variant?: TaskCardVariant
}

const PRIORITY: Record<string, string> = {
    urgent: "bg-rose-500 text-white",
    high: "bg-rose-500/12 text-rose-700 dark:text-rose-400",
    important: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
}

function priorityLabel(p: string) {
    return p === "pending_review" ? "needs review" : p.replace(/_/g, " ")
}

function serviceLabel(type: string) {
    return type.replace(/_/g, " ")
}

// The one time that matters most for where the task stands now
function keyMoment(a: TaskCardProps["assignment"]): [string, number] {
    if (a.completedAt) return ["Done", a.completedAt]
    if (a.startedAt) return ["Started", a.startedAt]
    if (a.acknowledgedAt) return ["Accepted", a.acknowledgedAt]
    return ["Assigned", a.assignedAt]
}

function buzz() {
    try { navigator.vibrate?.(15) } catch {}
}

export function TaskStatusPill({ status, className = "" }: { status: string; className?: string }) {
    return <StatusPill status={status} audience="staff" className={className} />
}

export function TaskCard({
    assignment,
    onAcknowledge,
    onStart,
    onAddUpdate,
    onComplete,
    readOnly = false,
    variant = "grid",
}: TaskCardProps) {
    const [busy, setBusy] = useState<string | null>(null)
    const a = assignment
    const href = `/app/assignments/${a._id}`
    const art = artForType(a.serviceType)
    const [momentLabel, momentAt] = keyMoment(a)
    const updates = a.updates?.length ?? 0
    const desc = a.requestDetails?.description
    const priority = a.requestDetails?.priority
    const image = a.requestDetails?.imageUrl

    // Runs a card action once at a time, with feedback when it lands or fails
    async function run(key: string, fn: Handler | undefined, done?: () => void) {
        if (!fn || busy) return
        buzz()
        setBusy(key)
        try {
            await fn(a._id)
            done?.()
        } catch (err: any) {
            toast.error("That didn't work", { description: err?.message?.split("Uncaught Error:").pop()?.trim() || "Please try again." })
        } finally {
            setBusy(null)
        }
    }

    const actions: ReactNode[] = []
    if (!readOnly) {
        if (a.status === "pending" && onAcknowledge) {
            actions.push(
                <ActionButton key="accept" primary busy={busy === "accept"} disabled={!!busy}
                    onClick={() => run("accept", onAcknowledge, () => toast.success("Task accepted", { description: `Room ${a.roomNumber} is now yours.` }))}>
                    {a.staffId ? "Respond" : "Accept task"}
                </ActionButton>,
            )
        }
        if (a.status === "acknowledged" && onStart) {
            actions.push(
                <ActionButton key="start" primary busy={busy === "start"} disabled={!!busy} icon={<PlayCircle className="h-4 w-4" aria-hidden />}
                    onClick={() => run("start", onStart, () => toast.success("Work started", { description: "The resident can see you're on it." }))}>
                    Start work
                </ActionButton>,
            )
        }
        if (a.status === "in_progress") {
            if (onAddUpdate) {
                actions.push(
                    <ActionButton key="update" busy={false} disabled={!!busy} icon={<MessageSquarePlus className="h-4 w-4" aria-hidden />}
                        onClick={() => { buzz(); onAddUpdate(a._id) }}>
                        Update
                    </ActionButton>,
                )
            }
            if (onComplete) {
                actions.push(
                    <ActionButton key="complete" primary success busy={busy === "complete"} disabled={!!busy} icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
                        onClick={() => run("complete", onComplete, () => celebrate({ title: "Task completed!", message: `Room ${a.roomNumber} is done. Nice work.`, kind: art }))}>
                        Complete
                    </ActionButton>,
                )
            }
        }
    }

    // The whole card opens the task; action buttons sit above the link layer
    const cardLink = <CardLink href={href} label={`Open task: room ${a.roomNumber}, ${serviceLabel(a.serviceType)}, ${statusLabel(a.status, "staff")}`} />

    if (variant === "list") {
        return (
            <article className="va-trigger glass-card group relative rounded-2xl p-3 sm:p-4 transition-transform active:scale-[0.985]">
                {cardLink}
                <div className="flex items-start gap-3">
                    <ServiceArt kind={art} size={48} motion={a.status === "in_progress" ? "always" : "hover"} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="truncate text-base font-black leading-tight">{a.roomNumber}</h3>
                            <TaskStatusPill status={a.status} />
                        </div>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            <span className="truncate">{serviceLabel(a.serviceType)}</span>
                            <span aria-hidden>·</span>
                            <span className="shrink-0 normal-case tracking-normal font-medium">{momentLabel} {timeAgo(momentAt)}</span>
                        </p>
                        {desc && <p className="mt-1.5 line-clamp-1 text-xs text-foreground/75">{desc}</p>}
                        <div className="mt-2.5 flex items-center gap-2">
                            <JourneyBar status={a.status} className="flex-1" />
                            {priority === "urgent" && (
                                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">Urgent</span>
                            )}
                            {image && <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" aria-label="Has a photo" />}
                            {updates > 0 && (
                                <span className="text-[10px] font-bold text-muted-foreground" aria-label={`${updates} updates`}>
                                    <MessageSquarePlus className="mr-0.5 inline h-3 w-3" aria-hidden />{updates}
                                </span>
                            )}
                        </div>
                    </div>
                    {actions.length === 0 && (
                        <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    )}
                </div>
                {actions.length > 0 && <div className="relative z-20 mt-3 flex gap-2">{actions}</div>}
            </article>
        )
    }

    return (
        <article className="va-trigger glass-card group relative flex h-full flex-col gap-4 rounded-3xl p-4 sm:p-5 transition-transform active:scale-[0.99]">
            {cardLink}

            <header className="flex items-start gap-3">
                <ServiceArt kind={art} size={52} motion={a.status === "in_progress" ? "always" : "hover"} />
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-xl font-black leading-tight">{a.roomNumber}</h3>
                    <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        {serviceLabel(a.serviceType)}
                    </p>
                </div>
                <TaskStatusPill status={a.status} />
            </header>

            <JourneyBar status={a.status} showLabel />

            {a.requestDetails && (
                <div className="space-y-2.5 rounded-2xl border border-primary/10 bg-primary/[0.04] p-3.5">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Request</span>
                        {priority && (
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${PRIORITY[priority] ?? "bg-muted text-muted-foreground"}`}>
                                {priorityLabel(priority)}
                            </span>
                        )}
                    </div>
                    {desc && <p className="line-clamp-3 text-sm leading-relaxed text-foreground/80">&ldquo;{desc}&rdquo;</p>}
                    {image && (
                        <div className="h-36 w-full overflow-hidden rounded-xl border bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={image} alt="Photo from the request" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                        </div>
                    )}
                </div>
            )}

            {a.rating ? (
                <div className="flex items-center justify-between gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700/80 dark:text-amber-400/80">Resident rating</span>
                    <span className="text-sm tracking-wide" aria-label={`${a.rating} out of 5 stars`}>
                        <span className="text-amber-500">{"★".repeat(a.rating)}</span>
                        <span className="text-muted-foreground/30">{"★".repeat(5 - a.rating)}</span>
                    </span>
                </div>
            ) : null}

            <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {momentLabel} {timeAgo(momentAt)}
                </span>
                <span className="inline-flex items-center gap-3">
                    {updates > 0 && (
                        <span className="inline-flex items-center gap-1 font-semibold">
                            <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden />
                            {updates} update{updates === 1 ? "" : "s"}
                        </span>
                    )}
                    <span className="inline-flex items-center font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Open <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                </span>
            </div>

            {actions.length > 0 && <div className="relative z-20 flex gap-2">{actions}</div>}
        </article>
    )
}

function ActionButton({
    children, onClick, busy, disabled, primary, success, icon,
}: {
    children: ReactNode
    onClick: () => void
    busy: boolean
    disabled?: boolean
    primary?: boolean
    success?: boolean
    icon?: ReactNode
}) {
    const tone = success
        ? "bg-emerald-600 text-white shadow-[0_8px_18px_-6px_rgb(5_150_105_/_0.55)] hover:brightness-110"
        : primary
            ? "bg-primary text-primary-foreground shadow-primary-glow hover:brightness-110"
            : "border bg-card text-foreground hover:bg-muted"
    return (
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClick() }}
            disabled={disabled}
            aria-busy={busy || undefined}
            className={`inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-60 ${tone}`}
        >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
            <span className="truncate">{children}</span>
        </button>
    )
}
