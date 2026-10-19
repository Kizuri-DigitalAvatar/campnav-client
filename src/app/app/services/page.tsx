"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"
import { redirect } from "next/navigation"

import { Card } from "@/components/ui/card"
import { ServiceArt, useSpotlight, type ArtKind } from "@/components/visuals"

// `hint` is a few plain words under the label: what you get, not what it's called
const SERVICES: { label: string; hint: string; href: string; art: ArtKind }[] = [
  { label: "Room Service", hint: "Food to your room", href: "/app/room-service", art: "room_service" },
  { label: "House Keeping", hint: "Clean my room", href: "/app/house-keeping", art: "housekeeping" },
  { label: "Maintenance", hint: "Fix something", href: "/app/maintenance", art: "maintenance" },
  { label: "Shop", hint: "Buy items", href: "/app/shop", art: "shop" },
  { label: "Laundry", hint: "Wash my clothes", href: "/app/laundry", art: "laundry" },
  { label: "Meals", hint: "Choose my meals", href: "/app/meals", art: "meals" },
  { label: "RnR / Leave", hint: "Travel home", href: "/app/rnr", art: "rnr" },
  { label: "HSE Report", hint: "Report danger", href: "/app/hse/report", art: "hse" },
  { label: "Facility Booking", hint: "Book a place", href: "/app/facilities/booking", art: "facility" },
]

import { Skeleton } from "@/components/ui/skeleton"

export default function ServicesPage() {
  const { user, loading } = useAuth()
  const spotlight = useSpotlight(SERVICES.length, 2200)

  if (loading) {
    return (
      <div className="space-y-6 pb-4">
        <header className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </header>

        <Skeleton className="h-20 w-full rounded-2xl" />

        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (user && isWorker(user.role)) {
    redirect("/app/assignments")
  }
  return (
    <div className="space-y-6 pb-4">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground">Home / Services</p>
        <h1 className="text-xl font-semibold">Services</h1>
      </header>

      <Link href="/app/requests" className="va-trigger block">
        <Card className="relative overflow-hidden rounded-2xl border bg-primary/5 p-4 shadow-sm group hover:bg-primary/10 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ServiceArt kind="requests" size={44} />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Track Your Requests</span>
                  <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">New</span>
                </div>
                <p className="text-[11px] text-muted-foreground">View status of all active services</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </Card>
      </Link>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {SERVICES.map((service, i) => (
          <Link
            key={service.label}
            href={service.href}
            className={`va-trigger block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${spotlight === i ? "va-live" : ""}`}
          >
            <Card className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border bg-card/80 px-2 py-5 text-center shadow-sm transition-colors hover:border-primary/30">
              <ServiceArt kind={service.art} size={68} />
              <span className="mt-1 text-sm font-bold leading-tight text-foreground">
                {service.label}
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground">{service.hint}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
