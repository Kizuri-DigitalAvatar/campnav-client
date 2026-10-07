import { internalMutation } from "./_generated/server";
import { api } from "./_generated/api";

// Staff reminders for a task they haven't accepted, measured from when it was
// assigned to them (the first notification goes out at assignment itself):
// 10 min, 30 min, then hourly up to 4 h, then twice a day until accepted.
const REMINDER_SCHEDULE_MINUTES = [10, 30, 60, 120, 180, 240];
const LATE_REMINDER_INTERVAL_MS = 12 * 60 * 60 * 1000;
const MAX_REMINDERS_PER_STAFF_PER_DAY = 10;

function nextReminderDueAt(task: { assignedAt: number; reminderCount?: number; lastReminderSent?: number }) {
    const count = task.reminderCount || 0;
    if (count < REMINDER_SCHEDULE_MINUTES.length) {
        return task.assignedAt + REMINDER_SCHEDULE_MINUTES[count] * 60 * 1000;
    }
    return (task.lastReminderSent ?? task.assignedAt) + LATE_REMINDER_INTERVAL_MS;
}

// After sending, skip any scheduled steps that are already in the past (e.g. the
// cron was down) so one late run doesn't fire a burst of catch-up reminders
function nextReminderCount(assignedAt: number, now: number) {
    const elapsedMin = (now - assignedAt) / 60000;
    const passed = REMINDER_SCHEDULE_MINUTES.filter((m) => m <= elapsedMin).length;
    return passed;
}

function describeWait(ms: number) {
    const min = Math.round(ms / 60000);
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    return h < 24 ? `${h} hour${h === 1 ? "" : "s"}` : `${Math.floor(h / 24)} day${h < 48 ? "" : "s"}`;
}

// Internal function called by cron job to check for worker reminders
export const checkUnacknowledgedAssignments = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();

        const assignments = await ctx.db
            .query("tasks")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        const due = assignments.filter((a) =>
            a.staffId && !a.acknowledgedAt && nextReminderDueAt(a) <= now
        );

        for (const assignment of due) {
            const worker = await ctx.db.get(assignment.staffId!);
            if (!worker) continue;

            const reminderCount = assignment.reminderCount || 0;

            const startOfDay = new Date().setHours(0, 0, 0, 0);
            const dailyReminders = await ctx.db
                .query("notifications")
                .withIndex("by_userId", (q) => q.eq("userId", assignment.staffId!))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("type"), "reminder"),
                        q.eq(q.field("channel"), "push"),
                        q.gte(q.field("_creationTime"), startOfDay)
                    )
                )
                .collect();

            if (dailyReminders.length >= MAX_REMINDERS_PER_STAFF_PER_DAY) {
                console.log(`[checkUnacknowledgedAssignments] Skipping reminder for user ${worker.email}: daily limit reached (${dailyReminders.length})`);
                continue;
            }

            const waited = describeWait(now - assignment.assignedAt);
            await ctx.runMutation(api.notifications.sendReminderNotification, {
                userId: assignment.staffId!,
                assignmentId: assignment._id,
                message: `Reminder: Your ${assignment.serviceType.replace("_", " ")} task for Room ${assignment.roomNumber} has been waiting ${waited}. Please accept it.`,
            });

            // sendReminderNotification bumps reminderCount by one; jump past any missed steps
            const caughtUp = nextReminderCount(assignment.assignedAt, now);
            if (caughtUp > reminderCount + 1) {
                await ctx.db.patch(assignment._id, { reminderCount: caughtUp });
            }

            // Tell admins once, when the third reminder (1 hour) goes unanswered
            if (reminderCount === 2) {
                await ctx.runMutation(api.notifications.notifyAdminUnresponsive, {
                    assignmentId: assignment._id,
                    requestId: assignment.requestId,
                    workerName: worker.name,
                    message: `${worker.name} has not accepted the ${assignment.serviceType.replace("_", " ")} task for Room ${assignment.roomNumber} after ${waited} and 3 reminders.`,
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
