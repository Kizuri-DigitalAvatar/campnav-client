"use client"

import { useMemo, useState } from "react"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "../../../../convex/_generated/api"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"
import { TaskCard } from "@/components/task-card"
import { OrderCard, needsConfirmation, orderTitle } from "@/components/order-card"
import {
    Collection, CollectionEmpty, CollectionItem, CollectionToolbar, FilterChips, PageHeader, PageSkeleton,
    SearchField, SectionLabel, ViewToggle, matches, useViewPreference, type ChipOption,
} from "@/components/collection"

export default function HistoryPage() {
    const { user, loading } = useAuth()
    if (loading || !user) return <PageSkeleton view="list" />
    return isWorker(user.role) ? <WorkHistory userId={user._id} /> : <MyOrders userId={user._id} />
}

// ── Staff: finished work ──────────────────────────────────────────────────

type WorkFilter = "all" | "completed" | "rated"

function WorkHistory({ userId }: { userId: any }) {
    const assignments = useQuery(api.tasks.getWorkerAssignments, { workerId: userId })
    const [filter, setFilter] = useState<WorkFilter>("all")
    const [query, setQuery] = useState("")
    const [view, setView] = useViewPreference("campnav:work-history-view")

    const done = useMemo(
        () => (assignments ?? [])
            .filter((a: any) => a.status === "completed" || a.status === "rated")
            .sort((a: any, b: any) => (b.completedAt || b.assignedAt) - (a.completedAt || a.assignedAt)),
        [assignments],
    )
    const visible = done
        .filter((a: any) => filter === "all" || a.status === filter)
        .filter((a: any) => matches(query, a.roomNumber, a.serviceType?.replace(/_/g, " "), a.requestDetails?.description, a.feedback))

    if (assignments === undefined) return <PageSkeleton view={view} />

    const rated = done.filter((a: any) => a.rating)
    const avg = rated.length ? (rated.reduce((s: number, a: any) => s + a.rating, 0) / rated.length).toFixed(1) : null
    const chips: ChipOption<WorkFilter>[] = [
        { key: "all", label: "All", count: done.length },
        { key: "completed", label: "Completed", count: done.filter((a: any) => a.status === "completed").length, dot: "bg-emerald-500" },
        { key: "rated", label: "Rated", count: done.filter((a: any) => a.status === "rated").length, dot: "bg-violet-500" },
    ]

    return (
        <div className="space-y-5 pb-10 md:space-y-6">
            <PageHeader
                art="tasks"
                artTone="emerald"
                title="Work History"
                subtitle={done.length ? `${done.length} task${done.length === 1 ? "" : "s"} finished${avg ? ` · ★ ${avg} average rating` : ""}` : "Tasks you finish will appear here."}
            />
            {done.length > 0 && (
                <>
                    <FilterChips label="Filter finished tasks" options={chips} value={filter} onChange={setFilter} />
                    <CollectionToolbar>
                        <SearchField value={query} onChange={setQuery} placeholder="Search room, service or feedback" />
                        <ViewToggle view={view} onChange={setView} label="History layout" />
                    </CollectionToolbar>
                </>
            )}
            {visible.length === 0 ? (
                done.length === 0 ? (
                    <CollectionEmpty art="tasks" title="No completed tasks yet" hint="Finish an assignment and it will show up here." action={{ label: "My tasks", href: "/app/assignments" }} />
                ) : (
                    <CollectionEmpty art="search" title="Nothing matches" onReset={() => { setFilter("all"); setQuery("") }} />
                )
            ) : (
                <Collection view={view} label="Finished tasks">
                    {visible.map((a: any, i: number) => (
                        <CollectionItem key={a._id} index={i}>
                            <TaskCard assignment={a} variant={view} readOnly />
                        </CollectionItem>
                    ))}
                </Collection>
            )}
        </div>
    )
}

// ── Residents: shop & room-service orders ─────────────────────────────────

type OrderFilter = "all" | "confirm" | "shop" | "room_service"

function MyOrders({ userId }: { userId: any }) {
    const orders = useQuery(api.orders.listForUser, { userId })
    const [filter, setFilter] = useState<OrderFilter>("all")
    const [query, setQuery] = useState("")
    const [view, setView] = useViewPreference("campnav:orders-view")

    const list = useMemo(() => orders ?? [], [orders])
    const visible = list
        .filter((o: any) => filter === "all" || (filter === "confirm" ? needsConfirmation(o) : o.source === filter))
        .filter((o: any) => matches(query, orderTitle(o), o.summary, o.roomNumber))

    if (orders === undefined) return <PageSkeleton view={view} />

    const toConfirm = list.filter(needsConfirmation).length
    const chips: ChipOption<OrderFilter>[] = [
        { key: "all", label: "All", count: list.length },
        ...(toConfirm ? [{ key: "confirm" as const, label: "To confirm", count: toConfirm, dot: "bg-amber-500" }] : []),
        { key: "shop", label: "Shop", count: list.filter((o: any) => o.source === "shop").length },
        { key: "room_service", label: "Room service", count: list.filter((o: any) => o.source === "room_service").length },
    ]

    const grouped = filter === "all" && !query.trim() && toConfirm > 0
    const sections = grouped
        ? [
            { title: "On the way", hint: "Tap one to confirm it arrived", items: visible.filter(needsConfirmation) },
            { title: "Earlier", hint: undefined, items: visible.filter((o: any) => !needsConfirmation(o)) },
        ].filter((s) => s.items.length > 0)
        : [{ title: "", hint: undefined, items: visible }]

    return (
        <div className="space-y-5 pb-10 md:space-y-6">
            <PageHeader
                art="shop"
                title="My Orders"
                subtitle={toConfirm ? `${toConfirm} order${toConfirm === 1 ? "" : "s"} on the way` : "Your shop and room service orders."}
            />
            {list.length > 0 && (
                <>
                    <FilterChips label="Filter orders" options={chips} value={filter} onChange={setFilter} />
                    <CollectionToolbar>
                        <SearchField value={query} onChange={setQuery} placeholder="Search your orders" />
                        <ViewToggle view={view} onChange={setView} label="Order layout" />
                    </CollectionToolbar>
                </>
            )}
            {visible.length === 0 ? (
                list.length === 0 ? (
                    <CollectionEmpty art="shop" title="No orders yet" hint="Order food, drinks and essentials to your room." action={{ label: "Open the shop", href: "/app/shop" }} />
                ) : (
                    <CollectionEmpty art="search" title="Nothing matches" onReset={() => { setFilter("all"); setQuery("") }} />
                )
            ) : (
                sections.map((section) => (
                    <section key={section.title || "all"} className="space-y-3">
                        {section.title && sections.length > 1 && <SectionLabel title={section.title} count={section.items.length} hint={section.hint} />}
                        <Collection view={view} label={section.title || "Orders"}>
                            {section.items.map((o: any, i: number) => (
                                <CollectionItem key={o._id} index={i}>
                                    <OrderCard order={o} variant={view} />
                                </CollectionItem>
                            ))}
                        </Collection>
                    </section>
                ))
            )}
        </div>
    )
}
