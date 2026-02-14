import { internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Internal function called by cron job
export const checkUnacknowledgedAssignments = internalMutation({
    args: {},
    handler: async (ctx) => {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

        // Get all pending assignments older than 5 minutes
        const assignments = await ctx.db
            .query("housekeeping")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        const unacknowledged = assignments.filter(
            (a) => a.assignedAt < fiveMinutesAgo && !a.acknowledgedAt
        );

        for (const assignment of unacknowledged) {
            if (!assignment.housekeeperId) continue;

            const worker = await ctx.db.get(assignment.housekeeperId);
            if (!worker) continue;

            const reminderCount = assignment.reminderCount || 0;

            // Send reminder to worker
            await ctx.runMutation(api.notifications.sendReminderNotification, {
                userId: assignment.housekeeperId,
                assignmentId: assignment._id,
                message: `Reminder: You have a pending ${assignment.serviceType} assignment for ${assignment.roomNumber}. Please acknowledge.`,
            });

            // If this is the 3rd reminder or more, notify admin
            if (reminderCount >= 2) {
                await ctx.runMutation(api.notifications.notifyAdminUnresponsive, {
                    assignmentId: assignment._id,
                    workerName: worker.name,
                    message: `Worker ${worker.name} has not responded to assignment for ${assignment.roomNumber} after ${reminderCount + 1} reminders.`,
                });
            }
        }
    },
});
