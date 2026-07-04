"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useAuth } from "@/components/auth-provider"
import { Headset, Loader2, Send, X } from "lucide-react"
import { toast } from "sonner"

export function ContactSupportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { user } = useAuth()
    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)
    const submitSupportMessage = useMutation(api.reports.submitSupportMessage)

    if (!open) return null

    const handleSend = async () => {
        if (!user || !message.trim()) return
        setIsSending(true)
        try {
            await submitSupportMessage({ userId: user._id, message: message.trim() })
            toast.success("Message sent", {
                description: "Our support team has been notified and will get back to you.",
            })
            setMessage("")
            onClose()
        } catch (err) {
            console.error("Failed to send support message:", err)
            toast.error("Could not send your message. Please try again.")
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={() => !isSending && onClose()} />
            <div className="relative w-full max-w-md bg-background border-2 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Headset className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest">Contact Support</h3>
                            <p className="text-[10px] text-muted-foreground font-medium">Goes straight to the camp admins</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-muted transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <textarea
                        autoFocus
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="How can we help? Describe your question or issue..."
                        className="w-full rounded-2xl border bg-muted/30 p-4 text-sm min-h-[140px] outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus:bg-background transition-colors"
                        disabled={isSending}
                    />
                    <p className="text-[10px] text-muted-foreground font-medium">
                        Sending as <span className="font-bold text-foreground">{user?.name}</span>
                        {user?.roomNumber ? ` · Room ${user.roomNumber}` : ""}
                    </p>
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={isSending || !message.trim()}
                        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                Send Message
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
