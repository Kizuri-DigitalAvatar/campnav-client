"use client"

import { useEffect, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"

export function NotificationListener() {
    const { user } = useAuth()
    const userId = user?._id as any
    const router = useRouter()

    // Only query if we have a user
    // The query should now be available since convex dev has run
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

            // Show toast
            toast(notification.type === "assignment" ? "New Assignment" : "Notification", {
                description: notification.message,
                icon: <Bell className="w-4 h-4 text-primary" />,
                action: {
                    label: "Details",
                    onClick: () => {
                        if (notification.assignmentId) {
                            router.push(`/assignments/${notification.assignmentId}`)
                        } else {
                            router.push("/assignments")
                        }
                    },
                },
            })

            // Mark as delivered immediately so it doesn't stay in "pending" status
            // (Setting it to "delivered" prevents it from showing up in the pending query next time)
            markAsDelivered({ id: notification._id, status: "delivered" }).catch(err => {
                console.error("Failed to mark notification as delivered:", err)
            })
        })
    }, [pendingNotifications, markAsDelivered])

    return null
}
