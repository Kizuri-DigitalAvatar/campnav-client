"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

const PUBLIC_PATHS = new Set(["/welcome", "/login"])

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    const path = pathname || "/"

    if (!user && !PUBLIC_PATHS.has(path)) {
      router.replace("/welcome")
    }

    if (user && PUBLIC_PATHS.has(path)) {
      router.replace("/")
    }
  }, [user, loading, pathname, router])

  // While loading auth state, just render children to avoid layout shift.
  // Redirects will run in the effect above.
  return <>{children}</>
}
