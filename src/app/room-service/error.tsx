"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, RefreshCw } from "lucide-react"

export default function RoomServiceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[RoomService] Error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="space-y-2">
        <h2 className="text-xl font-black uppercase italic tracking-tight">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Room Service couldn't load right now. Please try again.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
        <Link
          href="/services"
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-muted text-muted-foreground text-xs font-black uppercase tracking-widest hover:opacity-80 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
      </div>
    </div>
  )
}
