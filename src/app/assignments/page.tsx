"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useAuth } from "@/components/auth-provider"
import { AssignmentCard } from "@/components/assignment-card"
import { MultimediaUpload } from "@/components/multimedia-upload"
import { ClipboardList, Filter } from "lucide-react"
import { Id } from "../../../convex/_generated/dataModel"

import { Skeleton } from "@/components/ui/skeleton"

export default function AssignmentsPage() {
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<Id<"housekeeping"> | null>(null)

    // Get current user from auth context
    const { user, loading } = useAuth()

    const assignments = useQuery(
        api.housekeeping.getWorkerAssignments,
        user ? { workerId: user._id } : "skip"
    )

    const acknowledgeAssignment = useMutation(api.housekeeping.acknowledgeAssignment)
    const startAssignment = useMutation(api.housekeeping.startAssignment)
    const completeAssignment = useMutation(api.housekeeping.completeAssignment)

    const isLoading = loading || assignments === undefined

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-4 md:p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-2xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                        <Skeleton className="h-11 w-32 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-64 rounded-3xl" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const assignmentsList = assignments || []

    const filteredAssignments = statusFilter === "all"
        ? assignmentsList
        : assignmentsList.filter((a) => a.status === statusFilter)

    const pendingCount = assignmentsList.filter((a) => a.status === "pending").length
    const inProgressCount = assignmentsList.filter((a) => a.status === "in_progress").length

    const handleAcknowledge = async (id: Id<"housekeeping">) => {
        await acknowledgeAssignment({ assignmentId: id })
    }

    const handleStart = async (id: Id<"housekeeping">) => {
        await startAssignment({ assignmentId: id })
    }

    const handleAddUpdate = (id: Id<"housekeeping">) => {
        setSelectedAssignmentId(id)
    }

    const handleComplete = async (id: Id<"housekeeping">) => {
        await completeAssignment({ assignmentId: id })
    }

    const handleUpdateComplete = () => {
        setSelectedAssignmentId(null)
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">My Assignments</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {pendingCount} pending · {inProgressCount} in progress
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center bg-card border rounded-xl px-4 h-11 shadow-sm">
                        <Filter className="w-4 h-4 text-muted-foreground mr-2.5" />
                        <select
                            className="bg-transparent text-[11px] font-black uppercase tracking-widest text-foreground outline-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="acknowledged">Acknowledged</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>

                {/* Assignments Grid */}
                {filteredAssignments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAssignments.map((assignment) => (
                            <AssignmentCard
                                key={assignment._id}
                                assignment={assignment}
                                onAcknowledge={handleAcknowledge}
                                onStart={handleStart}
                                onAddUpdate={handleAddUpdate}
                                onComplete={handleComplete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-32 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
                        <div className="inline-flex p-6 rounded-3xl bg-muted mb-6">
                            <ClipboardList className="w-12 h-12 opacity-10" />
                        </div>
                        <p className="text-muted-foreground/40 font-bold text-sm tracking-widest uppercase italic">
                            No assignments found
                        </p>
                    </div>
                )}
            </div>

            {/* Multimedia Upload Modal */}
            {selectedAssignmentId && (
                <MultimediaUpload
                    assignmentId={selectedAssignmentId}
                    onComplete={handleUpdateComplete}
                    onCancel={() => setSelectedAssignmentId(null)}
                />
            )}
        </div>
    )
}
