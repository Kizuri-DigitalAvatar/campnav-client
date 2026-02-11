"use client"

import { useQuery } from "convex/react"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../convex/_generated/api"
import { WeatherWidget } from "@/components/home/weather-widget"
import { QuickAccessGrid } from "@/components/home/quick-access-grid"
import { Clock, MapPin, Calendar, Megaphone } from "lucide-react"
import Link from "next/link"
import { isWorker } from "@/components/role-guard"
import { WorkerHome } from "@/components/home/worker-home"
import AssignmentsPage from "./assignments/page"

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

import { Skeleton } from "@/components/ui/skeleton"

export default function Home() {
  const { user, loading } = useAuth()
  const announcements = useQuery(api.announcements.list, { priority: "all" })
  const activities = useQuery(api.activities.list)

  if (loading || announcements === undefined || activities === undefined) {
    return (
      <div className="space-y-6 pb-4">
        <header className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full" />
        </header>

        <Skeleton className="h-24 w-full rounded-2xl" />

        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-32 px-1" />
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      </div>
    )
  }

  const announcementsList = announcements || []
  const activitiesList = activities || []
  const latestAnnouncement = announcementsList[0]

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

  // If user is a worker, show the worker home dashboard
  if (user && isWorker(user.role)) {
    return <WorkerHome user={user} />
  }

  return (
    <div className="space-y-6 pb-4">
      {/* ... previous content ... */}
      {/* Quick Access removed as per request */}


      {/* Announcements */}
      <section className="mt-4 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold tracking-tight">Announcements</h2>
          <Link href="/updates" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">View All</Link>
        </div>

        <div className="space-y-4">
          {announcements.length > 0 ? (
            announcements.slice(0, 3).map((announcement) => (
              <div key={announcement._id} className="group relative overflow-hidden rounded-3xl bg-card border shadow-sm transition-all hover:shadow-md">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1.5 var(--font-sans)">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${announcement.priority === 'High' ? 'bg-red-500 shadow-red-500/50 shadow-[0_0_8px]' :
                          announcement.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {announcement.priority} PRIORITY
                        </p>
                      </div>
                      <h3 className="text-base font-semibold leading-snug group-hover:text-primary transition-colors pr-8">
                        {announcement.title}
                      </h3>
                    </div>
                    <div className="shrink-0 p-2 bg-muted/50 rounded-full">
                      <Megaphone size={16} className="text-foreground/70" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/50">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {new Date(announcement.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                    <Link href={`/updates?id=${announcement._id}`} className="text-[11px] font-semibold text-primary flex items-center gap-1 hover:underline">
                      Read details
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground italic text-sm border rounded-3xl bg-muted/20 border-dashed">
              No active announcements at this time.
            </div>
          )}
        </div>
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

