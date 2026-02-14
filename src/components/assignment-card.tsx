"use client"

import { Card } from "@/components/ui/card"
import { Clock, MapPin, CheckCircle, PlayCircle, AlertCircle } from "lucide-react"
import { Id } from "../../convex/_generated/dataModel"

interface AssignmentCardProps {
    assignment: {
        _id: Id<"housekeeping">
        housekeeperId?: Id<"users">
        roomNumber: string
        serviceType: string
        status: string
        assignedAt: number
        acknowledgedAt?: number
        startedAt?: number
        completedAt?: number
        rating?: number
        feedback?: string
        updates?: Array<{
            timestamp: number
            text?: string
            images?: string[]
            audio?: string
        }>
        requestDetails?: {
            description: string
            priority: string
            imageUrl?: string | null
        } | null
    }
    onAcknowledge?: (id: Id<"housekeeping">) => void
    onStart?: (id: Id<"housekeeping">) => void
    onAddUpdate?: (id: Id<"housekeeping">) => void
    onComplete?: (id: Id<"housekeeping">) => void
    readOnly?: boolean
}

export function AssignmentCard({
    assignment,
    onAcknowledge,
    onStart,
    onAddUpdate,
    onComplete,
    readOnly = false,
}: AssignmentCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-primary text-primary-foreground"
            case "in_progress":
                return "bg-background text-foreground border"
            case "acknowledged":
                return "bg-muted text-foreground"
            default:
                return "bg-destructive/10 text-destructive border-destructive/20"
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="w-4 h-4" />
            case "in_progress":
                return <PlayCircle className="w-4 h-4" />
            case "acknowledged":
                return <Clock className="w-4 h-4" />
            default:
                return <AlertCircle className="w-4 h-4" />
        }
    }

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-xl font-bold">{assignment.roomNumber}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest font-black">
                        {assignment.serviceType}
                    </p>
                </div>
                <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${getStatusColor(
                        assignment.status
                    )}`}
                >
                    {getStatusIcon(assignment.status)}
                    <span>{assignment.status.replace("_", " ")}</span>
                </div>
            </div>

            {assignment.requestDetails && (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">User Request</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${assignment.requestDetails.priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'
                            }`}>
                            {assignment.requestDetails.priority}
                        </span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed italic text-foreground/80">
                        "{assignment.requestDetails.description}"
                    </p>
                    {assignment.requestDetails.imageUrl && (
                        <div className="relative aspect-video rounded-xl overflow-hidden border">
                            <img src={assignment.requestDetails.imageUrl} alt="Request" className="object-cover w-full h-full" />
                        </div>
                    )}
                </div>
            )}

            {assignment.rating && (
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/60">Service Rating</span>
                        <div className="flex text-amber-500 text-xs shadow-amber-500/10">
                            {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < assignment.rating! ? "text-amber-500" : "text-muted-foreground/20"}>★</span>
                            ))}
                        </div>
                    </div>
                    {assignment.feedback && (
                        <p className="text-xs font-medium leading-relaxed italic text-foreground/70">
                            "{assignment.feedback}"
                        </p>
                    )}
                </div>
            )}

            <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Assigned: {formatTime(assignment.assignedAt)}</span>
                </div>
                {assignment.acknowledgedAt && (
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3" />
                        <span>Acknowledged: {formatTime(assignment.acknowledgedAt)}</span>
                    </div>
                )}
                {assignment.startedAt && (
                    <div className="flex items-center gap-2">
                        <PlayCircle className="w-3 h-3" />
                        <span>Started: {formatTime(assignment.startedAt)}</span>
                    </div>
                )}
            </div>

            {assignment.updates && assignment.updates.length > 0 && (
                <div className="pt-4 border-t">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
                        Updates ({assignment.updates.length})
                    </p>
                </div>
            )}

            {!readOnly && (
                <div className="flex gap-2 pt-4">
                    {assignment.status === "pending" && onAcknowledge && (
                        <button
                            onClick={() => onAcknowledge(assignment._id)}
                            className="flex-1 bg-primary text-primary-foreground h-10 px-4 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                            {assignment.housekeeperId ? "Respond" : "Accept Task"}
                        </button>
                    )}
                    {assignment.status === "acknowledged" && onStart && (
                        <button
                            onClick={() => onStart(assignment._id)}
                            className="flex-1 bg-primary text-primary-foreground h-10 px-4 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                            Start Work
                        </button>
                    )}
                    {assignment.status === "in_progress" && (
                        <>
                            {onAddUpdate && (
                                <button
                                    onClick={() => onAddUpdate(assignment._id)}
                                    className="flex-1 bg-muted text-foreground h-10 px-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-muted/80 transition-all border"
                                >
                                    Add Update
                                </button>
                            )}
                            {onComplete && (
                                <button
                                    onClick={() => onComplete(assignment._id)}
                                    className="flex-1 bg-primary text-primary-foreground h-10 px-4 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                                >
                                    Complete
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </Card>
    )
}
