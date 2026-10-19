"use client"

import { Suspense, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "convex-helpers/react/cache"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../../../convex/_generated/api"
import { RequestCard } from "@/components/request-card"
import {
    Collection, CollectionEmpty, CollectionItem, CollectionToolbar, FilterChips, PageHeader, PageSkeleton,
    SearchField, SectionLabel, ViewToggle, matches, useViewPreference, type ChipOption,
} from "@/components/collection"

const ACTIVE = ["pending", "acknowledged", "in_progress"]

type FilterKey = "all" | "active" | "done" | "stopped"

const FILTER_MATCH: Record<FilterKey, (status: string) => boolean> = {
    all: () => true,
    active: (s) => ACTIVE.includes(s),
    done: (s) => s === "completed" || s === "rated",
    stopped: (s) => s === "cancelled" || s === "rejected" || s === "failed",
}

function RequestsList() {
    const { user } = useAuth()
    // Links can open a filter directly (e.g. ?filter=done from the profile); chips override it
    const searchParams = useSearchParams()
    const urlFilter = searchParams.get("filter")
    const [filterChoice, setFilter] = useState<FilterKey | null>(null)
    const filter: FilterKey = filterChoice ?? (urlFilter && urlFilter in FILTER_MATCH ? (urlFilter as FilterKey) : "all")
    const [query, setQuery] = useState("")
    const [view, setView] = useViewPreference("campnav:requests-view")
    const requests = useQuery(api.requests.listForUser, user ? { userId: user._id } : "skip")

    const list = useMemo(() => requests ?? [], [requests])
    const visible = useMemo(
        () => list
            .filter((r: any) => FILTER_MATCH[filter](r.status))
            .filter((r: any) => matches(query, r.type?.replace(/_/g, " "), r.description, r.roomNumber))
            .sort((a: any, b: any) => Number(ACTIVE.includes(b.status)) - Number(ACTIVE.includes(a.status)) || b.createdAt - a.createdAt),
        [list, filter, query],
    )

    if (requests === undefined) return <PageSkeleton view={view} />

    const count = (k: FilterKey) => list.filter((r: any) => FILTER_MATCH[k](r.status)).length
    const chips: ChipOption<FilterKey>[] = [
        { key: "all", label: "All", count: list.length },
        { key: "active", label: "In progress", count: count("active"), dot: "bg-primary" },
        { key: "done", label: "Done", count: count("done"), dot: "bg-emerald-500" },
        ...(count("stopped") > 0 ? [{ key: "stopped" as const, label: "Cancelled", count: count("stopped"), dot: "bg-rose-500" }] : []),
    ]

    const grouped = filter === "all" && !query.trim()
    const sections = grouped
        ? [
            { title: "In progress", items: visible.filter((r: any) => ACTIVE.includes(r.status)) },
            { title: "Earlier", items: visible.filter((r: any) => !ACTIVE.includes(r.status)) },
        ].filter((s) => s.items.length > 0)
        : [{ title: "", items: visible }]

    const active = count("active")

    return (
        <div className="space-y-5 pb-10 md:space-y-6">
            <PageHeader
                art="requests"
                title="My Requests"
                subtitle={active ? `${active} being handled now. Tap one to see where it is.` : "Track every service you've asked for."}
                back={{ href: "/app/services", label: "Services" }}
            />

            {list.length > 0 && <FilterChips label="Filter requests" options={chips} value={filter} onChange={setFilter} />}

            {list.length > 0 && (
                <CollectionToolbar>
                    <SearchField value={query} onChange={setQuery} placeholder="Search your requests" />
                    <ViewToggle view={view} onChange={setView} label="Request layout" />
                </CollectionToolbar>
            )}

            {visible.length === 0 ? (
                list.length === 0 ? (
                    <CollectionEmpty art="requests" title="No requests yet" hint="Need something fixed, cleaned or washed? Ask and track it here." action={{ label: "Browse services", href: "/app/services" }} />
                ) : (
                    <CollectionEmpty art="search" title="Nothing matches" hint="Try another filter or search word." onReset={() => { setFilter("all"); setQuery("") }} />
                )
            ) : (
                sections.map((section) => (
                    <section key={section.title || "all"} className="space-y-3">
                        {section.title && sections.length > 1 && <SectionLabel title={section.title} count={section.items.length} />}
                        <Collection view={view} label={section.title || "Requests"}>
                            {section.items.map((req: any, i: number) => (
                                <CollectionItem key={req._id} index={i}>
                                    <RequestCard request={req} variant={view} />
                                </CollectionItem>
                            ))}
                        </Collection>
                    </section>
                ))
            )}
        </div>
    )
}

export default function RequestsPage() {
    return (
        <Suspense fallback={<PageSkeleton view="list" />}>
            <RequestsList />
        </Suspense>
    )
}
