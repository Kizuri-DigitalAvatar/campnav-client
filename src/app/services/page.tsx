import Link from "next/link"
import { BedDouble, Brush, Shirt, ShoppingBag, Truck, Wrench, ClipboardList, ArrowRight } from "lucide-react"

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
    label: "Delivery",
    href: "/delivery",
    icon: Truck,
  },
]

export default function ServicesPage() {
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
