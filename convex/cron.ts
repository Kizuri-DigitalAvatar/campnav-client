import { internalMutation } from "./_generated/server";
import { api } from "./_generated/api";

// Internal function called by cron job to check for worker reminders
export const checkUnacknowledgedAssignments = internalMutation({
    args: {},
    handler: async (ctx) => {
        const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;

        // Get all pending assignments
        const assignments = await ctx.db
            .query("tasks")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        // Filter for those that haven't been acknowledged and haven't had a reminder recently
        const needReminder = assignments.filter((a) => {
            if (!a.staffId || a.acknowledgedAt) return false;

            // Initial reminder after 5 minutes
            const initialThreshold = Date.now() - 5 * 60 * 1000;
            if (a.assignedAt > initialThreshold) return false;

            // Subsequent reminders every 15 minutes
            if (a.lastReminderSent && a.lastReminderSent > fifteenMinutesAgo) return false;

            return true;
        });

        for (const assignment of needReminder) {
            if (!assignment.staffId) continue;

            const worker = await ctx.db.get(assignment.staffId);
            if (!worker) continue;

            const reminderCount = assignment.reminderCount || 0;

            // Send reminder to worker
            await ctx.runMutation(api.notifications.sendReminderNotification, {
                userId: assignment.staffId,
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

// Internal function to check for requests that have no staff response
export const checkUnrespondedRequests = internalMutation({
    args: {},
    handler: async (ctx) => {
        const startOfDay = new Date().setHours(0, 0, 0, 0);

        // Get all pending tasks (assignments)
        // A request is "unresponded" if no staff has confirmed it yet.
        const tasks = await ctx.db
            .query("tasks")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        for (const task of tasks) {
            // Only care about tasks linked to camper requests
            if (!task.requestId) continue;

            const request = await ctx.db.get(task.requestId);
            if (!request) continue;

            // Reset daily count if it's a new day
            let dailyCount = request.dailyNotificationCount || 0;
            if (request.lastDailyNotificationAt && request.lastDailyNotificationAt < startOfDay) {
                dailyCount = 0;
            }

            if (dailyCount >= 4) continue; // Max 4 per day

            const lastEscalation = task.lastEscalationSent || task.assignedAt;
            const timeSinceLastEscalation = Date.now() - lastEscalation;

            let shouldNotify = false;
            const escalationLevel = task.escalationLevel || 0;

            if (escalationLevel === 0) {
                // First notification after 1 hour
                if (Date.now() - task.assignedAt >= 60 * 60 * 1000) {
                    shouldNotify = true;
                }
            } else {
                // Subsequent notifications every 2 hours
                if (timeSinceLastEscalation >= 120 * 60 * 1000) {
                    shouldNotify = true;
                }
            }

            if (shouldNotify) {
                const message = `Alert: No staff has responded to the ${task.serviceType} request for ${task.roomNumber} after ${escalationLevel === 0 ? "1 hour" : (escalationLevel * 2 + 1) + " hours"}.`;

                // Notify Camper
                await ctx.runMutation(api.notifications.sendCamperNotification, {
                    userId: request.userId,
                    assignmentId: task._id,
                    requestId: request._id,
                    type: "escalation",
                    message,
                });

                // Notify Admin
                await ctx.runMutation(api.notifications.notifyAdminUnresponsive, {
                    assignmentId: task._id,
                    requestId: request._id,
                    message,
                });

                // Update counts
                await ctx.db.patch(task._id, {
                    lastEscalationSent: Date.now(),
                    escalationLevel: escalationLevel + 1,
                });

                await ctx.db.patch(request._id, {
                    dailyNotificationCount: dailyCount + 1,
                    lastDailyNotificationAt: Date.now(),
                });
            }
        }
    },
});
