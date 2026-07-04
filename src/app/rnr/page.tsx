"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CalendarClock, Plane } from "lucide-react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../../convex/_generated/api"

export default function RnRPage() {
  const { user } = useAuth()
  const requests = useQuery(api.rnrRequests.getRequestsByUser, user ? { userId: user._id } : "skip")
  const createRnrRequest = useMutation(api.rnrRequests.createRnrRequest)

  const [type, setType] = useState("leave")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [bookingReference, setBookingReference] = useState("")
  const [departure, setDeparture] = useState("")
  const [arrival, setArrival] = useState("")
  const [airline, setAirline] = useState("")
  const [confirmationCode, setConfirmationCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user || !startDate || !endDate || !reason.trim()) return

    setIsSubmitting(true)
    try {
      await createRnrRequest({
        userId: user._id,
        type,
        startDate: new Date(startDate).getTime(),
        endDate: new Date(endDate).getTime(),
        reason: reason.trim(),
        flightDetails: type === "flight" ? {
          bookingReference,
          departure,
          arrival,
          airline,
          confirmationCode,
        } : undefined,
      })
      setReason("")
      setBookingReference("")
    } catch (error) {
      console.error(error)
      alert("Failed to submit RnR request.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-6 md:max-w-xl md:mx-auto">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/services" className="inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            <span>Services</span>
          </Link>
          <span>/</span>
          <span>RnR</span>
        </div>
        <h1 className="text-xl font-semibold">RnR / Leave</h1>
        <p className="text-xs text-muted-foreground">Submit leave or flight itinerary details for the 7-day countdown workflow.</p>
      </header>

      {requests?.some((request) => request.status === "approved" && request.startDate > Date.now() && request.startDate <= Date.now() + 7 * 24 * 60 * 60 * 1000) && (
        <Card className="rounded-2xl border-primary/20 bg-primary/10 p-4">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Upcoming RnR countdown active</p>
              <p className="text-[11px] text-muted-foreground">HoD, camp, housekeeping, and kitchen teams can use this window for prep.</p>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="space-y-4 rounded-2xl border bg-card/90 p-4 shadow-sm">
          <div className="space-y-1 text-xs">
            <label className="text-[11px] font-medium text-muted-foreground">Request type</label>
            <select className="h-10 w-full rounded-xl border bg-background px-3 text-xs" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="leave">Leave</option>
              <option value="flight">Flight booking / itinerary</option>
              <option value="accommodation">Accommodation</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
          {type === "flight" && (
            <div className="grid grid-cols-1 gap-3">
              <Input placeholder="Booking reference" value={bookingReference} onChange={(e) => setBookingReference(e.target.value)} />
              <Input placeholder="Departure" value={departure} onChange={(e) => setDeparture(e.target.value)} />
              <Input placeholder="Arrival" value={arrival} onChange={(e) => setArrival(e.target.value)} />
              <Input placeholder="Airline" value={airline} onChange={(e) => setAirline(e.target.value)} />
              <Input placeholder="Confirmation code" value={confirmationCode} onChange={(e) => setConfirmationCode(e.target.value)} />
            </div>
          )}
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[96px] w-full rounded-xl border bg-background px-3 py-2 text-xs" placeholder="Reason or itinerary notes..." required />
          <button disabled={!user || isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            <Plane className="h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Submit RnR Request"}
          </button>
        </Card>
      </form>

      <div className="space-y-2">
        {requests?.map((request) => (
          <Card key={request._id} className="rounded-2xl p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold capitalize">{request.type}</span>
              <span className="rounded-full bg-muted px-2 py-1 text-[10px] uppercase">{request.status}</span>
            </div>
            <p className="mt-1 text-muted-foreground">{new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
