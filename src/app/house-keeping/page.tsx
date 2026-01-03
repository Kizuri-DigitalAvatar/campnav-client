"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronDown } from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { useRouter } from "next/navigation"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../../convex/_generated/api"

export default function HouseKeepingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [instructions, setInstructions] = useState("")
  const [roomNumber, setRoomNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createRequest = useMutation(api.requests.create)

  async function handleSubmit() {
    if (!user || !roomNumber.trim()) return
    setIsSubmitting(true)

    try {
      await createRequest({
        userId: user._id,
        type: "housekeeping",
        roomNumber: roomNumber.trim(),
        description: instructions || "Standard housekeeping requested.",
        priority: "low",
      })
      alert("Housekeeping request submitted!")
      router.push("/requests")
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-4">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/services" className="inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            <span>Services</span>
          </Link>
          <span>/</span>
          <span>House Keeping</span>
        </div>
        <h1 className="text-xl font-semibold">House Keeping</h1>
        <p className="text-xs text-muted-foreground">
          Request professional cleaning for your cabin or room.
        </p>
      </header>

      <Card className="space-y-4 rounded-2xl border bg-card/90 p-4 shadow-sm">
        <div className="space-y-1 text-xs">
          <label className="block text-[11px] font-medium text-muted-foreground">
            House/Room Number
          </label>
          <Input
            placeholder="e.g. cabin 101"
            className="h-10 rounded-xl"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
          />
        </div>

        {/* Instructions */}
        <div className="space-y-1 text-xs">
          <p className="text-[11px] font-medium text-muted-foreground">Special Instructions</p>
          <textarea
            rows={4}
            className="min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none ring-ring/50 focus-visible:border-ring focus-visible:ring-[3px]"
            placeholder="Enter any specific areas to focus on or details..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3 text-sm">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-full border bg-background py-2 text-[12px] font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || !user || !roomNumber.trim()}
            onClick={handleSubmit}
            className="flex-1 rounded-full bg-primary py-2 text-[12px] font-semibold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50 transition-all transform active:scale-95"
          >
            {isSubmitting ? "Submitting..." : "Request Cleaning"}
          </button>
        </div>
      </Card>
    </div>
  )
}
