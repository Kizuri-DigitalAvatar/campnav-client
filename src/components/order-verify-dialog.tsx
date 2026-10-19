"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { Image as ImageIcon, Loader2, UploadCloud, XCircle } from "lucide-react"
import { toast } from "sonner"
import { api } from "../../convex/_generated/api"
import { celebrate } from "@/components/visuals"

/** Resident confirms an order arrived, with an optional note and photos. */
export function OrderVerifyDialog({ order, userId, onClose }: { order: any; userId: any; onClose: () => void }) {
    const confirmReceipt = useMutation(api.orders.confirmReceipt)
    const generateUploadUrl = useMutation(api.images.generateUploadUrl)
    const [note, setNote] = useState("")
    const [files, setFiles] = useState<File[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function submit() {
        setIsSubmitting(true)
        try {
            const evidenceIds: string[] = []
            for (const file of files) {
                const url = await generateUploadUrl()
                const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file })
                const { storageId } = await res.json()
                evidenceIds.push(storageId)
            }
            await confirmReceipt({ orderId: order._id, userId, note: note || undefined, evidence: evidenceIds })
            onClose()
            celebrate({ title: "Thanks!", message: "You confirmed your delivery.", kind: order.source === "room_service" ? "room_service" : "shop" })
        } catch (error) {
            console.error("Failed to confirm receipt", error)
            toast.error("Could not confirm your delivery", { description: "Please try again." })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-foreground/25 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => !isSubmitting && onClose()} />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Confirm delivery"
                className="relative w-full max-w-lg space-y-4 rounded-t-3xl border bg-card p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-pop animate-in slide-in-from-bottom-6 duration-300 sm:rounded-3xl sm:pb-6 sm:zoom-in-95 sm:slide-in-from-bottom-2"
            >
                <div className="mx-auto -mt-2 mb-1 h-1.5 w-10 rounded-full bg-muted sm:hidden" aria-hidden />
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Confirm delivery</p>
                        <p className="text-sm font-semibold">{order.summary}</p>
                    </div>
                    <button onClick={onClose} className="rounded-xl p-2 hover:bg-muted" disabled={isSubmitting} aria-label="Close">
                        <XCircle className="h-5 w-5" />
                    </button>
                </div>

                <label className="block space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Add a short note (optional)</span>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="h-24 w-full rounded-2xl border bg-muted/50 px-4 py-3 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-primary/20"
                        placeholder="E.g. Delivered to my room, all items there"
                        disabled={isSubmitting}
                    />
                </label>

                <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Photo (optional)</span>
                    <label className="flex h-28 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-colors hover:bg-muted/50">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
                            disabled={isSubmitting}
                        />
                        <UploadCloud className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            {files.length > 0 ? `${files.length} photo(s) added` : "Tap to add a photo"}
                        </span>
                    </label>
                    {files.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {files.map((file) => (
                                <div key={file.name} className="flex items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-xs">
                                    <ImageIcon className="h-4 w-4" />
                                    <span className="max-w-[160px] truncate">{file.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="h-12 flex-1 rounded-2xl border bg-muted text-xs font-black uppercase tracking-widest hover:bg-muted/80"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={isSubmitting}
                        className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-black uppercase tracking-widest text-primary-foreground shadow-primary-glow hover:brightness-110 disabled:opacity-60"
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isSubmitting ? "Sending…" : "It arrived"}
                    </button>
                </div>
            </div>
        </div>
    )
}
