"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"
import {
    Bell,
    Calendar,
    CheckCircle,
    ClipboardList,
    Clock,
    Megaphone,
    MessageSquare,
    Star,
} from "lucide-react"

function timeAgo(timestamp: number) {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function typeMeta(type: string) {
    switch (type) {
        case "assignment": return { icon: ClipboardList, label: "Assignment" }
        case "reminder": return { icon: Clock, label: "Reminder" }
        case "feedback": return { icon: Star, label: "Feedback" }
        case "announcement": return { icon: Megaphone, label: "Announcement" }
        case "activity": return { icon: Calendar, label: "Event" }
        case "acceptance": return { icon: CheckCircle, label: "Request Accepted" }
        case "progress": return { icon: Clock, label: "Work Started" }
        case "update": return { icon: MessageSquare, label: "Task Update" }
        case "completion": return { icon: CheckCircle, label: "Request Completed" }
        default: return { icon: Bell, label: "Notification" }
    }
}

export function NotificationBell() {
    const { user } = useAuth()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const markedRef = useRef(false)

    const userId = user?._id as any
    const unreadCount = useQuery(api.notifications.getUnreadCount, userId ? { userId } : "skip")
    const notifications = useQuery(
        api.notifications.getForUser,
        open && userId ? { userId } : "skip"
    )
    const markAllRead = useMutation(api.notifications.markAllRead)

    // Clear the badge once the popup has been opened
    useEffect(() => {
        if (open && userId && !markedRef.current) {
            markedRef.current = true
            markAllRead({ userId }).catch(console.error)
        }
        if (!open) markedRef.current = false
    }, [open, userId, markAllRead])

    if (!user) return null

    const worker = isWorker(user.role)

    const handleClick = (n: any) => {
        setOpen(false)
        if (n.assignmentId && worker) {
            router.push(`/assignments/${n.assignmentId}`)
        } else if (n.requestId && !worker) {
            router.push(`/requests/${n.requestId}`)
        } else if (n.type === "announcement" || n.type === "activity") {
            router.push("/updates")
        } else if (worker) {
            router.push("/assignments")
        } else {
            router.push("/requests")
        }
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="relative h-10 w-10 rounded-full border bg-card flex items-center justify-center hover:border-primary/60 hover:text-primary transition-colors active:scale-95"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                {(unreadCount ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {unreadCount! > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <>
                    {/* click-away backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="fixed md:absolute right-2 md:right-0 top-16 md:top-12 z-50 w-[calc(100vw-1rem)] max-w-sm bg-background border-2 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-5 py-4 border-b flex items-center justify-between bg-muted/30">
                            <h3 className="text-sm font-black uppercase tracking-widest">Notifications</h3>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                {worker ? "Assignments · Alerts · Feedback" : "Requests · Alerts · Events"}
                            </span>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto divide-y">
                            {notifications === undefined ? (
                                <div className="p-8 text-center">
                                    <Bell className="h-6 w-6 mx-auto text-muted-foreground/30 animate-pulse" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-10 text-center space-y-2">
                                    <Bell className="h-8 w-8 mx-auto text-muted-foreground/20" />
                                    <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">
                                        No notifications yet
                                    </p>
                                </div>
                            ) : (
                                notifications.map((n: any) => {
                                    const meta = typeMeta(n.type)
                                    const Icon = meta.icon
                                    const isUnread = !n.readAt
                                    return (
                                        <button
                                            key={n._id}
                                            type="button"
                                            onClick={() => handleClick(n)}
                                            className={`w-full text-left px-5 py-4 flex gap-3 transition-colors hover:bg-muted/40 ${isUnread ? "bg-primary/5" : ""}`}
                                        >
                                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${isUnread ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">
                                                        {meta.label}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                                        {timeAgo(n._creationTime)}
                                                    </span>
                                                </div>
                                                <p className={`text-xs mt-1 line-clamp-3 ${isUnread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                                    {n.message}
                                                </p>
                                            </div>
                                            {isUnread && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
