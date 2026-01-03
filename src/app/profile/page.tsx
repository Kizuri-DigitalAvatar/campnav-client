"use client"

import { Card } from "@/components/ui/card"
import { Clock3, LogOut, Settings, Star } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

const MENU_ITEMS = [
  {
    id: "orders",
    label: "Order History",
    icon: Clock3,
  },
  {
    id: "reviews",
    label: "My Review",
    icon: Star,
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
  },
  {
    id: "logout",
    label: "Logout",
    icon: LogOut,
  },
]

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  if (!user) {
    return (
      <div className="p-12 text-center text-muted-foreground italic text-xs">
        Please log in to view your profile.
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Avatar + basic info */}
      <section className="flex flex-col items-center gap-2 pt-4">
        <div className="h-20 w-20 rounded-full bg-muted overflow-hidden">
          {user.image ? (
            <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
              {user.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-base font-semibold">{user.name}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{user.email}</p>
          <p className="text-[10px] text-muted-foreground font-mono mt-1 opacity-50">{user._id}</p>
        </div>
      </section>

      {/* Rewards card */}
      <Card className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 shadow-sm">
        <div className="relative z-10 space-y-1">
          <p className="text-xs uppercase tracking-wide opacity-90">
            Camp Rewards
          </p>
          <p className="text-2xl font-semibold">2,450 pts</p>
          <p className="text-[11px] opacity-90">50 pts to next reward</p>
          <div className="mt-3 h-2 w-full rounded-full bg-primary-foreground/20">
            <div className="h-2 w-1/2 rounded-full bg-primary-foreground" />
          </div>
        </div>
        <div className="pointer-events-none absolute -right-6 top-4 h-16 w-16 rounded-full bg-primary-foreground/20 blur-xl" />
      </Card>

      {/* Menu list */}
      <Card className="overflow-hidden rounded-2xl border bg-card/90 p-0 text-sm">
        {MENU_ITEMS.map((item, index) => {
          const Icon = item.icon
          const isLast = index === MENU_ITEMS.length - 1

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'logout') {
                  logout()
                  router.push('/welcome')
                }
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/70"
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              <span className="text-xs text-muted-foreground">&gt;</span>
              {!isLast && (
                <span className="pointer-events-none absolute inset-x-4 h-px translate-y-5 bg-border/80" />
              )}
            </button>
          )
        })}
      </Card>
    </div>
  )
}

