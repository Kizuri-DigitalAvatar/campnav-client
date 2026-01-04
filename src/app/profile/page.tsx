"use client"

import { Card } from "@/components/ui/card"
import { Clock3, LogOut, Settings, Star } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"

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

  const currentPoints = user.points || 0
  const nextMilestone = 2500
  const progress = (currentPoints / nextMilestone) * 100

  return (
    <div className="space-y-6 pb-4">
      {/* Avatar + basic info */}
      <section className="flex flex-col items-center gap-2 pt-4 relative">
        <div className="absolute right-0 top-0 md:hidden">
          <ModeToggle />
        </div>
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
          <p className="text-2xl font-semibold">{currentPoints.toLocaleString()} pts</p>
          <p className="text-[11px] opacity-90">{Math.max(0, nextMilestone - currentPoints)} pts to next reward</p>
          <div className="mt-3 h-2 w-full rounded-full bg-primary-foreground/20">
            <div
              className="h-2 rounded-full bg-primary-foreground transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
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
                } else if (item.id === 'orders') {
                  router.push('/history')
                } else if (item.id === 'settings') {
                  router.push('/settings')
                }
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/70 group relative"
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              <span className="text-xs text-muted-foreground">&gt;</span>
              {!isLast && (
                <div className="absolute bottom-0 left-12 right-0 h-px bg-border/50" />
              )}
            </button>
          )
        })}
      </Card>
    </div>
  )
}

