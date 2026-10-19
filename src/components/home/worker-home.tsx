"use client"

import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "../../../convex/_generated/api"
import {
    CheckCircle2, ClipboardCheck, ClipboardList, Inbox, MapPin, Star, Target,
} from "lucide-react"
import Link from "next/link"
import { TaskCard } from "@/components/task-card"
import { Id } from "../../../convex/_generated/dataModel"
import { useEffect, useState } from "react"
import { MultimediaUpload } from "@/components/multimedia-upload"
import {
    DashboardHeader, EmptyState, ListRow, Panel, Pill, StatTile, StatusBadge, focusRing, timeAgo,
} from "@/components/home/dashboard-ui"
import { RowSkeleton } from "@/components/home/resident-home"
import { ServiceArt, artForType } from "@/components/visuals"
import { CampUpdates } from "@/components/home/camp-updates"

const DAY = 24 * 60 * 60 * 1000
const DONE = ["completed", "rated", "cancelled"]

export function WorkerHome({ user }: { user: any }) {
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<Id<"tasks"> | null>(null)

    const assignments = useQuery(api.tasks.getWorkerAssignments, { workerId: user._id })
    const preventive = useQuery(api.preventive.listForStaff, { staffId: user._id })
    const profile = useQuery(api.users.getProfile, { id: user._id })

    const acknowledgeAssignment = useMutation(api.tasks.acknowledgeAssignment)
    const startAssignment = useMutation(api.tasks.startAssignment)
    const completeAssignment = useMutation(api.tasks.completeTask)
    const recordView = useMutation(api.tasks.recordView)

    const loading = assignments === undefined
    const assignmentsList = assignments || []
    const availableTasks = assignmentsList.filter((a: any) => !a.staffId && a.status === "pending")

    // Seeing a task on the board counts as having seen it (admin staffing view)
    useEffect(() => {
        if (!loading && availableTasks.length > 0 && user?._id) {
            availableTasks.forEach((task: any) => {
                recordView({ id: task._id, staffId: user._id })
            })
        }
    }, [loading, availableTasks.length, user?._id, recordView])

    const myTasks = assignmentsList.filter((a: any) => a.staffId === user._id)
    const myOpen = myTasks.filter((a: any) => !DONE.includes(a.status))
    const inProgress = myTasks.filter((a: any) => a.status === "in_progress")
    const awaitingAccept = myTasks.filter((a: any) => a.status === "pending")
    const startOfToday = new Date().setHours(0, 0, 0, 0)
    const doneToday = myTasks.filter((a: any) =>
        (a.status === "completed" || a.status === "rated") && (a.completedAt ?? 0) >= startOfToday)
    const ratings = myTasks.filter((a: any) => typeof a.rating === "number").map((a: any) => a.rating as number)
    const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1) : null

    const focusTask =
        inProgress[0] ||
        myTasks.find((a: any) => a.status === "acknowledged") ||
        awaitingAccept[0] ||
        availableTasks[0]

    const recentTasks = [...myTasks]
        .sort((a: any, b: any) => (b.assignedAt || 0) - (a.assignedAt || 0))
        .filter((t: any) => t._id !== focusTask?._id)
        .slice(0, 4)

    const preventiveList = preventive ?? []
    const preventiveDue = preventiveList.filter((p: any) => p.nextDue - Date.now() <= DAY)

    const handleAcknowledge = async (id: Id<"tasks">) => {
        await acknowledgeAssignment({ id, staffId: user._id })
    }
    const handleStart = async (id: Id<"tasks">) => {
        await startAssignment({ id })
    }
    const handleAddUpdate = (id: Id<"tasks">) => {
        setSelectedAssignmentId(id)
    }
    const handleComplete = async (id: Id<"tasks">) => {
        if (confirm("Mark this assignment as completed?")) {
            await completeAssignment({ id })
        }
    }
    const cardHandlers = {
        onAcknowledge: handleAcknowledge,
        onStart: handleStart,
        onAddUpdate: handleAddUpdate,
        onComplete: handleComplete,
    }

    return (
        <div className="space-y-6 md:space-y-8 pb-24 md:pb-8">
            <DashboardHeader
                name={user.name}
                subtitle={myOpen.length > 0
                    ? `You have ${myOpen.length} open task${myOpen.length === 1 ? "" : "s"}.`
                    : "You're all caught up. Ready for your shift?"}
                badges={
                    <>
                        {profile && (
                            <Pill icon={MapPin} tone={profile.isOnSite ? "success" : "neutral"}>
                                {profile.isOnSite ? "On site" : "Off site"}
                            </Pill>
                        )}
                        {profile?.assignedDuties?.length > 0 && (
                            <Pill icon={ClipboardList}>
                                <span className="capitalize">{profile.assignedDuties.map((d: string) => d.replace("_", " ")).join(" · ")}</span>
                            </Pill>
                        )}
                    </>
                }
            />

            {/* Announcements and events, seen first */}
            <CampUpdates />

            {/* Key numbers */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 md:gap-4">
                <StatTile
                    label="My open tasks" icon={ClipboardList} href="/app/assignments" tone="primary"
                    value={myOpen.length} loading={loading}
                    hint={awaitingAccept.length ? `${awaitingAccept.length} waiting for you to accept` : `${inProgress.length} in progress`}
                />
                <StatTile
                    label="Available to claim" icon={Inbox} href="/app/available-tasks" tone="amber"
                    value={availableTasks.length} loading={loading}
                    hint={availableTasks.length ? "Unassigned requests" : "Nothing waiting"}
                />
                <StatTile
                    label="Done today" icon={CheckCircle2} href="/app/history" tone="emerald"
                    value={doneToday.length} loading={loading}
                    hint={avgRating ? `Average rating ${avgRating} ★` : "No ratings yet"}
                />
                <StatTile
                    label="Preventive due" icon={ClipboardCheck} href="/app/preventive" tone="violet"
                    value={preventiveDue.length} loading={preventive === undefined}
                    hint={`${preventiveList.length} scheduled job${preventiveList.length === 1 ? "" : "s"}`}
                />
            </div>

            <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
                {/* Main column */}
                <div className="min-w-0 space-y-4 md:space-y-6 lg:col-span-2">
                    <Panel
                        title={focusTask && !focusTask.staffId ? "Next up — open task" : "Focus task"}
                        icon={Target}
                        action={{ label: "All tasks", href: "/app/assignments" }}
                    >
                        {loading ? (
                            <div className="h-48 rounded-2xl bg-muted animate-pulse" aria-busy="true" aria-label="Loading" />
                        ) : focusTask ? (
                            <TaskCard assignment={focusTask} {...cardHandlers} />
                        ) : (
                            <EmptyState art="tasks" artTone="emerald" title="All caught up" hint="New tasks will appear here the moment they're assigned." />
                        )}
                    </Panel>

                    {availableTasks.filter((t: any) => t._id !== focusTask?._id).length > 0 && (
                        <Panel
                            title={`Available tasks (${availableTasks.length})`}
                            icon={Inbox}
                            action={{ label: "View all", href: "/app/available-tasks" }}
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                {availableTasks
                                    .filter((t: any) => t._id !== focusTask?._id)
                                    .slice(0, 4)
                                    .map((task: any) => (
                                        <TaskCard key={task._id} assignment={task} {...cardHandlers} />
                                    ))}
                            </div>
                        </Panel>
                    )}

                    <Panel title="Recent assignments" icon={ClipboardList} action={{ label: "History", href: "/app/history" }}>
                        {loading ? (
                            <RowSkeleton />
                        ) : recentTasks.length === 0 ? (
                            <EmptyState art="tasks" title="No other assignments yet" />
                        ) : (
                            <ul className="space-y-1">
                                {recentTasks.map((task: any) => {
                                    return (
                                        <ListRow
                                            key={task._id}
                                            href={`/app/assignments/${task._id}`}
                                            icon={<ServiceArt kind={artForType(task.serviceType)} size={40} motion={task.status === "in_progress" ? "always" : "none"} />}
                                            title={`${task.serviceType?.replace("_", " ") ?? "Task"}${task.roomNumber ? ` · Room ${task.roomNumber}` : ""}`}
                                            meta={<>{task.rating ? <span className="text-amber-600">{"★".repeat(task.rating)} · </span> : null}{task.description || timeAgo(task.assignedAt)}</>}
                                            status={task.status}
                                        />
                                    )
                                })}
                            </ul>
                        )}
                    </Panel>
                </div>

                {/* Side column */}
                <div className="min-w-0 space-y-4 md:space-y-6">
                    <Panel title="Preventive maintenance" icon={ClipboardCheck} action={{ label: "Open", href: "/app/preventive" }}>
                        {preventive === undefined ? (
                            <RowSkeleton rows={2} />
                        ) : preventiveList.length === 0 ? (
                            <EmptyState art="calendar" title="Nothing scheduled for you" />
                        ) : (
                            <ul className="space-y-1">
                                {preventiveList.slice(0, 4).map((p: any) => {
                                    const overdue = p.nextDue < Date.now()
                                    const dueSoon = !overdue && p.nextDue - Date.now() <= DAY
                                    return (
                                        <li key={p._id}>
                                            <Link
                                                href={`/app/preventive/${p._id}`}
                                                className={`flex items-center gap-3 rounded-xl p-2 -mx-2 transition-colors hover:bg-muted/50 ${focusRing}`}
                                            >
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-semibold">{p.title}</span>
                                                    <span className="block text-xs text-muted-foreground">
                                                        {new Date(p.nextDue).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                </span>
                                                {(overdue || dueSoon) && <StatusBadge status={overdue ? "overdue" : "pending"} />}
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </Panel>

                    {ratings.length > 0 && (
                        <Panel title="Your rating" icon={Star}>
                            <p className="flex items-baseline gap-2">
                                <span className="text-3xl font-black tabular-nums">{avgRating}</span>
                                <span className="sr-only">out of 5</span>
                                <span className="text-lg tracking-wide" aria-hidden>
                                    <span className="text-amber-500">{"★".repeat(Math.round(Number(avgRating)))}</span>
                                    <span className="text-muted-foreground/40">{"★".repeat(5 - Math.round(Number(avgRating)))}</span>
                                </span>
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">From {ratings.length} rated task{ratings.length === 1 ? "" : "s"}</p>
                        </Panel>
                    )}
                </div>
            </div>

            {selectedAssignmentId && (
                <MultimediaUpload
                    assignmentId={selectedAssignmentId}
                    onComplete={() => setSelectedAssignmentId(null)}
                    onCancel={() => setSelectedAssignmentId(null)}
                />
            )}
        </div>
    )
}
