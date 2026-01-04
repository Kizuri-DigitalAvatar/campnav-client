"use client"

import { useAuth } from "@/components/auth-provider"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Card } from "@/components/ui/card"
import { ShoppingBag, Clock, ChevronRight } from "lucide-react"

export default function HistoryPage() {
    const { user } = useAuth()
    const orders = useQuery(api.orders.listForUser, user ? { userId: user._id } : "skip")

    if (!user) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Order History</h1>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                    {orders?.length || 0} Orders
                </div>
            </div>

            <div className="space-y-4">
                {orders === undefined ? (
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-muted rounded-2xl" />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-3xl border-2 border-dashed border-border/50">
                        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">No orders yet</p>
                    </div>
                ) : (
                    orders.map((order: any) => (
                        <Card key={order._id} className="p-4 rounded-2xl hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <ShoppingBag size={18} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{order.source.replace('_', ' ')}</p>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Clock size={10} />
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold">${order.total.toFixed(2)}</p>
                                    <p className="text-[10px] text-emerald-500 font-medium capitalize">{order.status}</p>
                                </div>
                            </div>
                            <div className="bg-muted/50 rounded-xl p-3 flex items-center justify-between text-xs text-muted-foreground group cursor-pointer hover:bg-muted transition-colors">
                                <span className="truncate flex-1">{order.summary}</span>
                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
