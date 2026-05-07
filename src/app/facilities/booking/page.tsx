"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar as CalendarIcon, Clock, Users, Dumbbell, Target, Trophy } from "lucide-react"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../../../convex/_generated/api"

const FACILITIES = [
  { id: "gym", label: "Gym", icon: Dumbbell, color: "bg-blue-500" },
  { id: "mini_golf", label: "Mini Golf", icon: Target, color: "bg-emerald-500" },
  { id: "tennis", label: "Tennis Court", icon: Trophy, color: "bg-amber-500" },
]

export default function FacilityBookingPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [facility, setFacility] = useState("gym")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [participants, setParticipants] = useState(1)
  const [specialRequests, setSpecialRequests] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bookFacility = useMutation(api.facilities.bookFacility)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !date || !startTime || !endTime) return
    
    setIsSubmitting(true)
    try {
      await bookFacility({
        facility,
        date: new Date(date).getTime(),
        startTime,
        endTime,
        numberOfParticipants: participants,
        specialRequests: specialRequests.trim(),
        userId: user._id,
      })

      alert("Booking request submitted! We will confirm your slot shortly.")
      router.push("/services")
    } catch (err) {
      console.error(err)
      alert("Failed to book facility. Please try again.")
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
          <span>Facility Booking</span>
        </div>
        <h1 className="text-xl font-semibold">Book a Facility</h1>
        <p className="text-xs text-muted-foreground">
          Reserve your spot at our recreational facilities.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-4 space-y-6 rounded-2xl border bg-card/90 shadow-sm">
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground">Select Facility</p>
            <div className="grid grid-cols-3 gap-2">
              {FACILITIES.map((f) => {
                const selected = facility === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFacility(f.id)}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border py-4 transition-all ${
                      selected 
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-sm" 
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <f.icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{f.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-4">
             <div className="space-y-1 text-xs">
              <label className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground ml-1">
                <CalendarIcon className="h-3 w-3" />
                Date
              </label>
              <Input
                type="date"
                className="h-11 rounded-xl"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 text-xs">
                <label className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground ml-1">
                  <Clock className="h-3 w-3" />
                  Start Time
                </label>
                <Input
                  type="time"
                  className="h-11 rounded-xl"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1 text-xs">
                <label className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground ml-1">
                  <Clock className="h-3 w-3" />
                  End Time
                </label>
                <Input
                  type="time"
                  className="h-11 rounded-xl"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground ml-1">
                <Users className="h-3 w-3" />
                Number of Participants
              </label>
              <Input
                type="number"
                min={1}
                max={10}
                className="h-11 rounded-xl"
                value={participants}
                onChange={(e) => setParticipants(parseInt(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="block text-[11px] font-medium text-muted-foreground ml-1">
                Special Requests
              </label>
              <textarea
                rows={3}
                className="w-full rounded-xl border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                placeholder="e.g. Need extra rackets, specific equipment..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <button
          type="submit"
          disabled={isSubmitting || !user}
          className="flex w-full items-center justify-center rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-[0.98] transition-all uppercase tracking-widest"
        >
          {isSubmitting ? "BOOKING..." : "CONFIRM BOOKING"}
        </button>
      </form>
    </div>
  )
}
