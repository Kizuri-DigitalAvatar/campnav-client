"use client"

import { useState, useEffect, Suspense } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Card } from "@/components/ui/card"
import { List, Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, Megaphone } from "lucide-react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

function UpdatesPageContent() {
  const searchParams = useSearchParams()
  const announcements = useQuery(api.announcements.list, { priority: "all" }) ?? []
  const activities = useQuery(api.activities.list) ?? []

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "announcements")
  const [viewMode, setViewMode] = useState(searchParams.get("view") || "list")

  useEffect(() => {
    const tab = searchParams.get("tab")
    const view = searchParams.get("view")
    if (tab) setActiveTab(tab)
    if (view) setViewMode(view)
  }, [searchParams])

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Board</h1>
        <p className="text-xs text-muted-foreground">
          What&apos;s happening around CAMPNAV.
        </p>
      </header>

      <div className="w-full">
        <div className="grid w-full grid-cols-2 rounded-2xl bg-muted/50 p-1 mb-6">
          <button
            onClick={() => setActiveTab("announcements")}
            className={`py-2 text-sm font-medium rounded-xl transition-all ${activeTab === 'announcements' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
          >
            Announcements
          </button>
          <button
            onClick={() => setActiveTab("activities")}
            className={`py-2 text-sm font-medium rounded-xl transition-all ${activeTab === 'activities' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
          >
            Activities
          </button>
        </div>

        {activeTab === "announcements" && (
          <div className="space-y-4">
            {announcements.map((item: any) => (
              <Link key={item._id} href={`/updates/announcements/${item._id}`}>
                <Card
                  className="group overflow-hidden rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm p-4 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-l-4 border-l-primary"
                >
                  <div className="flex gap-4">
                    <div className="h-24 w-28 rounded-2xl bg-muted overflow-hidden shrink-0 shadow-inner">
                      {item.coverImageUrl ? (
                        <img src={item.coverImageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50 gap-1">
                          <Megaphone size={20} className="text-muted-foreground/30" />
                          <span className="text-[8px] text-muted-foreground font-black uppercase tracking-tighter">{item.priority}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2 py-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${item.priority === 'High' || item.priority === 'high'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-primary/10 text-primary'
                          }`}>
                          {item.priority}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground/50">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h2 className="text-base font-bold leading-tight group-hover:text-primary transition-colors">
                        {item.title}
                      </h2>
                      <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2 font-medium">
                        {item.content}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
            {announcements.length === 0 && (
              <div className="p-12 text-center text-muted-foreground italic text-xs border rounded-3xl border-dashed">
                No announcements at this time.
              </div>
            )}
          </div>
        )}

        {activeTab === "activities" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold uppercase tracking-tighter text-muted-foreground">Scheduled Events</h2>
              <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                >
                  <CalendarIcon size={14} />
                </button>
              </div>
            </div>

            {viewMode === "list" ? (
              <div className="space-y-4">
                {activities.map((activity: any) => (
                  <Link key={activity._id} href={`/updates/activities/${activity._id}`}>
                    <Card className="p-4 rounded-2xl border bg-card/90 shadow-sm overflow-hidden relative group">
                      <div className={`absolute top-0 left-0 w-1 h-full ${activity.category === 'Social' ? 'bg-blue-500' :
                        activity.category === 'Outdoor' ? 'bg-emerald-500' :
                          activity.category === 'Workshop' ? 'bg-amber-500' : 'bg-primary'
                        }`} />
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{activity.category}</p>
                          <h3 className="text-base font-bold leading-tight mt-0.5">{activity.title}</h3>
                        </div>
                      </div>
                      {activity.coverImageUrl && (
                        <div className="mb-3 overflow-hidden rounded-xl border border-border/60 bg-muted">
                          <img
                            src={activity.coverImageUrl}
                            alt={activity.title}
                            className="w-full h-36 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                          />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4 pl-2 font-medium leading-relaxed">
                        {activity.description}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 pl-2 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary/80">
                          <Clock size={12} />
                          {new Date(activity.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {activity.time}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                          <MapPin size={12} />
                          {activity.location}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
                {activities.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground italic text-xs border rounded-3xl border-dashed">
                    No activities scheduled yet.
                  </div>
                )}
              </div>
            ) : (
              <ActivitiesCalendar activities={activities} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function UpdatesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <UpdatesPageContent />
    </Suspense>
  )
}

function ActivitiesCalendar({ activities }: { activities: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Sort activities by date
  const sortedActivities = [...activities].sort((a, b) => a.date - b.date)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Simple Horizontal Day Picker */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-bold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 hover:bg-muted rounded-full text-muted-foreground">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 hover:bg-muted rounded-full text-muted-foreground">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="text-[10px] font-bold text-muted-foreground/50">{d}</span>
        ))}
      </div>

      <div className="space-y-8">
        {/* Visual rendering of timeline for the selected month/period */}
        {sortedActivities.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground italic text-xs">
            No events for this period.
          </div>
        ) : (
          sortedActivities.map((activity, idx) => {
            const date = new Date(activity.date)
            const isFirstOfDate = idx === 0 || new Date(sortedActivities[idx - 1].date).toDateString() !== date.toDateString()

            return (
              <div key={activity._id} className="relative pl-6 pb-2">
                {isFirstOfDate && (
                  <div className="absolute left-0 top-0 -translate-x-1/2 flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background z-10" />
                    <div className="h-full w-px bg-border absolute top-2.5" />
                  </div>
                )}
                {!isFirstOfDate && (
                  <div className="absolute left-0 top-0 -translate-x-1/2 h-full w-px bg-border" />
                )}

                {isFirstOfDate && (
                  <p className="text-[10px] font-bold text-primary mb-2 uppercase tracking-widest">
                    {date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
                  </p>
                )}

                <Link href={`/updates/activities/${activity._id}`}>
                  <div className="bg-muted/30 rounded-2xl p-3 border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold">{activity.title}</h4>
                      <span className="text-[10px] font-medium text-muted-foreground">{activity.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <MapPin size={10} />
                      <span>{activity.location}</span>
                    </div>
                  </div>
                </Link>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
