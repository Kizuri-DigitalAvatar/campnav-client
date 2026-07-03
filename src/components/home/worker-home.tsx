"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { ClipboardList, Clock, MapPin, CheckCircle, PlayCircle, Megaphone, ArrowRight } from "lucide-react"
import Link from "next/link"
import { TaskCard } from "@/components/task-card"
import { Id } from "../../../convex/_generated/dataModel"
import { useEffect, useState } from "react"
import { MultimediaUpload } from "@/components/multimedia-upload"

import { Skeleton } from "@/components/ui/skeleton"

export function WorkerHome({ user }: { user: any }) {
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<Id<"tasks"> | null>(null)

    const assignments = useQuery(
        api.tasks.getWorkerAssignments,
        { workerId: user._id }
    )

    const announcements = useQuery(api.announcements.list, { priority: "all" })

    const acknowledgeAssignment = useMutation(api.tasks.acknowledgeAssignment)
    const startAssignment = useMutation(api.tasks.startAssignment)
    const completeAssignment = useMutation(api.tasks.completeTask)
    const recordView = useMutation(api.tasks.recordView)

    const isLoading = assignments === undefined || announcements === undefined

    const assignmentsList = assignments || []
    const availableTasks = assignmentsList.filter((a: any) => !a.staffId && a.status === "pending")

    useEffect(() => {
        if (!isLoading && availableTasks.length > 0 && user?._id) {
            availableTasks.forEach((task: any) => {
                recordView({ id: task._id, staffId: user._id })
            })
        }
    }, [isLoading, availableTasks.length, user?._id, recordView])

    if (isLoading) {
        return (
            <div className="space-y-6 pb-20">
                <header className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-12 w-12 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-20 rounded-2xl" />
                        <Skeleton className="h-20 rounded-2xl" />
                    </div>
                </header>
                <Skeleton className="h-32 w-full rounded-2xl" />
                <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-40 w-full rounded-3xl" />
                </div>
            </div>
        )
    }

    const announcementsList = announcements || []

    const pendingTasks = assignmentsList.filter((a: any) => a.status === "pending")
    const inProgressTasks = assignmentsList.filter((a: any) => a.status === "in_progress")
    const myTasks = assignmentsList.filter((a: any) => a.staffId === user._id)

    const activeTask = inProgressTasks.find((a: any) => a.staffId === user._id) ||
        myTasks.find((a: any) => a.status === "acknowledged") ||
        myTasks.find((a: any) => a.status === "pending")

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

    return (
        <div className="space-y-6 pb-20">
            {/* Header / Stats */}
            <header className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight uppercase">Hello, {user.name.split(' ')[0]}</h1>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Ready for your shift?</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                        <ClipboardList size={24} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card border rounded-2xl p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Pending</p>
                        <p className="text-2xl font-black text-primary">{pendingTasks.length}</p>
                    </div>
                    <div className="bg-card border rounded-2xl p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">In Progress</p>
                        <p className="text-2xl font-black">{inProgressTasks.length}</p>
                    </div>
                </div>
            </header>

            {/* <WeatherWidget /> */}

            {/* Active / Next Task Card */}
            <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Focus Task</h2>
                    {assignments.length > 0 && (
                        <Link href="/assignments" className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                            Go to Dashboard <ArrowRight size={10} />
                        </Link>
                    )}
                </div>

                {activeTask ? (
                    <TaskCard
                        assignment={activeTask}
                        onAcknowledge={handleAcknowledge}
                        onStart={handleStart}
                        onAddUpdate={handleAddUpdate}
                        onComplete={handleComplete}
                    />
                ) : pendingTasks.length > 0 ? (
                    <TaskCard
                        assignment={pendingTasks[0]}
                        onAcknowledge={handleAcknowledge}
                        onStart={handleStart}
                        onAddUpdate={handleAddUpdate}
                        onComplete={handleComplete}
                    />
                ) : (
                    <div className="bg-muted/30 border border-dashed rounded-3xl p-8 text-center">
                        <CheckCircle size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest italic">All caught up!</p>
                    </div>
                )}
            </section>

            {/* Recent Assignments */}
            {myTasks.length > 0 && (
                <section className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Recent Assignments</h2>
                        <Link href="/assignments" className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                            View All <ArrowRight size={10} />
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {[...myTasks]
                            .sort((a: any, b: any) => (b.assignedAt || 0) - (a.assignedAt || 0))
                            .slice(0, 3)
                            .map((task: any) => (
                                <Link
                                    key={task._id}
                                    href={`/assignments/${task._id}`}
                                    className="flex items-center gap-3 bg-card border rounded-2xl p-4 shadow-sm hover:border-primary/50 transition-colors"
                                >
                                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                                        task.status === "completed" || task.status === "rated"
                                            ? "bg-emerald-500/10 text-emerald-600"
                                            : task.status === "in_progress"
                                                ? "bg-primary/10 text-primary"
                                                : "bg-amber-500/10 text-amber-600"
                                    }`}>
                                        {task.status === "completed" || task.status === "rated" ? (
                                            <CheckCircle size={16} />
                                        ) : task.status === "in_progress" ? (
                                            <PlayCircle size={16} />
                                        ) : (
                                            <Clock size={16} />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold truncate capitalize">
                                            {task.serviceType?.replace("_", " ") || "Task"}
                                            {task.roomNumber ? ` · Room ${task.roomNumber}` : ""}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground truncate">{task.description}</p>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
                                        {task.status?.replace("_", " ")}
                                    </span>
                                </Link>
                            ))}
                    </div>
                </section>
            )}

            {/* Available Tasks Section */}
            {availableTasks.length > 0 && (
                <section className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xs font-black uppercase tracking-widest text-primary font-bold">Available Tasks ({availableTasks.length})</h2>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                        {availableTasks.map((task: any) => (
                            <div key={task._id} className="min-w-[280px] max-w-[280px]">
                                <TaskCard
                                    assignment={task}
                                    onAcknowledge={handleAcknowledge}
                                    onStart={handleStart}
                                    onAddUpdate={handleAddUpdate}
                                    onComplete={handleComplete}
                                />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Announcements (Same as visitor but maybe less prominent) */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Updates</h2>
                    <Link href="/updates" className="text-[10px] font-black uppercase tracking-widest text-primary">View All</Link>
                </div>

                <div className="space-y-3">
                    {announcements.slice(0, 2).map((announcement) => (
                        <div key={announcement._id} className="bg-card border rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${announcement.priority === 'High' ? 'bg-red-500' :
                                announcement.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} />
                            <div className="flex justify-between items-start gap-3">
                                <h3 className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{announcement.title}</h3>
                                <Megaphone size={14} className="text-muted-foreground shrink-0" />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 font-medium italic">
                                {new Date(announcement.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Multimedia Upload Modal */}
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
