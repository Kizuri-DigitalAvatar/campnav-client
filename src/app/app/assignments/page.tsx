"use client"

import { useMemo, useState } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { useAuth } from "@/components/auth-provider"
import { TaskCard } from "@/components/task-card"
import { MultimediaUpload } from "@/components/multimedia-upload"
import {
    Collection, CollectionEmpty, CollectionItem, CollectionToolbar, FilterChips, PageHeader, PageSkeleton,
    SearchField, SectionLabel, ViewToggle, matches, useViewPreference, type ChipOption,
} from "@/components/collection"

const ACTIVE = ["pending", "acknowledged", "in_progress"]
const FINISHED = ["completed", "rated", "cancelled"]

type FilterKey = "all" | "pending" | "acknowledged" | "in_progress" | "done"

const FILTER_MATCH: Record<FilterKey, (status: string) => boolean> = {
    all: () => true,
    pending: (s) => s === "pending",
    acknowledged: (s) => s === "acknowledged",
    in_progress: (s) => s === "in_progress",
    done: (s) => FINISHED.includes(s),
}

// Work that needs the worker first, then newest
function byUrgency(a: any, b: any) {
    const rank = (s: string) => (s === "in_progress" ? 0 : s === "acknowledged" ? 1 : s === "pending" ? 2 : 3)
    return rank(a.status) - rank(b.status) || (b.assignedAt || 0) - (a.assignedAt || 0)
}

export default function AssignmentsPage() {
    const { user, loading } = useAuth()
    const [filter, setFilter] = useState<FilterKey>("all")
    const [query, setQuery] = useState("")
    const [view, setView] = useViewPreference("campnav:assignments-view")
    const [updatingId, setUpdatingId] = useState<Id<"tasks"> | null>(null)

    const assignments = useQuery(api.tasks.getWorkerAssignments, user ? { workerId: user._id } : "skip")
    const acknowledgeAssignment = useMutation(api.tasks.acknowledgeAssignment)
    const startAssignment = useMutation(api.tasks.startAssignment)
    const completeAssignment = useMutation(api.tasks.completeTask)

    const list = useMemo(() => assignments ?? [], [assignments])
    const visible = useMemo(
        () => list
            .filter((a: any) => FILTER_MATCH[filter](a.status))
            .filter((a: any) => matches(query, a.roomNumber, a.serviceType?.replace(/_/g, " "), a.requestDetails?.description))
            .sort(byUrgency),
        [list, filter, query],
    )

    if (loading || assignments === undefined) return <PageSkeleton view={view} />

    const count = (k: FilterKey) => list.filter((a: any) => FILTER_MATCH[k](a.status)).length
    const chips: ChipOption<FilterKey>[] = [
        { key: "all", label: "All", count: list.length },
        { key: "pending", label: "To accept", count: count("pending"), dot: "bg-amber-500" },
        { key: "acknowledged", label: "Accepted", count: count("acknowledged"), dot: "bg-sky-500" },
        { key: "in_progress", label: "Working", count: count("in_progress"), dot: "bg-primary" },
        { key: "done", label: "Done", count: count("done"), dot: "bg-emerald-500" },
    ]

    const handlers = {
        onAcknowledge: (id: Id<"tasks">) => acknowledgeAssignment({ id, staffId: user?._id }),
        onStart: (id: Id<"tasks">) => startAssignment({ id }),
        onAddUpdate: (id: Id<"tasks">) => setUpdatingId(id),
        onComplete: (id: Id<"tasks">) => completeAssignment({ id }),
    }

    // With no filter, split into what still needs the worker and what's finished
    const grouped = filter === "all" && !query.trim()
    const sections = grouped
        ? [
            { title: "Needs you", hint: "Tap a task to see everything about it", items: visible.filter((a: any) => ACTIVE.includes(a.status)) },
            { title: "Finished", items: visible.filter((a: any) => !ACTIVE.includes(a.status)) },
        ].filter((s) => s.items.length > 0)
        : [{ title: "", items: visible }]

    const needYou = count("pending") + count("acknowledged") + count("in_progress")

    return (
        <div className="space-y-5 pb-10 md:space-y-6">
            <PageHeader
                art="tasks"
                title="My Tasks"
                subtitle={needYou === 0 ? "You're all caught up." : `${needYou} task${needYou === 1 ? " needs" : "s need"} you · ${count("in_progress")} in progress`}
            />

            <FilterChips label="Filter tasks by status" options={chips} value={filter} onChange={setFilter} />

            <CollectionToolbar>
                <SearchField value={query} onChange={setQuery} placeholder="Search room, service or request" />
                <ViewToggle view={view} onChange={setView} label="Task layout" />
            </CollectionToolbar>

            {visible.length === 0 ? (
                list.length === 0 ? (
                    <CollectionEmpty art="tasks" title="No assignments yet" hint="New tasks appear here the moment they're assigned to you." action={{ label: "See available tasks", href: "/app/available-tasks" }} />
                ) : (
                    <CollectionEmpty art="search" title="Nothing matches" hint="Try another filter or search word." onReset={() => { setFilter("all"); setQuery("") }} />
                )
            ) : (
                sections.map((section) => (
                    <section key={section.title || "all"} className="space-y-3">
                        {section.title && sections.length > 1 && <SectionLabel title={section.title} count={section.items.length} hint={section.hint} />}
                        <Collection view={view} label={section.title || "Tasks"}>
                            {section.items.map((assignment: any, i: number) => (
                                <CollectionItem key={assignment._id} index={i}>
                                    <TaskCard assignment={assignment} variant={view} {...handlers} />
                                </CollectionItem>
                            ))}
                        </Collection>
                    </section>
                ))
            )}

            {updatingId && (
                <MultimediaUpload
                    assignmentId={updatingId}
                    onComplete={() => setUpdatingId(null)}
                    onCancel={() => setUpdatingId(null)}
                />
            )}
        </div>
    )
}
