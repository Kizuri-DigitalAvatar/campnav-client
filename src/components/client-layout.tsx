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
            <NavigationWrapper />
            <AuthGuard>{children}</AuthGuard>
        </AuthProvider>
    )
}

import { BurgerMenu } from "@/components/burger-menu"
import { Header } from "@/components/header"
import { useAuth } from "@/components/auth-provider"

function NavigationWrapper() {
    const { user } = useAuth()
    if (!user) return null
    return (
        <>
            <Header />
            <BurgerMenu />
        </>
    )
}
