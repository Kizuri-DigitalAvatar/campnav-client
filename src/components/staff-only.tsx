"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"

// Staff task screens: residents and guests get sent to their own requests instead
export function StaffOnly({ children, fallback = "/app/requests" }: { children: ReactNode; fallback?: string }) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const allowed = !!user && isWorker(user.role)

    useEffect(() => {
        if (!loading && user && !allowed) router.replace(fallback)
    }, [loading, user, allowed, fallback, router])

    if (loading || !allowed) return null
    return <>{children}</>
}
