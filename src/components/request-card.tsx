"use client"

import { ChevronRight, Clock, ImageIcon } from "lucide-react"
import { JourneyBar, ServiceArt, artForType } from "@/components/visuals"
import { CardLink, StatusPill, statusLabel, type CollectionView } from "@/components/collection"
import { timeAgo } from "@/components/home/dashboard-ui"

interface RequestCardProps {
    request: any
    /** "grid" is the full card; "list" is a compact row */
    variant?: CollectionView
}

const label = (type: string) => type.replace(/_/g, " ")

/** A resident's service request; tapping anywhere opens its tracker. */
export function RequestCard({ request: req, variant = "list" }: RequestCardProps) {
    const art = artForType(req.type)
    const live = req.status === "in_progress"
    const link = <CardLink href={`/app/requests/${req._id}`} label={`Open request: ${label(req.type)}, ${statusLabel(req.status)}`} />

    if (variant === "list") {
        return (
            <article className="va-trigger glass-card group relative rounded-2xl p-3 sm:p-4 transition-transform active:scale-[0.985]">
                {link}
                <div className="flex items-start gap-3">
                    <ServiceArt kind={art} size={48} motion={live ? "always" : "hover"} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="truncate text-base font-black capitalize leading-tight">{label(req.type)}</h3>
                            <StatusPill status={req.status} />
                        </div>
                        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                            Room {req.roomNumber} · {timeAgo(req.createdAt)}
                        </p>
                        {req.description && <p className="mt-1.5 line-clamp-1 text-xs text-foreground/75">{req.description}</p>}
                        <div className="mt-2.5 flex items-center gap-2">
                            <JourneyBar status={req.status} className="flex-1" />
                            {req.imageUrl && <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" aria-label="Has a photo" />}
                        </div>
                    </div>
                    <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </div>
            </article>
        )
    }

    return (
        <article className="va-trigger glass-card group relative flex h-full flex-col gap-4 rounded-3xl p-4 sm:p-5 transition-transform active:scale-[0.99]">
            {link}
            <header className="flex items-start gap-3">
                <ServiceArt kind={art} size={52} motion={live ? "always" : "hover"} />
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-xl font-black capitalize leading-tight">{label(req.type)}</h3>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Room {req.roomNumber}</p>
                </div>
                <StatusPill status={req.status} />
            </header>

            <JourneyBar status={req.status} showLabel />

            {req.description && (
                <p className="line-clamp-3 rounded-2xl border border-primary/10 bg-primary/[0.04] p-3.5 text-sm leading-relaxed text-foreground/80">
                    &ldquo;{req.description}&rdquo;
                </p>
            )}
            {req.imageUrl && (
                <div className="h-36 w-full overflow-hidden rounded-xl border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={req.imageUrl} alt="Photo from the request" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                </div>
            )}

            <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden />Sent {timeAgo(req.createdAt)}</span>
                <span className="inline-flex items-center font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Track <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </span>
            </div>
        </article>
    )
}
