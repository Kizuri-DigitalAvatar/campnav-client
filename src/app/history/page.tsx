"use client"

import { useAuth } from "@/components/auth-provider"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "../../../convex/_generated/api"
import { Card } from "@/components/ui/card"
import { ShoppingBag, Clock, ChevronRight, ClipboardList, XCircle, UploadCloud, Image as ImageIcon, Trash2 } from "lucide-react"
import { isWorker } from "@/components/role-guard"
import { TaskCard } from "@/components/task-card"

import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

export default function HistoryPage() {
    const { user, loading } = useAuth()
    const orders = useQuery(api.orders.listForUser, user && !isWorker(user.role) ? { userId: user._id } : "skip")
    const assignments = useQuery(api.tasks.getWorkerAssignments, user && isWorker(user.role) ? { workerId: user._id } : "skip")
    const confirmReceipt = useMutation(api.orders.confirmReceipt)
    const generateUploadUrl = useMutation(api.images.generateUploadUrl)
    const deleteOrder = useMutation(api.orders.deleteOrder)

    const [showConfirm, setShowConfirm] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [note, setNote] = useState("")
    const [files, setFiles] = useState<File[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const isLoading = loading || (user && (isWorker(user.role) ? assignments === undefined : orders === undefined))

    if (isLoading) {
        return (
            <div className="space-y-6 pb-20">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
                </div>
            </div>
        )
    }

    if (!user) return null

    if (isWorker(user.role)) {
        const completedAssignments = (assignments || []).filter(a => a.status === "completed" || a.status === "rated")

        return (
            <div className="space-y-6 pb-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Work History</h1>
                        <p className="text-xs text-muted-foreground mt-1 tracking-tight">Your completed tasks and feedback</p>
                    </div>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                        {completedAssignments.length} Tasks
                    </div>
                </div>

                <div className="space-y-4">
                    {assignments === undefined ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-40 bg-muted rounded-3xl" />
                            ))}
                        </div>
                    ) : completedAssignments.length === 0 ? (
                        <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border/50">
                            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-sm font-semibold text-muted-foreground">No completed tasks yet</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Assignments you finish will appear here</p>
                        </div>
                    ) : (
                        completedAssignments.map((assignment: any) => (
                            <TaskCard
                                key={assignment._id}
                                assignment={assignment}
                                // View only mode for history
                                readOnly
                            />
                        ))
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Order History</h1>
                    <p className="text-xs text-muted-foreground mt-1 tracking-tight">Track your previous purchases and requests</p>
                </div>
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
                        <Card key={order._id} className="p-4 rounded-2xl hover:shadow-md transition-shadow space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {order.productImage ? (
                                        <div className="h-12 w-12 rounded-xl overflow-hidden border bg-muted/40">
                                            <img src={order.productImage} alt={order.summary} className="h-full w-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <ShoppingBag size={18} className="text-primary" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold capitalize truncate">{order.source.replace('_', ' ')}</p>
                                            <Badge
                                                variant="outline"
                                                className={`border text-[10px] font-black uppercase tracking-widest ${
                                                    order.status === 'completed'
                                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                                                        : order.status === 'failed'
                                                            ? 'bg-rose-500/10 text-rose-600 border-rose-200'
                                                            : order.status === 'in_progress'
                                                                ? 'bg-blue-500/10 text-blue-600 border-blue-200'
                                                                : 'bg-amber-500/10 text-amber-700 border-amber-200'
                                                }`}
                                            >
                                                {order.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                                            <Clock size={10} />
                                            {new Date(order.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold">Le {order.total.toFixed(2)}</p>
                                    {order.confirmedAt ? (
                                        <p className="text-[10px] text-emerald-500 font-medium">Verified</p>
                                    ) : (
                                        <p className="text-[10px] text-muted-foreground">Awaiting confirmation</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate flex-1">
                                        {order.quantity ? `${order.quantity}x ${order.summary}` : order.summary}
                                    </span>
                                    <ChevronRight size={14} className="text-muted-foreground/60" />
                                </div>
                                {order.confirmationNote && (
                                    <p className="text-[11px] text-foreground mt-2 font-medium">Note: {order.confirmationNote}</p>
                                )}
                                {order.confirmationEvidence?.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {order.confirmationEvidence.map((id: string) => (
                                            <div key={id} className="w-16 h-16 rounded-lg overflow-hidden border bg-background">
                                                <img
                                                    src={`https://api.convex.dev/api/storage/${id}`}
                                                    alt="delivery evidence"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {order.status !== 'completed' && order.status !== 'failed' && (
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => {
                                            setSelectedOrder(order)
                                            setShowConfirm(true)
                                            setNote("")
                                            setFiles([])
                                        }}
                                        className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:opacity-90 transition-colors"
                                    >
                                        Verify delivery
                                    </button>
                                    {(order.status === 'pending' || order.status === 'in_progress') && (
                                        <button
                                            onClick={async () => {
                                                if (!confirm("Cancel this order?")) return
                                                try {
                                                    await deleteOrder({ id: order._id })
                                                } catch (e) {
                                                    console.error(e)
                                                    alert("Could not cancel order")
                                                }
                                            }}
                                            className="h-10 px-3 rounded-xl border bg-muted text-muted-foreground text-[10px] uppercase tracking-widest flex items-center gap-1 hover:bg-muted/70 transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>

            {showConfirm && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card border rounded-3xl shadow-xl w-full max-w-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-muted-foreground font-black">Order verification</p>
                                <p className="text-sm font-semibold">{selectedOrder.summary}</p>
                            </div>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="p-2 rounded-xl hover:bg-muted"
                                disabled={isSubmitting}
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                                Add a short note (optional)
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full h-24 rounded-2xl border bg-muted/50 px-4 py-3 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="E.g. Package delivered to my tent, all items intact"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                                Evidence (photo or receipt)
                            </label>
                            <label className="flex items-center justify-center gap-2 h-32 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
                                    disabled={isSubmitting}
                                />
                                <UploadCloud className="w-5 h-5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {files.length > 0 ? `${files.length} file(s) selected` : "Tap to add photos"}
                                </span>
                            </label>
                            {files.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {files.map((file) => (
                                        <div key={file.name} className="flex items-center gap-2 text-xs bg-muted rounded-lg px-3 py-2 border">
                                            <ImageIcon className="w-4 h-4" />
                                            <span className="truncate max-w-[160px]">{file.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={isSubmitting}
                                className="flex-1 h-11 rounded-xl border bg-muted text-foreground text-xs font-black uppercase tracking-widest hover:bg-muted/80"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!selectedOrder) return
                                    setIsSubmitting(true)
                                    try {
                                        const evidenceIds: string[] = []
                                        for (const file of files) {
                                            const url = await generateUploadUrl()
                                            const res = await fetch(url, {
                                                method: "POST",
                                                headers: { "Content-Type": file.type },
                                                body: file,
                                            })
                                            const { storageId } = await res.json()
                                            evidenceIds.push(storageId)
                                        }

                                        await confirmReceipt({
                                            orderId: selectedOrder._id,
                                            userId: user._id,
                                            note: note || undefined,
                                            evidence: evidenceIds,
                                        })

                                        setShowConfirm(false)
                                        alert("Thanks! Delivery verified.")
                                    } catch (error) {
                                        console.error("Failed to confirm receipt", error)
                                        alert("Could not submit verification. Please try again.")
                                    } finally {
                                        setIsSubmitting(false)
                                    }
                                }}
                                disabled={isSubmitting}
                                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
                            >
                                {isSubmitting ? "Submitting..." : "Confirm receipt"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
