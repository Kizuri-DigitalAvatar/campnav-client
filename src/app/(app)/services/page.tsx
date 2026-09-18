"use client"

import Link from "next/link"
import { BedDouble, Brush, Shirt, ShoppingBag, Wrench, ClipboardList, ArrowRight, ShieldAlert, Calendar, ChefHat, Plane } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"
import { redirect } from "next/navigation"

import { Card } from "@/components/ui/card"

const SERVICES = [
  {
    label: "Room Service",
    href: "/room-service",
    icon: BedDouble,
  },
  {
    label: "House Keeping",
    href: "/house-keeping",
    icon: Brush,
  },
  {
    label: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
  },
  {
    label: "Shop",
    href: "/shop",
    icon: ShoppingBag,
  },
  {
    label: "Laundry",
    href: "/laundry",
    icon: Shirt,
  },
  {
    label: "Meals",
    href: "/meals",
    icon: ChefHat,
  },
  {
    label: "RnR / Leave",
    href: "/rnr",
    icon: Plane,
  },
  {
    label: "HSE Report",
    href: "/hse/report",
    icon: ShieldAlert,
  },
  {
    label: "Facility Booking",
    href: "/facilities/booking",
    icon: Calendar,
  },
]

import { Skeleton } from "@/components/ui/skeleton"

export default function ServicesPage() {
  const { user, loading } = useAuth()

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
    redirect("/assignments")
  }
  return (
    <div className="space-y-6 pb-4">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground">Home / Services</p>
        <h1 className="text-xl font-semibold">Services</h1>
      </header>

      <Link href="/requests" className="block">
        <Card className="relative overflow-hidden rounded-2xl border bg-primary/5 p-4 shadow-sm group hover:bg-primary/10 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <ClipboardList className="h-5 w-5" />
              </div>
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

      <div className="grid grid-cols-2 gap-4">
        {SERVICES.map((service) => (
          <Link key={service.label} href={service.href} className="block">
            <Card className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card/80 py-5 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <service.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-foreground">
                {service.label}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
