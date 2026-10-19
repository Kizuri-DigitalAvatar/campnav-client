"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "../../../../convex/_generated/api"
import { List, LayoutGrid, Calendar as CalendarIcon, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { AnnouncementCard, ActivityCard } from "@/components/update-cards"
import {
  Collection, CollectionEmpty, CollectionItem, CollectionToolbar, FilterChips, PageHeader, PageSkeleton,
  SearchField, ViewToggle, matches, useViewPreference, type ChipOption, type ViewOption,
} from "@/components/collection"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

type Tab = "announcements" | "activities"
type ActivityView = "grid" | "list" | "calendar"

const ACTIVITY_VIEWS: ViewOption<ActivityView>[] = [
  { value: "grid", label: "Grid view", icon: LayoutGrid },
  { value: "list", label: "List view", icon: List },
  { value: "calendar", label: "Calendar view", icon: CalendarIcon },
]

function UpdatesPageContent() {
  const searchParams = useSearchParams()
  const announcementsData = useQuery(api.announcements.list, { priority: "all" })
  const activitiesData = useQuery(api.activities.list)
  const [query, setQuery] = useState("")
  // The URL picks the starting tab (links from Home), the chips change it after
  const [tabChoice, setTab] = useState<Tab | null>(null)
  const tab: Tab = tabChoice ?? (searchParams.get("tab") === "activities" ? "activities" : "announcements")
  const [newsView, setNewsView] = useViewPreference("campnav:announcements-view")
  const [eventView, setEventView] = useViewPreference<ActivityView>("campnav:activities-view", "auto", ["grid", "list", "calendar"])

  // "?view=calendar" from the Home calendar link opens the calendar once
  const urlView = searchParams.get("view")
  useEffect(() => {
    if (urlView === "calendar") setEventView("calendar")
  }, [urlView, setEventView])

  const announcements = useMemo(
    () => [...(announcementsData ?? [])].sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)),
    [announcementsData],
  )
  const activities = useMemo(
    () => [...(activitiesData ?? [])].sort((a: any, b: any) => a.date - b.date),
    [activitiesData],
  )

  if (announcementsData === undefined || activitiesData === undefined) return <PageSkeleton view={newsView} />

  const startOfToday = new Date().setHours(0, 0, 0, 0)
  const upcoming = activities.filter((a: any) => a.date >= startOfToday)
  const shownNews = announcements.filter((a: any) => matches(query, a.title, a.content, a.priority))
  const shownEvents = (eventView === "calendar" ? activities : upcoming)
    .filter((a: any) => matches(query, a.title, a.description, a.category, a.location))

  const chips: ChipOption<Tab>[] = [
    { key: "announcements", label: "Announcements", count: announcements.length },
    { key: "activities", label: "Activities", count: upcoming.length },
  ]

  return (
    <div className="space-y-5 pb-10 md:space-y-6">
      <PageHeader art="news" title="Updates" subtitle="What's happening around the camp." />

      <FilterChips label="Choose updates" options={chips} value={tab} onChange={(t) => { setTab(t); setQuery("") }} />

      <CollectionToolbar>
        <SearchField value={query} onChange={setQuery} placeholder={tab === "announcements" ? "Search announcements" : "Search events"} />
        {tab === "announcements" ? (
          <ViewToggle view={newsView} onChange={setNewsView} label="Announcement layout" />
        ) : (
          <ViewToggle view={eventView} onChange={setEventView} options={ACTIVITY_VIEWS} label="Event layout" />
        )}
      </CollectionToolbar>

      {tab === "announcements" ? (
        shownNews.length === 0 ? (
          announcements.length === 0
            ? <CollectionEmpty art="news" title="No announcements" hint="Camp news will show up here." />
            : <CollectionEmpty art="search" title="Nothing matches" onReset={() => setQuery("")} />
        ) : (
          <Collection view={newsView} label="Announcements">
            {shownNews.map((item: any, i: number) => (
              <CollectionItem key={item._id} index={i}>
                <AnnouncementCard item={item} variant={newsView} />
              </CollectionItem>
            ))}
          </Collection>
        )
      ) : eventView === "calendar" ? (
        <ActivitiesCalendar activities={shownEvents} />
      ) : shownEvents.length === 0 ? (
        upcoming.length === 0
          ? <CollectionEmpty art="calendar" title="No upcoming events" hint="Check back for camp activities." />
          : <CollectionEmpty art="search" title="Nothing matches" onReset={() => setQuery("")} />
      ) : (
        <Collection view={eventView} label="Upcoming events">
          {shownEvents.map((item: any, i: number) => (
            <CollectionItem key={item._id} index={i}>
              <ActivityCard item={item} variant={eventView} />
            </CollectionItem>
          ))}
        </Collection>
      )}
    </div>
  )
}

export default function UpdatesPage() {
  return (
    <Suspense fallback={<PageSkeleton view="list" />}>
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

                <Link href={`/app/updates/activities/${activity._id}`}>
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
