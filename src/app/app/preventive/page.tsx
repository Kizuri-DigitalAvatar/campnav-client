"use client"

import { useMemo, useState } from "react"
import { useQuery } from "convex-helpers/react/cache"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../../../convex/_generated/api"
import { PreventiveCard, dueState, type DueKey } from "@/components/preventive-card"
import {
  Collection, CollectionEmpty, CollectionItem, CollectionToolbar, FilterChips, PageHeader, PageSkeleton,
  SearchField, ViewToggle, matches, useViewPreference, type ChipOption,
} from "@/components/collection"

type FilterKey = "all" | DueKey

export default function PreventiveMaintenancePage() {
  const { user } = useAuth()
  const items = useQuery(api.preventive.listForStaff, user ? { staffId: user._id } : "skip")
  const [filter, setFilter] = useState<FilterKey>("all")
  const [query, setQuery] = useState("")
  const [view, setView] = useViewPreference("campnav:preventive-view")
  // Captured once per load so due states don't shift while rendering
  const [now] = useState(() => Date.now())

  const list = useMemo(() => items ?? [], [items])
  const visible = list
    .filter((i: any) => filter === "all" || dueState(i.nextDue, now).key === filter)
    .filter((i: any) => matches(query, i.title, i.type?.replaceAll("_", " "), i.frequency))

  if (items === undefined) return <PageSkeleton view={view} />

  const count = (k: DueKey) => list.filter((i: any) => dueState(i.nextDue, now).key === k).length
  const chips: ChipOption<FilterKey>[] = [
    { key: "all", label: "All", count: list.length },
    { key: "overdue", label: "Overdue", count: count("overdue"), dot: "bg-rose-500" },
    { key: "soon", label: "Due soon", count: count("soon"), dot: "bg-amber-500" },
    { key: "upcoming", label: "Upcoming", count: count("upcoming"), dot: "bg-muted-foreground" },
  ]

  return (
    <div className="space-y-5 pb-10 md:space-y-6">
      <PageHeader
        art="maintenance"
        title="Preventive Maintenance"
        subtitle={count("overdue") ? `${count("overdue")} overdue · tap a job to work through its checklist` : "Recurring jobs assigned to you, soonest first."}
        back={{ href: "/app", label: "Home" }}
      />

      {list.length > 0 && (
        <>
          <FilterChips label="Filter jobs" options={chips} value={filter} onChange={setFilter} />
          <CollectionToolbar>
            <SearchField value={query} onChange={setQuery} placeholder="Search jobs" />
            <ViewToggle view={view} onChange={setView} label="Job layout" />
          </CollectionToolbar>
        </>
      )}

      {visible.length === 0 ? (
        list.length === 0 ? (
          <CollectionEmpty art="calendar" title="Nothing assigned to you" hint="Recurring jobs the admin gives you will show up here." />
        ) : (
          <CollectionEmpty art="search" title="Nothing matches" onReset={() => { setFilter("all"); setQuery("") }} />
        )
      ) : (
        <Collection view={view} label="Preventive jobs">
          {visible.map((item: any, i: number) => (
            <CollectionItem key={item._id} index={i}>
              <PreventiveCard item={item} variant={view} now={now} />
            </CollectionItem>
          ))}
        </Collection>
      )}
    </div>
  )
}
