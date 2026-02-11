"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { NotificationListener } from "@/components/notification-listener"

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null // or a loading spinner
    }

    return (
        <>
            <NotificationListener />
            <NavigationWrapper />
            <AuthGuard>{children}</AuthGuard>
        </>
    )
}

import { Header } from "@/components/header"
import { useAuth } from "@/components/auth-provider"

function NavigationWrapper() {
    const { user } = useAuth()
    if (!user) return null
    return <Header />
}
