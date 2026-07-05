"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "../../../convex/_generated/api"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"
import { TaskCard } from "@/components/task-card"
import { MultimediaUpload } from "@/components/multimedia-upload"
import { Inbox } from "lucide-react"
import { Id } from "../../../convex/_generated/dataModel"
import { Skeleton } from "@/components/ui/skeleton"

export default function AvailableTasksPage() {
    const { user, loading } = useAuth()
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<Id<"tasks"> | null>(null)

    const assignments = useQuery(
        api.tasks.getOpenTasks,
        user && isWorker(user.role) ? {} : "skip"
    )

    const acknowledgeAssignment = useMutation(api.tasks.acknowledgeAssignment)
    const startAssignment = useMutation(api.tasks.startAssignment)
    const completeAssignment = useMutation(api.tasks.completeTask)

    if (loading || (user && isWorker(user.role) && assignments === undefined)) {
        return (
            <div className="space-y-6 pb-20">
                <Skeleton className="h-10 w-56" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}
                </div>
            </div>
        )
    }

    if (!user || !isWorker(user.role)) {
        return (
            <div className="p-16 text-center text-muted-foreground text-sm">
                This page is only available to staff.
            </div>
        )
    }

    // Every pending request that no staff member has accepted yet.
    // Auto-assigned tasks stay claimable by anyone until someone responds.
    const availableTasks = assignments || []

    const handleClaim = async (id: Id<"tasks">) => {
        try {
            await acknowledgeAssignment({ id, staffId: user._id })
        } catch (err: any) {
            alert(err?.message?.split("Uncaught Error:").pop()?.trim() || "Could not take this task — it may already be taken.")
        }
    }

    return (
        <div className="space-y-6 pb-20">
            <header>
                <h1 className="text-2xl font-black tracking-tight uppercase">Available Tasks</h1>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">
                    {availableTasks.length} open · accept one to make it yours
                </p>
            </header>

            {availableTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableTasks.map((task: any) => (
                        <TaskCard
                            key={task._id}
                            assignment={task}
                            onAcknowledge={handleClaim}
                            onStart={async (id) => { await startAssignment({ id }) }}
                            onAddUpdate={(id) => setSelectedAssignmentId(id)}
                            onComplete={async (id) => { await completeAssignment({ id }) }}
                        />
                    ))}
                </div>
            ) : (
                <div className="p-24 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
                    <div className="inline-flex p-6 rounded-3xl bg-muted mb-6">
                        <Inbox className="w-12 h-12 opacity-10" />
                    </div>
                    <p className="text-muted-foreground/40 font-bold text-sm tracking-widest uppercase italic">
                        No open tasks right now
                    </p>
                </div>
            )}

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
