"use client"

import { useMemo, useState } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"
import { TaskCard } from "@/components/task-card"
import { MultimediaUpload } from "@/components/multimedia-upload"
import {
    Collection, CollectionEmpty, CollectionItem, CollectionToolbar, FilterChips, PageHeader, PageSkeleton,
    SearchField, ViewToggle, matches, useViewPreference, type ChipOption,
} from "@/components/collection"

export default function AvailableTasksPage() {
    const { user, loading } = useAuth()
    const [updatingId, setUpdatingId] = useState<Id<"tasks"> | null>(null)
    const [service, setService] = useState("all")
    const [query, setQuery] = useState("")
    const [view, setView] = useViewPreference("campnav:available-tasks-view")

    const assignments = useQuery(api.tasks.getOpenTasks, user && isWorker(user.role) ? {} : "skip")
    const acknowledgeAssignment = useMutation(api.tasks.acknowledgeAssignment)
    const startAssignment = useMutation(api.tasks.startAssignment)
    const completeAssignment = useMutation(api.tasks.completeTask)

    // Every pending request that no staff member has accepted yet.
    // Auto-assigned tasks stay claimable by anyone until someone responds.
    const available = useMemo(() => assignments ?? [], [assignments])
    const visible = useMemo(
        () => available
            .filter((t: any) => service === "all" || t.serviceType === service)
            .filter((t: any) => matches(query, t.roomNumber, t.serviceType?.replace(/_/g, " "), t.requestDetails?.description))
            .sort((a: any, b: any) => (a.requestDetails?.priority === "urgent" ? -1 : 0) - (b.requestDetails?.priority === "urgent" ? -1 : 0) || (b.assignedAt || 0) - (a.assignedAt || 0)),
        [available, service, query],
    )

    if (loading || (user && isWorker(user.role) && assignments === undefined)) return <PageSkeleton view={view} />

    if (!user || !isWorker(user.role)) {
        return (
            <div className="p-16 text-center text-muted-foreground text-sm">
                This page is only available to staff.
            </div>
        )
    }

    // One chip per service that actually has open work
    const services = [...new Set(available.map((t: any) => t.serviceType as string))].sort()
    const chips: ChipOption<string>[] = [
        { key: "all", label: "All", count: available.length },
        ...services.map((s) => ({
            key: s,
            label: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            count: available.filter((t: any) => t.serviceType === s).length,
        })),
    ]

    return (
        <div className="space-y-5 pb-10 md:space-y-6">
            <PageHeader
                art="requests"
                artTone="amber"
                title="Available Tasks"
                subtitle={available.length === 0 ? "Nothing waiting right now." : `${available.length} open · accept one to make it yours`}
            />

            {available.length > 0 && (
                <FilterChips label="Filter by service" options={chips} value={service} onChange={setService} />
            )}

            <CollectionToolbar>
                <SearchField value={query} onChange={setQuery} placeholder="Search room, service or request" />
                <ViewToggle view={view} onChange={setView} label="Task layout" />
            </CollectionToolbar>

            {visible.length === 0 ? (
                available.length === 0 ? (
                    <CollectionEmpty art="tasks" title="No open tasks right now" hint="New requests show up here as soon as residents send them." action={{ label: "My assignments", href: "/app/assignments" }} />
                ) : (
                    <CollectionEmpty art="search" title="Nothing matches" hint="Try another service or search word." onReset={() => { setService("all"); setQuery("") }} />
                )
            ) : (
                <Collection view={view} label="Open tasks">
                    {visible.map((task: any, i: number) => (
                        <CollectionItem key={task._id} index={i}>
                            <TaskCard
                                assignment={task}
                                variant={view}
                                onAcknowledge={(id) => acknowledgeAssignment({ id, staffId: user._id })}
                                onStart={(id) => startAssignment({ id })}
                                onAddUpdate={(id) => setUpdatingId(id)}
                                onComplete={(id) => completeAssignment({ id })}
                            />
                        </CollectionItem>
                    ))}
                </Collection>
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
