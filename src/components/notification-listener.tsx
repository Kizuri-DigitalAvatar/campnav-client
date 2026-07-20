"use client"

import { useEffect, useRef } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "../../convex/_generated/api"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"

export function NotificationListener() {
    const { user } = useAuth()
    const userId = user?._id as any
    const router = useRouter()

    // Only query push-channel pending notifications for this user
    const pendingNotifications = useQuery(
        api.notifications.getMyPendingNotifications,
        userId ? { userId } : "skip"
    )

    const markAsDelivered = useMutation(api.notifications.markNotificationDelivered)
    const lastNotifiedRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        if (!pendingNotifications || pendingNotifications.length === 0) return

        pendingNotifications.forEach((notification) => {
            // Avoid double-toast if multiple re-renders happen quickly
            if (lastNotifiedRef.current.has(notification._id)) return

            lastNotifiedRef.current.add(notification._id)

            // Determine toast title based on notification type
            const toastTitle =
                notification.type === "assignment" ? "New Assignment" :
                notification.type === "room_assignment" ? "🏠 Room Assigned" :
                notification.type === "reminder" ? "Reminder" :
                notification.type === "acceptance" ? "Request Accepted" :
                notification.type === "completion" ? "Request Completed" :
                notification.type === "announcement" ? "Announcement" :
                notification.type === "rnr_countdown" ? "✈️ RnR Countdown" :
                "Notification"

            // Show toast
            toast(toastTitle, {
                description: notification.message,
                icon: <Bell className="w-4 h-4 text-primary" />,
                duration: 6000,
                // No action button for room_assignment – it's informational
                action: notification.type === "room_assignment" || notification.type === "rnr_countdown"
                    ? undefined
                    : {
                        label: "Details",
                        onClick: () => {
                            if (notification.assignmentId) {
                                router.push(`/assignments/${notification.assignmentId}`)
                            } else if (notification.requestId) {
                                router.push(`/requests/${notification.requestId}`)
                            } else {
                                router.push("/requests")
                            }
                        },
                    },
            })

            // Mark as delivered so it won't re-appear on next query
            markAsDelivered({ id: notification._id, status: "delivered" }).catch(err => {
                console.error("Failed to mark notification as delivered:", err)
            })
        })
    }, [pendingNotifications, markAsDelivered, router])

    return null
}
