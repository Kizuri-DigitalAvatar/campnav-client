"use client"

import { useQuery } from "convex/react"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../convex/_generated/api"
import { WeatherWidget } from "@/components/home/weather-widget"
import { QuickAccessGrid } from "@/components/home/quick-access-grid"
import { Clock, MapPin, Calendar, Megaphone } from "lucide-react"
import Link from "next/link"

const WEEK_EVENTS = [
  {
    title: "Safety Briefing",
    dayLabel: "Today",
    time: "14:00",
    location: "Hall A",
  },
  {
    title: "BBQ",
    dayLabel: "Tomorrow",
    time: "19:00",
    location: "Mess Hall",
  },
  {
    title: "Campfire Night",
    dayLabel: "Fri",
    time: "21:00",
    location: "Fire Pit",
  },
]

export default function Home() {
  const { user } = useAuth()
  const announcements = useQuery(api.announcements.list, { priority: "all" }) ?? []
  const activities = useQuery(api.activities.list) ?? []
  const latestAnnouncement = announcements[0]

  const formatDay = (timestamp: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const date = new Date(timestamp)
    const today = new Date()

    if (date.toDateString() === today.toDateString()) return 'Today'

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'

    return days[date.getDay()]
  }

  return (
    <div className="space-y-6 pb-4">
      {/* ... previous content ... */}
      <WeatherWidget />

      <QuickAccessGrid />

      {/* Announcements */}
      <section className="mt-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-semibold">Announcements</h2>
          <Link href="/updates" className="text-xs font-medium text-primary">More..</Link>
        </div>
        {latestAnnouncement ? (
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/90 p-px shadow-lg shadow-primary/20">
            <div className="relative z-10 block rounded-[23px] bg-gradient-to-br from-white/10 to-transparent p-5 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${latestAnnouncement.priority === 'High' ? 'bg-red-400' : 'bg-emerald-400'
                      }`} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                      {latestAnnouncement.priority} • NOTICE
                    </p>
                  </div>
                  <h3 className="text-lg font-bold leading-tight text-white group-hover:text-white/90 transition-colors">
                    {latestAnnouncement.title}
                  </h3>
                </div>
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
                  <Megaphone size={18} className="text-white" />
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <p className="text-[11px] font-medium text-white/50">
                  {new Date(latestAnnouncement.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <Link href="/updates" className="text-[10px] font-bold py-1 px-3 bg-white text-primary rounded-full hover:bg-white/90 transition-all">
                  View More
                </Link>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-primary-foreground/5 blur-3xl" />
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground italic text-xs border rounded-3xl bg-card/50 border-dashed">
            No active announcements.
          </div>
        )}
      </section>

      {/* This week schedule */}
      <section className="mt-2 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-semibold">This week</h2>
          <Link href="/updates?tab=activities&view=calendar" className="text-xs font-medium text-primary">View Calendar</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {activities.length === 0 ? (
            <div className="w-full p-6 text-center text-muted-foreground italic text-[10px] border rounded-2xl bg-muted/20">
              No scheduled activities this week.
            </div>
          ) : (
            activities.map((event: any) => (
              <div
                key={event._id}
                className="min-w-[140px] flex-1 rounded-2xl border bg-card px-3 py-3 text-xs shadow-sm hover:border-primary/50 transition-colors"
              >
                <p className="text-[10px] font-bold text-primary/70 uppercase tracking-tighter">
                  {formatDay(event.date)}
                </p>
                <p className="mt-1 text-sm font-semibold leading-tight line-clamp-1">
                  {event.title}
                </p>
                <div className="mt-2 flex flex-col gap-0.5 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock size={10} className="text-primary/40" />
                    <span>{event.time}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1 truncate">
                      <MapPin size={10} className="text-primary/40" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

