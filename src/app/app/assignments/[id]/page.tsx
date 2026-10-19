"use client"

import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"
import {
    ArrowLeft, Clock, CheckCircle2, PlayCircle, AlertCircle, Loader2, MessageSquarePlus,
    User, FileText, Star, Tag
} from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth-provider"
import { isWorker, isCamperOrVisitor } from "@/components/role-guard"
import { toast } from "sonner"
import { MultimediaUpload } from "@/components/multimedia-upload"
import { TaskStatusPill } from "@/components/task-card"
import { ActionBar } from "@/components/collection"
import { RequestJourney, ServiceArt, artForType, celebrate } from "@/components/visuals"

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
    const [busy, setBusy] = useState<string | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)

    // One action at a time, with a spinner on the pressed button and feedback when it lands
    async function run(key: string, action: () => Promise<unknown>, done?: () => void) {
        if (busy) return
        try { navigator.vibrate?.(15) } catch {}
        setBusy(key)
        try {
            await action()
            done?.()
        } catch (err: any) {
            toast.error("That didn't work", { description: err?.message?.split("Uncaught Error:").pop()?.trim() || "Please try again." })
        } finally {
            setBusy(null)
        }
    }

    const isLoading = task === undefined

    const isStaff = !!user && isWorker(user.role)

    // This is a staff screen; residents/guests see the same job as their request
    useEffect(() => {
        if (!user || isStaff || task === undefined) return
        router.replace(task?.requestId ? `/app/requests/${task.requestId}` : "/app/requests")
    }, [user, isStaff, task, router])

    useEffect(() => {
        if (!isLoading && task && task.status === "pending" && isStaff) {
            recordView({ id: task._id, staffId: user!._id })
        }
    }, [isLoading, task, isStaff, user, recordView])

    if (task === undefined || (user && !isStaff)) {
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
                <Link href="/app/assignments" className="text-primary text-sm font-semibold">← Back to Assignments</Link>
            </div>
        )
    }

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
            <div className="rounded-3xl border bg-card p-5 md:p-6 shadow-sm space-y-5">
                <div className="flex items-start gap-3">
                    <ServiceArt kind={artForType(task.serviceType)} size={60} motion={task.status === "in_progress" ? "always" : "ambient"} />
                    <div className="min-w-0 flex-1 space-y-1">
                        <h1 className="truncate text-2xl font-black tracking-tight">Room {task.roomNumber}</h1>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{task.serviceType.replace(/_/g, " ")}</p>
                    </div>
                    <TaskStatusPill status={task.status} />
                </div>

                {/* Where the job stands, in pictures */}
                <RequestJourney
                    status={task.status}
                    type={task.serviceType}
                    showHeadline={false}
                    times={{ sent: task.assignedAt, accepted: task.acknowledgedAt, started: task.startedAt, done: task.completedAt }}
                />

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {task.staffId ? <>Assigned to <span className="font-semibold text-foreground">{task.staffName}</span></> : <span className="font-semibold text-foreground">Open to any staff member</span>}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(task.assignedAt)}
                    </span>
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
                            {task.requestDetails.priority === "pending_review" ? "needs review" : task.requestDetails.priority.replace(/_/g, " ")} priority
                        </span>
                    </div>

                    <p className="text-sm leading-relaxed text-foreground/80 italic border-l-2 border-primary/30 pl-3">
                        &ldquo;{task.requestDetails.description}&rdquo;
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
                        <p className="text-sm italic text-foreground/70">&ldquo;{task.feedback}&rdquo;</p>
                    )}
                </div>
            )}

            {/* Action buttons — pinned to the bottom of the screen on phones */}
            {user && (
                <ActionBar>
                    {/* STAFF ONLY ACTIONS */}
                    {isWorker(user.role) && (
                        <>
                            {canAcknowledge && (
                                <DetailButton tone="primary" busy={busy === "accept"} disabled={!!busy}
                                    onClick={() => run("accept", () => acknowledgeAssignment({ id: task._id, staffId: user._id }), () => toast.success("Task accepted", { description: `Room ${task.roomNumber} is now yours.` }))}>
                                    Accept Task
                                </DetailButton>
                            )}
                            {canStart && (
                                <DetailButton tone="primary" busy={busy === "start"} disabled={!!busy} icon={<PlayCircle className="h-4 w-4" />}
                                    onClick={() => run("start", () => startAssignment({ id: task._id }), () => toast.success("Work started", { description: "The resident can see you're on it." }))}>
                                    Start Work
                                </DetailButton>
                            )}
                            {canComplete && (
                                <>
                                    <DetailButton tone="neutral" busy={false} disabled={!!busy} icon={<MessageSquarePlus className="h-4 w-4" />}
                                        onClick={() => setIsUpdating(true)}>
                                        Add Update
                                    </DetailButton>
                                    <DetailButton tone="success" busy={busy === "complete"} disabled={!!busy} icon={<CheckCircle2 className="h-4 w-4" />}
                                        onClick={() => run("complete", () => completeTask({ id: task._id }), () => {
                                            celebrate({ title: "Task completed!", message: `Room ${task.roomNumber} is done. Nice work.`, kind: artForType(task.serviceType) })
                                            router.push("/app/assignments")
                                        })}>
                                        Mark Complete
                                    </DetailButton>
                                </>
                            )}
                        </>
                    )}

                    {/* CAMPER / REQUEST OWNER ACTIONS */}
                    {isCamperOrVisitor(user.role) && (
                        <>
                            {task.status !== "completed" && task.status !== "cancelled" && (
                                <>
                                    <button
                                        onClick={() => {
                                            if (confirm("Are you sure you want to cancel this request?")) {
                                                cancelRequest({ id: task.requestId as Id<"requests"> }).then(() => {
                                                    router.push("/app/history");
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
                    {/* TASK COMPLETED STATE */}
                    {isStaff && (task.status === "completed" || task.status === "rated") && (
                        <button
                            onClick={() => router.push("/app/assignments")}
                            className="flex-1 bg-muted text-muted-foreground h-12 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-muted/80 transition-all"
                        >
                            Back to Assignments
                        </button>
                    )}
                </ActionBar>
            )}

            {isUpdating && (
                <MultimediaUpload
                    assignmentId={task._id}
                    onComplete={() => setIsUpdating(false)}
                    onCancel={() => setIsUpdating(false)}
                />
            )}
        </div>
    )
}

function DetailButton({ children, onClick, busy, disabled, tone, icon }: {
    children: React.ReactNode
    onClick: () => void
    busy: boolean
    disabled?: boolean
    tone: "primary" | "success" | "neutral"
    icon?: React.ReactNode
}) {
    const tones = {
        primary: "bg-primary text-primary-foreground shadow-primary-glow",
        success: "bg-emerald-600 text-white",
        neutral: "border bg-card text-foreground",
    }
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-busy={busy || undefined}
            className={`flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 ${tones[tone]}`}
        >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
            {children}
        </button>
    )
}
