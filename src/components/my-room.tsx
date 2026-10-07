"use client"

import { useEffect, useRef } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { AlertTriangle, BedDouble } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { api } from "../../convex/_generated/api"

// The signed-in user's room, as assigned by admins. Read live from the database
// because the cached login profile won't know about rooms set after login.
export function useMyRoom() {
  const { user, setUser } = useAuth()
  const room = useQuery(api.users.getMyRoom, user ? { userId: user._id } : "skip")
  const reportMissingRoom = useMutation(api.users.reportMissingRoom)
  const reportedRef = useRef(false)

  const loading = !!user && room === undefined
  const roomNumber = room?.roomNumber ?? ""

  // Keep the cached profile in step so other screens show the right room
  useEffect(() => {
    if (!user || room === undefined || room === null) return
    const latest = room.roomNumber ?? undefined
    if (user.roomNumber !== latest) setUser({ ...user, roomNumber: latest })
  }, [user, room, setUser])

  // Let admins know this person can't make requests (server rate-limits to once a day)
  useEffect(() => {
    if (!user || loading || roomNumber || reportedRef.current) return
    reportedRef.current = true
    reportMissingRoom({ userId: user._id }).catch(console.error)
  }, [user, loading, roomNumber, reportMissingRoom])

  return { roomNumber, loading, hasRoom: !!roomNumber }
}

// Read-only room display for request forms
export function RoomField({ label = "Your Room" }: { label?: string }) {
  const { roomNumber, loading } = useMyRoom()

  return (
    <div className="space-y-1 text-xs">
      <p className="block text-[11px] font-medium text-muted-foreground">{label}</p>
      {loading ? (
        <div className="h-10 rounded-xl bg-muted animate-pulse" />
      ) : roomNumber ? (
        <div className="flex h-10 items-center gap-2 rounded-xl border bg-muted/40 px-3 text-sm font-semibold">
          <BedDouble className="h-4 w-4 text-primary" />
          Room {roomNumber}
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p>
            No room has been assigned to you yet. The camp admin has been notified, and you can
            make requests as soon as they set your room.
          </p>
        </div>
      )}
    </div>
  )
}
