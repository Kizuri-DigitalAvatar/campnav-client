"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { NotificationListener } from "@/components/notification-listener"
import { Header } from "@/components/header"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"

// Staff cannot request services — these routes are resident/guest only
const STAFF_BLOCKED_ROUTES = [
    "/services",
    "/room-service",
    "/laundry",
    "/house-keeping",
    "/maintenance",
    "/delivery",
    "/meals",
    "/facilities",
    "/requests",
]

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(true)
    const { user } = useAuth()
    const pathname = usePathname()
    const router = useRouter()

    const isBlockedForStaff =
        !!user &&
        isWorker(user.role) &&
        STAFF_BLOCKED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))

    useEffect(() => {
        if (isBlockedForStaff) {
            router.replace("/")
        }
    }, [isBlockedForStaff, router])

    if (!mounted) {
        return null // or a loading spinner
    }

    return (
        <>
            <NotificationListener />
            <NavigationWrapper />
            <AuthGuard>{isBlockedForStaff ? null : children}</AuthGuard>
        </>
    )
}

function NavigationWrapper() {
    const { user } = useAuth()
    if (!user) return null
    return (
        <>
            <Header />
            {/* spacer for the fixed header */}
            <div className="h-16" />
        </>
    )
}
