"use client"

import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { useParams, useRouter } from "next/navigation"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import {
    ArrowLeft, Clock, CheckCircle2, PlayCircle, AlertCircle,
    MapPin, FileText, User, Users, ShieldAlert, Star
} from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

const STATUS_STYLES: Record<string, string> = {
    pending: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    in_progress: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    rated: "bg-purple-500/10 text-purple-600 border-purple-500/20",
}

function formatTime(ts: number) {
    if (!ts) return ""
    return new Date(ts).toLocaleString([], {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    })
}

export default function RequestDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const request = useQuery(api.requests.getWithTaskDetails, { id: id as Id<"requests"> })
    const createReport = useMutation(api.reports.create)

    const handleReport = async () => {
        if (!request) return

        try {
            await createReport({
                userId: request.userId,
                type: "staff_unresponsive",
                title: `Staff Unresponsive: Room ${request.roomNumber}`,
                message: `Staff viewed but did not respond to request: ${request.type} at Room ${request.roomNumber}. Viewers: ${request.taskDetails?.viewers?.join(", ") || "None"}`,
                status: "unread"
            })
            toast.success("Report submitted to admin")
        } catch (error) {
            toast.error("Failed to submit report")
        }
    }

    if (request === undefined) {
        return (
            <div className="space-y-6 pb-8">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-xl" />
                    <Skeleton className="h-6 w-40" />
                </div>
                <Skeleton className="h-32 rounded-3xl" />
                <Skeleton className="h-48 rounded-3xl" />
            </div>
        )
    }

    if (!request) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Request not found</p>
                <Link href="/requests" className="text-primary text-sm font-semibold">← Back to My Requests</Link>
            </div>
        )
    }

    const task = request.taskDetails
    const statusStyle = STATUS_STYLES[request.status] || STATUS_STYLES.pending

    return (
        <div className="space-y-5 pb-10">
            {/* Back nav */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <button onClick={() => router.back()} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3 w-3" />
                    <span>Back</span>
                </button>
                <span>/</span>
                <span className="text-foreground font-medium">Request Tracker</span>
            </div>

            {/* Main Info Card */}
            <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <h1 className="text-2xl font-black tracking-tight">Room {request.roomNumber}</h1>
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{request.type}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusStyle}`}>
                        {request.status.replace("_", " ")}
                    </span>
                </div>

                <p className="text-sm leading-relaxed text-foreground/80 italic border-l-2 border-primary/30 pl-3">
                    "{request.description}"
                </p>

                {request.imageUrl && (
                    <div className="rounded-2xl overflow-hidden border aspect-video">
                        <img src={request.imageUrl} alt="Request attachment" className="w-full h-full object-cover" />
                    </div>
                )}
            </div>

            {/* Timeline Section */}
            <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-6">
                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Status Timeline
                </h2>

                <div className="space-y-6">
                    {/* Created */}
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full bg-primary border-4 border-primary/20" />
                            <div className="w-0.5 flex-1 bg-border my-1" />
                        </div>
                        <div className="pb-2">
                            <p className="text-sm font-bold">Request Submitted</p>
                            <p className="text-[10px] text-muted-foreground">{formatTime(request.createdAt)}</p>
                        </div>
                    </div>

                    {/* Viewed by (if pending) */}
                    {request.status === "pending" && task?.viewers && task.viewers.length > 0 && (
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-5 h-5 rounded-full bg-blue-500/20 border-4 border-blue-500/10 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                </div>
                                <div className="w-0.5 flex-1 bg-border my-1" />
                            </div>
                            <div className="pb-2 space-y-2 flex-1">
                                <div>
                                    <p className="text-sm font-bold">Viewed by Staff</p>
                                    <p className="text-[10px] text-muted-foreground">Staff members are reviewing your request</p>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {task.viewers.map((name: string, i: number) => (
                                        <span key={i} className="px-2 py-0.5 bg-muted rounded-full text-[9px] font-semibold text-muted-foreground border">
                                            {name}
                                        </span>
                                    ))}
                                </div>
                                <div className="pt-1">
                                    <button
                                        onClick={handleReport}
                                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-red-500 hover:text-red-600 transition-colors"
                                    >
                                        < ShieldAlert className="w-3 h-3" />
                                        Report Unresponsive Staff
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Assigned */}
                    {task?.staffId && (
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className={`w-5 h-5 rounded-full ${task.acknowledgedAt ? "bg-amber-500" : "bg-muted"} border-4 border-amber-500/10`} />
                                <div className="w-0.5 flex-1 bg-border my-1" />
                            </div>
                            <div className="pb-2">
                                <p className="text-sm font-bold">Staff Accepted</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                                        <User className="w-2 h-2 text-muted-foreground" />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        <span className="font-semibold text-foreground">{task.staffName}</span>
                                        {task.acknowledgedAt ? ` • Accepted at ${formatTime(task.acknowledgedAt)}` : " • Pending confirmation"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* In Progress */}
                    {(task?.startedAt || task?.status === "in_progress") && (
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className={`w-5 h-5 rounded-full ${task.status === "in_progress" ? "bg-blue-500" : "bg-muted"} border-4 border-blue-500/10 flex items-center justify-center`}>
                                    {task.status === "in_progress" && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                </div>
                                <div className="w-0.5 flex-1 bg-border my-1" />
                            </div>
                            <div className="pb-2">
                                <p className="text-sm font-bold">Work Started</p>
                                {task.startedAt && <p className="text-[10px] text-muted-foreground">{formatTime(task.startedAt)}</p>}
                                {task.status === "in_progress" && (
                                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/5 text-blue-600 rounded-lg border border-blue-500/10">
                                        <PlayCircle className="w-3 h-3 animate-spin-slow" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Active Now</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Completed */}
                    {(task?.completedAt || request.status === "completed" || request.status === "rated") && (
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className={`w-5 h-5 rounded-full ${request.status === "completed" || request.status === "rated" ? "bg-emerald-500" : "bg-muted"} border-4 border-emerald-500/10 flex items-center justify-center`}>
                                    {(request.status === "completed" || request.status === "rated") && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                            </div>
                            <div className="pb-2">
                                <p className="text-sm font-bold">Completed</p>
                                {task?.completedAt && <p className="text-[10px] text-muted-foreground">{formatTime(task.completedAt)}</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Staff Progress Updates */}
            {task?.updatesWithUrls && task.updatesWithUrls.length > 0 && (
                <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Staff Updates ({task.updatesWithUrls.length})
                    </h2>
                    <div className="space-y-6">
                        {task.updatesWithUrls.map((update: any, i: number) => (
                            <div key={i} className="relative pl-6 border-l-2 border-primary/10">
                                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary/30" />
                                <div className="space-y-2">
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{formatTime(update.timestamp)}</p>
                                    {update.text && <p className="text-sm text-foreground/80 leading-relaxed font-medium">"{update.text}"</p>}
                                    {update.imageUrls && update.imageUrls.length > 0 && (
                                        <div className="flex gap-2 flex-wrap">
                                            {update.imageUrls.map((url: string, j: number) => (
                                                <div key={j} className="w-24 h-24 rounded-xl overflow-hidden border shadow-sm">
                                                    <img src={url} alt="Update" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {update.audioUrl && (
                                        <div className="bg-muted/50 rounded-xl p-2 border border-border/50">
                                            <audio controls src={update.audioUrl} className="w-full h-6" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Feedback/Rating Section */}
            {request.status === "rated" && task?.rating && (
                <div className="rounded-3xl border bg-amber-500/5 border-amber-500/20 p-6 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black uppercase tracking-widest text-amber-600/70">My Feedback</h2>
                        <div className="flex text-amber-500">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < task.rating! ? "fill-amber-500 text-amber-500" : "text-muted-foreground/20"}`} />
                            ))}
                        </div>
                    </div>
                    {task.feedback && (
                        <p className="text-sm italic text-foreground/70 leading-relaxed">"{task.feedback}"</p>
                    )}
                </div>
            )}

            {/* Action for uncompleted task */}
            {request.status === "completed" && (
                <Link
                    href={`/history`}
                    className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground h-14 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/10"
                >
                    <Star className="w-4 h-4" />
                    Rate Service
                </Link>
            )}
        </div>
    )
}
