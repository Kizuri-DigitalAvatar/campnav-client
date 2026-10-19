"use client"

import Link from "next/link"
import { useState } from "react"
import { useQuery } from "convex-helpers/react/cache"
import { ChevronRight, Clock, MapPin, Megaphone } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import { ServiceArt } from "@/components/visuals"
import { dayLabel, focusRing, timeAgo } from "@/components/home/dashboard-ui"

const DAY = 86400000

/**
 * "Camp updates" strip near the top of both home screens: important
 * announcements first, then the newest ones and the next few events, as a
 * swipeable row of cards. Each card opens its own page.
 */
export function CampUpdates() {
    const announcements = useQuery(api.announcements.list, { priority: "all" })
    const activities = useQuery(api.activities.list)
    // Read the clock once per visit, not on every render
    const [nowMs] = useState(() => Date.now())

    if (announcements === undefined || activities === undefined) {
        return (
            <section aria-busy="true" className="space-y-3">
                <div className="h-5 w-36 animate-pulse rounded bg-muted" />
                <div className="flex gap-3 overflow-hidden">
                    {[0, 1, 2].map((i) => <div key={i} className="h-40 w-[78%] shrink-0 animate-pulse rounded-3xl bg-muted sm:w-72" />)}
                </div>
            </section>
        )
    }

    const now = new Date(nowMs).setHours(0, 0, 0, 0)
    const isHigh = (a: any) => a.priority?.toLowerCase() === "high"
    const news = [...announcements]
        .sort((a: any, b: any) => Number(isHigh(b)) - Number(isHigh(a)) || (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 5)
    const events = activities
        .filter((e: any) => e.date >= now)
        .sort((a: any, b: any) => a.date - b.date)
        .slice(0, 3)
    const fresh = announcements.filter((a: any) => (a.createdAt || 0) > nowMs - 2 * DAY).length

    if (news.length === 0 && events.length === 0) return null

    return (
        <section aria-labelledby="camp-updates-heading" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <h2 id="camp-updates-heading" className="flex items-center gap-2 text-base font-black tracking-tight">
                    <Megaphone className="h-4 w-4 text-primary" aria-hidden />
                    Camp updates
                    {fresh > 0 && (
                        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">{fresh} new</span>
                    )}
                </h2>
                <Link href="/app/updates" className={`inline-flex items-center gap-0.5 rounded-md text-xs font-semibold text-primary hover:underline ${focusRing}`}>
                    See all <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
            </div>

            <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
                {news.map((a: any, i: number) => (
                    <li key={a._id} className="va-enter w-[78%] shrink-0 snap-start sm:w-72" style={{ ["--enter-delay" as string]: `${i * 50}ms` }}>
                        <Link
                            href={`/app/updates/announcements/${a._id}`}
                            className={`va-trigger group flex h-full flex-col overflow-hidden rounded-3xl border bg-card shadow-card transition-transform active:scale-[0.98] ${isHigh(a) ? "border-rose-500/40" : ""} ${focusRing}`}
                        >
                            <div className="relative h-24 shrink-0 overflow-hidden bg-muted/40">
                                {a.coverImageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={a.coverImageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <ServiceArt kind="news" size={64} tone={isHigh(a) ? "rose" : "emerald"} motion="hover" />
                                    </div>
                                )}
                                {isHigh(a) && (
                                    <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow">Important</span>
                                )}
                            </div>
                            <div className="flex flex-1 flex-col gap-1 p-3.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Announcement · {timeAgo(a.createdAt)}</p>
                                <p className="line-clamp-2 text-sm font-black leading-snug">{a.title}</p>
                            </div>
                        </Link>
                    </li>
                ))}
                {events.map((e: any, i: number) => {
                    const date = new Date(e.date)
                    return (
                        <li key={e._id} className="va-enter w-[78%] shrink-0 snap-start sm:w-72" style={{ ["--enter-delay" as string]: `${(news.length + i) * 50}ms` }}>
                            <Link
                                href={`/app/updates/activities/${e._id}`}
                                className={`group flex h-full flex-col justify-between gap-3 rounded-3xl border bg-card p-3.5 shadow-card transition-transform active:scale-[0.98] ${focusRing}`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="flex w-14 shrink-0 flex-col items-center rounded-2xl bg-violet-500/10 py-2 text-violet-700 dark:text-violet-300">
                                        <span className="text-[10px] font-black uppercase">{date.toLocaleDateString(undefined, { month: "short" })}</span>
                                        <span className="text-2xl font-black leading-none">{date.getDate()}</span>
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Event · {dayLabel(e.date)}</p>
                                        <p className="line-clamp-2 text-sm font-black leading-snug">{e.title}</p>
                                    </div>
                                </div>
                                <div className="space-y-1 text-[11px] font-semibold text-muted-foreground">
                                    <p className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden />{e.time}</p>
                                    {e.location && <p className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" aria-hidden />{e.location}</p>}
                                </div>
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}
