"use client"

import { ReactNode } from "react"
import { useRouter } from "next/navigation"

interface RoleGuardProps {
    children: ReactNode
    allowedRoles: string[]
    currentUserRole?: string
    redirectTo?: string
}

export function RoleGuard({
    children,
    allowedRoles,
    currentUserRole,
    redirectTo = "/",
}: RoleGuardProps) {
    const router = useRouter()

    // If no role is provided or role is not allowed, redirect
    if (!currentUserRole || !allowedRoles.includes(currentUserRole)) {
        if (typeof window !== "undefined") {
            router.push(redirectTo)
        }
        return null
    }

    return <>{children}</>
}

// Helper function to check if user is a worker
export function isWorker(role?: string): boolean {
    return ["camp-staff"].includes(role || "")
}

// Helper function to check if user is camper/visitor
export function isCamperOrVisitor(role?: string): boolean {
    return ["camper", "visitor"].includes(role || "")
}

// Helper function to check if user is admin
export function isAdmin(role?: string): boolean {
    return role === "admin"
}
