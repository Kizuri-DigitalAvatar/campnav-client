"use client"

import { useQuery, useMutation } from "convex/react"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import {
    ArrowLeft, MapPin, Clock, CheckCircle, PlayCircle, AlertCircle,
    User, FileText, Star, Image as ImageIcon, Mic, Tag
} from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth-provider"

const STATUS_STYLES: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    acknowledged: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    pending: "bg-red-500/10 text-red-600 border-red-500/20",
    rated: "bg-purple-500/10 text-purple-600 border-purple-500/20",
}

const PRIORITY_STYLES: Record<string, string> = {
    urgent: "bg-red-500 text-white",
    important: "bg-amber-500 text-white",
    low: "bg-muted text-muted-foreground",
}

function formatTime(ts: number) {
    return new Date(ts).toLocaleString([], {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    })
}

export default function AssignmentDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { user } = useAuth()

    const task = useQuery(api.tasks.getById, { id: id as Id<"tasks"> })
    const acknowledgeAssignment = useMutation(api.tasks.acknowledgeAssignment)
    const startAssignment = useMutation(api.tasks.startAssignment)
    const completeTask = useMutation(api.tasks.completeTask)
    const recordView = useMutation(api.tasks.recordView)
    const cancelRequest = useMutation(api.requests.cancel)
    const createReport = useMutation(api.reports.create)

    const isLoading = task === undefined

    useEffect(() => {
        if (!isLoading && task && task.status === "pending" && user?._id) {
            recordView({ id: task._id, staffId: user._id })
        }
    }, [isLoading, task, user?._id, recordView])

    if (task === undefined) {
        return (
            <div className="space-y-6 pb-8">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-xl" />
                    <Skeleton className="h-6 w-40" />
                </div>
                <Skeleton className="h-32 rounded-3xl" />
                <Skeleton className="h-48 rounded-3xl" />
                <Skeleton className="h-24 rounded-3xl" />
            </div>
        )
    }

    if (!task) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Task not found</p>
                <Link href="/assignments" className="text-primary text-sm font-semibold">← Back to Assignments</Link>
            </div>
        )
    }

    const statusStyle = STATUS_STYLES[task.status] || STATUS_STYLES.pending
    const isMyTask = user && task.staffId === user._id
    const canAcknowledge = task.status === "pending" && user
    const canStart = task.status === "acknowledged" && isMyTask
    const canComplete = task.status === "in_progress" && isMyTask

    return (
        <div className="space-y-5 pb-10">
            {/* Back nav */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <button onClick={() => router.back()} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3 w-3" />
                    <span>Back</span>
                </button>
                <span>/</span>
                <span className="text-foreground font-medium">Task Detail</span>
            </div>

            {/* Header card */}
            <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <h1 className="text-2xl font-black tracking-tight">{task.roomNumber}</h1>
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{task.serviceType}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusStyle}`}>
                        {task.status.replace("_", " ")}
                    </span>
                </div>

                {/* Staff */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    <span>Assigned to: <span className="font-semibold text-foreground">{task.staffName}</span></span>
                </div>

                {/* Timeline */}
                <div className="space-y-1.5 text-xs text-muted-foreground border-t pt-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>Assigned: {formatTime(task.assignedAt)}</span>
                    </div>
                    {task.acknowledgedAt && (
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-amber-500" />
                            <span>Acknowledged: {formatTime(task.acknowledgedAt)}</span>
                        </div>
                    )}
                    {task.startedAt && (
                        <div className="flex items-center gap-2">
                            <PlayCircle className="w-3 h-3 text-blue-500" />
                            <span>Started: {formatTime(task.startedAt)}</span>
                        </div>
                    )}
                    {task.completedAt && (
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            <span>Completed: {formatTime(task.completedAt)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Request details */}
            {task.requestDetails && (
                <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-primary">Camper Request</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3 text-muted-foreground" />
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${PRIORITY_STYLES[task.requestDetails.priority] || PRIORITY_STYLES.low}`}>
                            {task.requestDetails.priority} priority
                        </span>
                    </div>

                    <p className="text-sm leading-relaxed text-foreground/80 italic border-l-2 border-primary/30 pl-3">
                        "{task.requestDetails.description}"
                    </p>

                    {task.requestDetails.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border aspect-video">
                            <img src={task.requestDetails.imageUrl} alt="Request attachment" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
            )}

            {/* Updates */}
            {task.updatesWithUrls && task.updatesWithUrls.length > 0 && (
                <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        Progress Updates ({task.updatesWithUrls.length})
                    </h2>
                    <div className="space-y-4">
                        {task.updatesWithUrls.map((update: any, i: number) => (
                            <div key={i} className="space-y-2 border-l-2 border-border pl-4">
                                <p className="text-[10px] text-muted-foreground font-medium">{formatTime(update.timestamp)}</p>
                                {update.text && <p className="text-sm text-foreground/80">{update.text}</p>}
                                {update.imageUrls && update.imageUrls.length > 0 && (
                                    <div className="flex gap-2 flex-wrap">
                                        {update.imageUrls.map((url: string, j: number) => (
                                            <div key={j} className="w-20 h-20 rounded-xl overflow-hidden border">
                                                <img src={url} alt="Update" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {update.audioUrl && (
                                    <audio controls src={update.audioUrl} className="w-full h-8 mt-1" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Rating */}
            {task.rating && (
                <div className="rounded-3xl border bg-amber-500/5 border-amber-500/20 p-6 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black uppercase tracking-widest text-amber-600/70">Rating</h2>
                        <div className="flex text-amber-500">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < task.rating! ? "fill-amber-500 text-amber-500" : "text-muted-foreground/20"}`} />
                            ))}
                        </div>
                    </div>
                    {task.feedback && (
                        <p className="text-sm italic text-foreground/70">"{task.feedback}"</p>
                    )}
                </div>
            )}

            {/* Action buttons */}
            {user && (
                <div className="flex gap-3">
                    {/* STAFF ONLY ACTIONS */}
                    {user.role === "camp-staff" && (
                        <>
                            {canAcknowledge && (
                                <button
                                    onClick={() => acknowledgeAssignment({ id: task._id, staffId: user._id }).then(() => router.refresh())}
                                    className="flex-1 bg-primary text-primary-foreground h-12 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                                >
                                    {task.staffId ? "Respond" : "Accept Task"}
                                </button>
                            )}
                            {canStart && (
                                <button
                                    onClick={() => startAssignment({ id: task._id }).then(() => router.refresh())}
                                    className="flex-1 bg-primary text-primary-foreground h-12 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                                >
                                    Start Work
                                </button>
                            )}
                            {canComplete && (
                                <button
                                    onClick={() => completeTask({ id: task._id }).then(() => router.push("/assignments"))}
                                    className="flex-1 bg-emerald-600 text-white h-12 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                                >
                                    Mark Complete
                                </button>
                            )}
                        </>
                    )}

                    {/* CAMPER / REQUEST OWNER ACTIONS */}
                    {user.role === "camper" && (
                        <>
                            {task.status !== "completed" && task.status !== "cancelled" && (
                                <>
                                    <button
                                        onClick={() => {
                                            if (confirm("Are you sure you want to cancel this request?")) {
                                                cancelRequest({ id: task.requestId as Id<"requests"> }).then(() => {
                                                    router.push("/history");
                                                });
                                            }
                                        }}
                                        className="flex-1 bg-muted text-muted-foreground h-12 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all"
                                    >
                                        Cancel Request
                                    </button>
                                    <button
                                        onClick={() => {
                                            createReport({
                                                userId: user._id,
                                                type: "incident",
                                                title: `Issue with task in room ${task.roomNumber}`,
                                                message: `Reporting unresponsive staff or issue with task ${task._id}.`,
                                                status: "unread",
                                            }).then(() => {
                                                alert("Report submitted to admin.");
                                            });
                                        }}
                                        className="flex-1 bg-red-500/10 text-red-600 h-12 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500/20 transition-all"
                                    >
                                        Report
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
