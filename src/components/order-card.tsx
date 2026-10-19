"use client"

import { ChevronRight, Clock, PackageCheck } from "lucide-react"
import { JourneyBar, ServiceArt } from "@/components/visuals"
import { CardLink, StatusPill, statusLabel, type CollectionView } from "@/components/collection"
import { timeAgo } from "@/components/home/dashboard-ui"

export function orderTitle(order: any) {
    return order.items?.length
        ? order.items.map((i: any) => (i.quantity > 1 ? `${i.quantity}× ${i.name}` : i.name)).join(", ")
        : order.quantity ? `${order.quantity}× ${order.summary}` : order.summary
}

export function needsConfirmation(order: any) {
    return order.status !== "completed" && order.status !== "failed" && !order.confirmedAt
}

/** A resident's shop / room-service order; tapping opens the order page. */
export function OrderCard({ order, variant = "list" }: { order: any; variant?: CollectionView }) {
    const art = order.source === "room_service" ? "room_service" : "shop"
    const title = orderTitle(order)
    const source = order.source === "room_service" ? "Room service" : "Shop"
    const link = <CardLink href={`/app/history/${order._id}`} label={`Open order: ${title}, ${statusLabel(order.status, "order")}`} />
    const thumb = order.productImage

    const picture = (size: number, rounded: string) => thumb ? (
        <div className={`shrink-0 overflow-hidden border bg-muted ${rounded}`} style={{ width: size, height: size }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
    ) : (
        <ServiceArt kind={art} size={size} motion={order.status === "in_progress" ? "always" : "hover"} />
    )

    if (variant === "list") {
        return (
            <article className="va-trigger glass-card group relative rounded-2xl p-3 sm:p-4 transition-transform active:scale-[0.985]">
                {link}
                <div className="flex items-start gap-3">
                    {picture(48, "rounded-xl")}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="truncate text-sm font-black leading-tight">{title}</h3>
                            <StatusPill status={order.status} audience="order" />
                        </div>
                        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                            {source} · <span className="font-bold text-foreground">Le {order.total.toFixed(2)}</span> · {timeAgo(order.createdAt)}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                            <JourneyBar status={order.status} className="flex-1" />
                            {order.confirmedAt && <PackageCheck className="h-3.5 w-3.5 text-emerald-600" aria-label="You confirmed delivery" />}
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
                {picture(56, "rounded-2xl")}
                <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-base font-black leading-tight">{title}</h3>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{source}</p>
                </div>
                <StatusPill status={order.status} audience="order" />
            </header>

            <JourneyBar status={order.status} />

            <div className="mt-auto flex items-end justify-between gap-3">
                <div className="space-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden />{timeAgo(order.createdAt)}</span>
                    {order.confirmedAt ? (
                        <p className="inline-flex items-center gap-1 font-semibold text-emerald-600"><PackageCheck className="h-3.5 w-3.5" aria-hidden />Delivery confirmed</p>
                    ) : needsConfirmation(order) ? (
                        <p className="font-semibold text-amber-600 dark:text-amber-400">Tap to confirm when it arrives</p>
                    ) : null}
                </div>
                <p className="text-lg font-black tabular-nums">Le {order.total.toFixed(2)}</p>
            </div>
        </article>
    )
}
