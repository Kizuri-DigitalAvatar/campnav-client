"use client"

import { ChevronRight, Clock, MapPin } from "lucide-react"
import { ServiceArt, type ArtTone } from "@/components/visuals"
import { CardLink, type CollectionView } from "@/components/collection"
import { dayLabel, timeAgo } from "@/components/home/dashboard-ui"

const PRIORITY: Record<string, string> = {
    high: "bg-rose-500/12 text-rose-700 dark:text-rose-400 border-rose-500/25",
    medium: "bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/25",
    low: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
}

const CATEGORY_TONE: Record<string, ArtTone> = { social: "blue", outdoor: "emerald", workshop: "amber", sports: "orange" }

function Cover({ src, fallback, className }: { src?: string; fallback: React.ReactNode; className: string }) {
    return src ? (
        <div className={`shrink-0 overflow-hidden border bg-muted ${className}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
    ) : <>{fallback}</>
}

export function AnnouncementCard({ item, variant = "list" }: { item: any; variant?: CollectionView }) {
    const priority = item.priority?.toLowerCase() ?? "low"
    const pill = (
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${PRIORITY[priority] ?? PRIORITY.low}`}>
            {priority}
        </span>
    )
    const link = <CardLink href={`/app/updates/announcements/${item._id}`} label={`Read announcement: ${item.title}`} />

    if (variant === "list") {
        return (
            <article className="va-trigger glass-card group relative rounded-2xl p-3 sm:p-4 transition-transform active:scale-[0.985]">
                {link}
                <div className="flex items-start gap-3">
                    <Cover src={item.coverImageUrl} className="h-14 w-14 rounded-xl" fallback={<ServiceArt kind="news" size={56} tone={priority === "high" ? "rose" : "emerald"} />} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="line-clamp-2 text-sm font-black leading-snug">{item.title}</h3>
                            {pill}
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.content}</p>
                        <p className="mt-1 text-[10px] font-semibold text-muted-foreground/80">{timeAgo(item.createdAt)}</p>
                    </div>
                    <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </div>
            </article>
        )
    }

    return (
        <article className="va-trigger glass-card group relative flex h-full flex-col overflow-hidden rounded-3xl transition-transform active:scale-[0.99]">
            {link}
            {item.coverImageUrl ? (
                <Cover src={item.coverImageUrl} className="h-40 w-full border-0 border-b" fallback={null} />
            ) : (
                <div className="flex h-40 items-center justify-center border-b bg-muted/30">
                    <ServiceArt kind="news" size={88} tone={priority === "high" ? "rose" : "emerald"} />
                </div>
            )}
            <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                    {pill}
                    <span className="text-[11px] font-semibold text-muted-foreground">{timeAgo(item.createdAt)}</span>
                </div>
                <h3 className="text-base font-black leading-snug transition-colors group-hover:text-primary">{item.title}</h3>
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{item.content}</p>
                <span className="mt-auto inline-flex items-center pt-2 text-xs font-semibold text-primary">
                    Read more <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
            </div>
        </article>
    )
}

export function ActivityCard({ item, variant = "list" }: { item: any; variant?: CollectionView }) {
    const date = new Date(item.date)
    const tone = CATEGORY_TONE[item.category?.toLowerCase()] ?? "violet"
    const link = <CardLink href={`/app/updates/activities/${item._id}`} label={`Open event: ${item.title}, ${dayLabel(item.date)}`} />
    const dateTile = (
        <span className="flex w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/10 py-2 text-primary">
            <span className="text-[10px] font-black uppercase">{date.toLocaleDateString(undefined, { month: "short" })}</span>
            <span className="text-2xl font-black leading-none">{date.getDate()}</span>
        </span>
    )
    const meta = (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden />{dayLabel(item.date)} · {item.time}</span>
            {item.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden />{item.location}</span>}
        </div>
    )

    if (variant === "list") {
        return (
            <article className="va-trigger glass-card group relative rounded-2xl p-3 sm:p-4 transition-transform active:scale-[0.985]">
                {link}
                <div className="flex items-center gap-3">
                    {dateTile}
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.category}</p>
                        <h3 className="truncate text-sm font-black leading-tight">{item.title}</h3>
                        <div className="mt-1">{meta}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </div>
            </article>
        )
    }

    return (
        <article className="va-trigger glass-card group relative flex h-full flex-col overflow-hidden rounded-3xl transition-transform active:scale-[0.99]">
            {link}
            {item.coverImageUrl ? (
                <Cover src={item.coverImageUrl} className="h-40 w-full border-0 border-b" fallback={null} />
            ) : (
                <div className="flex h-40 items-center justify-center border-b bg-muted/30">
                    <ServiceArt kind="calendar" size={88} tone={tone} />
                </div>
            )}
            <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                    {dateTile}
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.category}</p>
                        <h3 className="line-clamp-2 text-base font-black leading-snug transition-colors group-hover:text-primary">{item.title}</h3>
                    </div>
                </div>
                {item.description && <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
                <div className="mt-auto border-t pt-3">{meta}</div>
            </div>
        </article>
    )
}

