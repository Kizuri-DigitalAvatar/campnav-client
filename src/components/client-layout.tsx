"use client"

import { useState, useEffect } from "react"
import { AuthProvider } from "@/components/auth-provider"
import { AuthGuard } from "@/components/auth-guard"

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null // or a loading spinner
    }

    return (
        <AuthProvider>
            <AuthGuard>{children}</AuthGuard>
            <BottomNavWrapper />
        </AuthProvider>
    )
}

import { BottomNav } from "@/components/bottom-nav"
import { useAuth } from "@/components/auth-provider"

function BottomNavWrapper() {
    const { user } = useAuth()
    if (!user) return null
    return <BottomNav />
}
