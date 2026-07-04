"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

const PUBLIC_PATHS = new Set(["/welcome", "/login"])

// Full-screen buffer shown while auth is being verified or a redirect is in flight.
// Nothing protected is ever rendered behind it.
function AuthBuffer() {
  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center gap-4">
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-lg shadow-primary/20">
        CN
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
      </div>
    </div>
  )
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const path = pathname || "/"
  const isPublic = PUBLIC_PATHS.has(path)

  useEffect(() => {
    if (loading) return

    if (!user && !isPublic) {
      router.replace("/welcome")
      return
    }

    if (user && isPublic) {
      router.replace("/")
    }
  }, [user, loading, isPublic, router])

  // Hold every page until auth is verified
  if (loading) return <AuthBuffer />

  // Not logged in: only public pages may render; everything else stays behind
  // the buffer while the redirect to /welcome happens
  if (!user) return isPublic ? <>{children}</> : <AuthBuffer />

  // Logged in on a public page: buffer while redirecting home
  if (isPublic) return <AuthBuffer />

  return <>{children}</>
}
