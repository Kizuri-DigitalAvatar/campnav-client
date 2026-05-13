import { Utensils, BedDouble, Wrench, Newspaper } from "lucide-react"
import { Card } from "@/components/ui/card"
import Link from "next/link"

const items = [
  {
    icon: Utensils,
    label: "Food",
    href: "/room-service",
  },
  {
    icon: BedDouble,
    label: "Room Service",
    href: "/room-service",
  },
  {
    icon: Wrench,
    label: "Maintenance",
    href: "/maintenance",
  },
  {
    icon: Newspaper,
    label: "News",
    href: "/updates",
  },
]

export function QuickAccessGrid() {
  return (
    <section className="mt-6 space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-semibold">Quickly Access</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <Link href={item.href} key={item.label} className="block">
            <Card className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card/80 py-4 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
