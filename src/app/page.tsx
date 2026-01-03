"use client"

import { useQuery } from "convex/react"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../convex/_generated/api"
import { WeatherWidget } from "@/components/home/weather-widget"
import { QuickAccessGrid } from "@/components/home/quick-access-grid"
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
  const latestAnnouncement = announcements[0]

  return (
    <div className="space-y-6 pb-4">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full bg-primary/10 ring-2 ring-primary/20">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary/5 text-primary text-xl font-bold">
                {user?.name?.charAt(0) || "C"}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Hi, welcome back !</span>
            <span className="text-base font-semibold leading-tight">{user?.name || "Visitor"}</span>
          </div>
        </div>
      </div>

      <WeatherWidget />

      <QuickAccessGrid />

      {/* Announcements */}
      <section className="mt-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-semibold">Announcements</h2>
          <Link href="/updates" className="text-xs font-medium text-primary">More..</Link>
        </div>
        {latestAnnouncement ? (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4">
            <div className="relative z-10 space-y-1">
              <p className="text-xs uppercase tracking-wide opacity-80">{latestAnnouncement.priority}</p>
              <h3 className="text-sm font-semibold leading-snug">
                {latestAnnouncement.title}
              </h3>
              <p className="text-[11px] opacity-90">{new Date(latestAnnouncement.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="pointer-events-none absolute -right-6 top-2 h-16 w-16 rounded-full bg-primary-foreground/15 blur-xl" />
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground italic text-xs border rounded-2xl bg-card">
            No active announcements.
          </div>
        )}
      </section>

      {/* This week schedule */}
      <section className="mt-2 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-semibold">This week</h2>
          <button className="text-xs font-medium text-primary">View Calendar</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {WEEK_EVENTS.map((event) => (
            <div
              key={event.title + event.time}
              className="min-w-[120px] flex-1 rounded-2xl border bg-card px-3 py-3 text-xs shadow-sm"
            >
              <p className="text-[11px] font-medium text-muted-foreground">
                {event.dayLabel}
              </p>
              <p className="mt-1 text-sm font-semibold leading-snug">
                {event.title}
              </p>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                <span>{event.time}</span>
                {event.location && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                    <span>{event.location}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

