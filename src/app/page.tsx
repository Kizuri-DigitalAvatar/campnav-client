"use client"

import { useQuery } from "convex/react"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../convex/_generated/api"
import { QuickAccessGrid } from "@/components/home/quick-access-grid"
import { Clock, MapPin, Calendar, Megaphone, ClipboardList, ShoppingBag, ChevronRight, Plus } from "lucide-react"
import Link from "next/link"
import { isWorker } from "@/components/role-guard"
import { WorkerHome } from "@/components/home/worker-home"
import { RequestCard } from "@/components/request-card"
import AssignmentsPage from "./assignments/page"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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
  const userRequests = useQuery(api.requests.listForUser, user && !isWorker(user.role) ? { userId: user._id } : "skip")
  const userOrders = useQuery(api.orders.listForUser, user && !isWorker(user.role) ? { userId: user._id } : "skip")

  const isLoading = loading || 
    announcements === undefined || 
    activities === undefined || 
    (user && !isWorker(user.role) && (userRequests === undefined || userOrders === undefined))

  if (isLoading) {
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
  const recentAnnouncements = [...announcementsList]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 3)

  const activeRequestsCount = (userRequests || []).filter(
    (req: any) => req.status === "pending" || req.status === "in_progress"
  ).length
  const latestRequest = (userRequests || [])
    .sort((a: any, b: any) => b.createdAt - a.createdAt)[0]

  const pendingOrdersCount = (userOrders || []).filter(
    (order: any) => order.status === "pending" || order.status === "in_progress"
  ).length
  const latestOrder = (userOrders || [])[0]

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
      <section className="mt-2 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold tracking-tight">Announcements</h2>
          <Link href="/updates" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">View All</Link>
        </div>

        <div className="space-y-4">
          {recentAnnouncements.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
              {recentAnnouncements.map((announcement) => (
                <div
                  key={announcement._id}
                  className="group relative min-w-[240px] max-w-[320px] flex-1 overflow-hidden rounded-3xl bg-card border shadow-sm transition-all hover:shadow-md flex flex-col justify-between"
                >
                  {announcement.coverImageUrl && (
                    <div className="h-32 w-full overflow-hidden shrink-0 border-b bg-muted">
                      <img
                        src={announcement.coverImageUrl}
                        alt={announcement.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="space-y-1.5 var(--font-sans)">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${
                              announcement.priority === 'High' ? 'bg-red-500 shadow-red-500/50 shadow-[0_0_8px]' :
                              announcement.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {announcement.priority} PRIORITY
                            </p>
                          </div>
                          <h3 className="text-base font-semibold leading-snug group-hover:text-primary transition-colors pr-8 line-clamp-2">
                            {announcement.title}
                          </h3>
                        </div>
                        <div className="shrink-0 p-2 bg-muted/50 rounded-full">
                          <Megaphone size={16} className="text-foreground/70" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {new Date(announcement.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                      <Link href={`/updates/announcements/${announcement._id}`} className="text-[11px] font-semibold text-primary flex items-center gap-1 hover:underline">
                        Read details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground italic text-sm border rounded-3xl bg-muted/20 border-dashed">
              No active announcements at this time.
            </div>
          )}
        </div>
      </section>

      {/* Activity & Orders Hub */}
      {user && !isWorker(user.role) && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold tracking-tight">Your Activity & Orders Hub</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Service Requests Card */}
            <Card className="p-5 rounded-3xl border bg-card/90 hover:shadow-md transition-all flex flex-col justify-between min-h-[220px]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Service Requests</h3>
                      <p className="text-[10px] text-muted-foreground">
                        {activeRequestsCount} Active • {userRequests?.length || 0} Total
                      </p>
                    </div>
                  </div>
                  <Link href="/requests" className="text-xs font-semibold text-primary flex items-center gap-0.5 hover:underline">
                    View All <ChevronRight size={14} />
                  </Link>
                </div>

                {latestRequest ? (
                  <Link href={`/requests/${latestRequest._id}`} className="block group bg-muted/40 hover:bg-muted/70 p-3 rounded-2xl border border-border/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {latestRequest.imageUrl ? (
                        <div className="h-12 w-12 rounded-xl overflow-hidden border bg-background shrink-0 shadow-sm">
                          <img src={latestRequest.imageUrl} alt={latestRequest.type} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                          <ClipboardList size={18} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold capitalize truncate">{latestRequest.type}</span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                            latestRequest.status === "completed" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                            latestRequest.status === "in_progress" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                            latestRequest.status === "cancelled" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                            "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          }`}>
                            {latestRequest.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-1 italic">
                          "{latestRequest.description}"
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                    </div>
                  </Link>
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-2xl bg-muted/20">
                    No active service requests
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border/50">
                <Link href="/services" className="block w-full">
                  <Button variant="outline" className="w-full rounded-xl text-xs h-9 font-semibold flex items-center justify-center gap-1">
                    <Plus size={14} />
                    New Request
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Recent Orders Card */}
            <Card className="p-5 rounded-3xl border bg-card/90 hover:shadow-md transition-all flex flex-col justify-between min-h-[220px]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Recent Orders</h3>
                      <p className="text-[10px] text-muted-foreground">
                        {pendingOrdersCount} Processing • {userOrders?.length || 0} Total
                      </p>
                    </div>
                  </div>
                  <Link href="/history" className="text-xs font-semibold text-primary flex items-center gap-0.5 hover:underline">
                    View All <ChevronRight size={14} />
                  </Link>
                </div>

                {latestOrder ? (
                  <Link href="/history" className="block group bg-muted/40 hover:bg-muted/70 p-3 rounded-2xl border border-border/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {latestOrder.productImage ? (
                        <div className="h-12 w-12 rounded-xl overflow-hidden border bg-background shrink-0 shadow-sm">
                          <img src={latestOrder.productImage} alt={latestOrder.summary} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                          <ShoppingBag size={18} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold capitalize truncate">{latestOrder.source.replace("_", " ")}</span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                            latestOrder.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            latestOrder.status === 'failed' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                            latestOrder.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                            'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {latestOrder.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-1">
                          {latestOrder.quantity ? `${latestOrder.quantity}x ` : ""}{latestOrder.summary}
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-1">
                        <span className="text-xs font-bold">Le {latestOrder.total.toFixed(2)}</span>
                        <ChevronRight size={16} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-2xl bg-muted/20">
                    No recent orders
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border/50">
                <Link href="/shop" className="block w-full">
                  <Button variant="outline" className="w-full rounded-xl text-xs h-9 font-semibold flex items-center justify-center gap-1">
                    <ShoppingBag size={14} />
                    Go to Shop
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </section>
      )}

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
              <Link
                key={event._id}
                href={`/updates/activities/${event._id}`}
                className="min-w-[180px] flex-1 rounded-2xl border bg-card overflow-hidden shadow-sm hover:border-primary/50 transition-colors flex flex-col"
              >
                {event.coverImageUrl ? (
                  <div className="h-20 w-full overflow-hidden shrink-0 bg-muted border-b border-border/55">
                    <img src={event.coverImageUrl} alt={event.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-20 w-full bg-primary/5 text-primary flex items-center justify-center shrink-0 border-b border-border/55">
                    <Calendar size={20} className="text-primary/30" />
                  </div>
                )}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-primary uppercase tracking-wider">
                      {formatDay(event.date)}
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-tight line-clamp-1">
                      {event.title}
                    </p>
                  </div>
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
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
