"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { NotificationListener } from "@/components/notification-listener"
import { DataPrefetcher } from "@/components/data-prefetcher"
import { Header } from "@/components/header"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"
import { CelebrationHost } from "@/components/visuals"
import { BottomNav } from "@/components/bottom-nav"

// Staff cannot request services — these routes are resident/guest only
const STAFF_BLOCKED_ROUTES = [
    "/app/services",
    "/app/room-service",
    "/app/laundry",
    "/app/house-keeping",
    "/app/maintenance",
    "/app/delivery",
    "/app/meals",
    "/app/facilities",
    "/app/requests",
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
            router.replace("/app")
        }
    }, [isBlockedForStaff, router])

    if (!mounted) {
        return null // or a loading spinner
    }

    return (
        <>
            <NotificationListener />
            <CelebrationHost />
            {user && <DataPrefetcher />}
            <NavigationWrapper />
            <AuthGuard>
                {/* Re-keyed per page so each screen eases in — navigation feels like one flow */}
                <div key={pathname} className="va-page">{isBlockedForStaff ? null : children}</div>
            </AuthGuard>
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
            <BottomNav />
        </>
    )
}
