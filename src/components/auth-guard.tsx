"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

import { isWorker } from "@/components/role-guard"

const PUBLIC_PATHS = new Set(["/welcome", "/login"])
const WORKER_ALLOWED_PATHS = new Set(["/", "/profile", "/updates", "/assignments", "/history", "/requests"])

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    const path = pathname || "/"

    if (!user && !PUBLIC_PATHS.has(path)) {
      router.replace("/welcome")
      return
    }

    if (user) {
      if (PUBLIC_PATHS.has(path)) {
        router.replace("/")
        return
      }

      // Role-based restrictions for workers
      if (isWorker(user.role)) {
        // Find if the path starts with any allowed path prefix or matches exactly
        const isAllowed = Array.from(WORKER_ALLOWED_PATHS).some(p =>
          path === p || (p !== "/" && path.startsWith(p))
        )

        if (!isAllowed) {
          router.replace("/")
        }
      }
    }
  }, [user, loading, pathname, router])

  return <>{children}</>
}
