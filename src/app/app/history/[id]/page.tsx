"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { Loader2, PackageCheck, ShoppingBag, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "../../../../../convex/_generated/api"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"
import { RequestJourney, ServiceArt } from "@/components/visuals"
import { ActionBar, CollectionEmpty, PageHeader, PageSkeleton, StatusPill } from "@/components/collection"
import { OrderVerifyDialog } from "@/components/order-verify-dialog"
import { needsConfirmation, orderTitle } from "@/components/order-card"

function formatTime(ts: number) {
    return new Date(ts).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

/**
 * One order. Reads from the resident's order list (already cached from the
 * Orders page), so opening it is instant and needs no extra backend query.
 */
export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { user } = useAuth()
    const orders = useQuery(api.orders.listForUser, user && !isWorker(user.role) ? { userId: user._id } : "skip")
    const deleteOrder = useMutation(api.orders.deleteOrder)
    const [verifying, setVerifying] = useState(false)
    const [cancelling, setCancelling] = useState(false)

    // Staff have no orders; their History tab is work history
    const staff = !!user && isWorker(user.role)
    useEffect(() => { if (staff) router.replace("/app/history") }, [staff, router])

    if (staff || !user || orders === undefined) return <PageSkeleton view="list" />

    const order = orders.find((o: any) => o._id === id)
    if (!order) {
        return (
            <div className="space-y-5">
                <PageHeader title="Order" back={{ href: "/app/history", label: "My Orders" }} />
                <CollectionEmpty art="search" title="Order not found" hint="It may have been cancelled." action={{ label: "Back to my orders", href: "/app/history" }} />
            </div>
        )
    }

    const art = order.source === "room_service" ? "room_service" : "shop"
    const canCancel = order.status === "pending" || order.status === "in_progress"

    async function cancel() {
        if (!confirm("Cancel this order?")) return
        setCancelling(true)
        try {
            await deleteOrder({ id: order._id })
            toast.success("Order cancelled")
            router.push("/app/history")
        } catch (e) {
            console.error(e)
            toast.error("Could not cancel the order")
            setCancelling(false)
        }
    }

    return (
        <div className="space-y-5 pb-6">
            <PageHeader title="Order details" back={{ href: "/app/history", label: "My Orders" }} />

            <section className="space-y-5 rounded-3xl border bg-card p-5 shadow-sm md:p-6">
                <div className="flex items-start gap-3">
                    <ServiceArt kind={art} size={60} motion={order.status === "in_progress" ? "always" : "ambient"} />
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-black leading-tight">{orderTitle(order)}</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {order.source === "room_service" ? "Room service" : "Shop"} · {formatTime(order.createdAt)}
                            {order.roomNumber && <> · Room {order.roomNumber}</>}
                        </p>
                    </div>
                    <StatusPill status={order.status} audience="order" />
                </div>
                <RequestJourney status={order.status} type={order.source} showHeadline={false} times={{ sent: order.createdAt, done: order.confirmedAt }} />
                {order.placedBy && <p className="text-xs font-semibold text-primary">Ordered for you by the camp team</p>}
            </section>

            <section className="rounded-3xl border bg-card p-5 shadow-sm md:p-6">
                <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Items</h2>
                {order.items?.length > 0 ? (
                    <ul className="divide-y">
                        {order.items.map((item: any, i: number) => (
                            <li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                                    {item.imageUrl
                                        // eslint-disable-next-line @next/next/no-img-element
                                        ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                                        : <ShoppingBag className="h-4 w-4 text-muted-foreground/60" />}
                                </div>
                                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.name}</span>
                                <span className="shrink-0 text-sm text-muted-foreground">×{item.quantity}</span>
                                {item.price !== undefined && <span className="w-20 shrink-0 text-right text-sm font-bold tabular-nums">Le {(item.price * item.quantity).toFixed(2)}</span>}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm">{order.summary}</p>
                )}
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <span className="text-sm font-semibold text-muted-foreground">Total</span>
                    <span className="text-xl font-black tabular-nums">Le {order.total.toFixed(2)}</span>
                </div>
                {order.note && <p className="mt-3 text-xs text-muted-foreground">Note: {order.note}</p>}
            </section>

            {order.confirmedAt && (
                <section className="space-y-3 rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-5 md:p-6">
                    <p className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        <PackageCheck className="h-4 w-4" /> You confirmed delivery · {formatTime(order.confirmedAt)}
                    </p>
                    {order.confirmationNote && <p className="text-sm text-foreground/80">&ldquo;{order.confirmationNote}&rdquo;</p>}
                    {order.evidenceUrls?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {order.evidenceUrls.map((url: string) => (
                                <div key={url} className="h-20 w-20 overflow-hidden rounded-xl border bg-background">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={url} alt="Delivery photo" className="h-full w-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {(needsConfirmation(order) || canCancel) && (
                <ActionBar>
                    {canCancel && (
                        <button
                            type="button"
                            onClick={cancel}
                            disabled={cancelling}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border bg-card px-4 text-xs font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-rose-500/10 hover:text-rose-600 active:scale-95 disabled:opacity-60"
                        >
                            {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Cancel
                        </button>
                    )}
                    {needsConfirmation(order) && (
                        <button
                            type="button"
                            onClick={() => setVerifying(true)}
                            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-black uppercase tracking-widest text-primary-foreground shadow-primary-glow transition-all hover:brightness-110 active:scale-95"
                        >
                            <PackageCheck className="h-4 w-4" /> It arrived
                        </button>
                    )}
                </ActionBar>
            )}

            {verifying && <OrderVerifyDialog order={order} userId={user._id} onClose={() => setVerifying(false)} />}
        </div>
    )
}
