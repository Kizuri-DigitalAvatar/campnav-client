import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

// Send notification to all users with a specific role
export const sendRoleNotification = mutation({
    args: {
        role: v.string(),
        assignmentId: v.optional(v.id("tasks")),
        requestId: v.optional(v.id("requests")),
        type: v.string(), // "assignment", "reminder", "general"
        message: v.string(),
    },
    handler: async (ctx, args) => {
        // Find all users with this role
        const users = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", args.role))
            .collect();

        console.log(`[sendRoleNotification] Found ${users.length} users with role: ${args.role}`);
        if (users.length > 0) {
            console.log(`[sendRoleNotification] User emails: ${users.map(u => u.email).join(", ")}`);
        }

        const notifications = [];

        for (const user of users) {
            const prefs = user.notificationPreferences || { push: true, email: true, sms: true };

            if (prefs.push) {
                notifications.push(
                    ctx.db.insert("notifications", {
                        userId: user._id,
                        assignmentId: args.assignmentId,
                        requestId: args.requestId,
                        type: args.type,
                        channel: "push",
                        status: "pending",
                        message: args.message,
                    })
                );
            }

            if (prefs.email && user.email) {
                console.log(`Queueing email notification for: ${user.email}`);
                notifications.push(
                    ctx.db.insert("notifications", {
                        userId: user._id,
                        assignmentId: args.assignmentId,
                        requestId: args.requestId,
                        type: args.type,
                        channel: "email",
                        status: "pending",
                        message: args.message,
                    })
                );
            }

            if (prefs.sms && user.phoneNumber) {
                notifications.push(
                    ctx.db.insert("notifications", {
                        userId: user._id,
                        assignmentId: args.assignmentId,
                        requestId: args.requestId,
                        type: args.type,
                        channel: "sms",
                        status: "pending",
                        message: args.message,
                    })
                );
            }
        }

        await Promise.all(notifications);
    },
});

// Send notification for new assignment
export const sendAssignmentNotification = mutation({
    args: {
        userId: v.id("users"),
        assignmentId: v.id("tasks"),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const prefs = user.notificationPreferences || { push: true, email: true, sms: true };
        const notifications = [];

        // Create notification records for each enabled channel
        if (prefs.push) {
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: args.userId,
                    assignmentId: args.assignmentId,
                    type: "assignment",
                    channel: "push",
                    status: "pending",
                    message: args.message,
                })
            );
        }

        if (prefs.email && user.email) {
            console.log(`Queueing email notification for: ${user.email}`);
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: args.userId,
                    assignmentId: args.assignmentId,
                    type: "assignment",
                    channel: "email",
                    status: "pending",
                    message: args.message,
                })
            );
        }

        if (prefs.sms && user.phoneNumber) {
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: args.userId,
                    assignmentId: args.assignmentId,
                    type: "assignment",
                    channel: "sms",
                    status: "pending",
                    message: args.message,
                })
            );
        }

        await Promise.all(notifications);
    },
});

// Send reminder notification
export const sendReminderNotification = mutation({
    args: {
        userId: v.id("users"),
        assignmentId: v.id("tasks"),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const assignment = await ctx.db.get(args.assignmentId);
        if (!assignment) throw new Error("Assignment not found");

        const prefs = user.notificationPreferences || { push: true, email: true, sms: true };

        // Update assignment reminder tracking
        await ctx.db.patch(args.assignmentId, {
            lastReminderSent: Date.now(),
            reminderCount: (assignment.reminderCount || 0) + 1,
        });

        // Send notifications based on preferences
        const notifications = [];

        if (prefs.push) {
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: args.userId,
                    assignmentId: args.assignmentId,
                    type: "reminder",
                    channel: "push",
                    status: "pending",
                    message: args.message,
                })
            );
        }

        if (prefs.email && user.email) {
            console.log(`Queueing email notification for: ${user.email}`);
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: args.userId,
                    assignmentId: args.assignmentId,
                    type: "reminder",
                    channel: "email",
                    status: "pending",
                    message: args.message,
                })
            );
        }

        if (prefs.sms && user.phoneNumber) {
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: args.userId,
                    assignmentId: args.assignmentId,
                    type: "reminder",
                    channel: "sms",
                    status: "pending",
                    message: args.message,
                })
            );
        }

        await Promise.all(notifications);
    },
});

// Notify camper about task status update
export const sendCamperNotification = mutation({
    args: {
        userId: v.id("users"),
        assignmentId: v.optional(v.id("tasks")),
        requestId: v.optional(v.id("requests")),
        type: v.string(), // "acceptance", "completion", "escalation"
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const prefs = user.notificationPreferences || { push: true, email: true, sms: true };
        const notifications = [];

        if (prefs.push) {
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: args.userId,
                    assignmentId: args.assignmentId,
                    requestId: args.requestId,
                    type: args.type,
                    channel: "push",
                    status: "pending",
                    message: args.message,
                })
            );
        }

        if (prefs.email && user.email) {
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: args.userId,
                    assignmentId: args.assignmentId,
                    requestId: args.requestId,
                    type: args.type,
                    channel: "email",
                    status: "pending",
                    message: args.message,
                })
            );
        }

        await Promise.all(notifications);
    },
});

// Notify admin about unresponsive worker or request
export const notifyAdminUnresponsive = mutation({
    args: {
        assignmentId: v.optional(v.id("tasks")),
        requestId: v.optional(v.id("requests")),
        workerName: v.optional(v.string()),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        // Get all admin users
        const admins = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .collect();

        const notifications = [];

        for (const admin of admins) {
            // Send push and email to admins
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: admin._id,
                    assignmentId: args.assignmentId,
                    requestId: args.requestId,
                    type: "admin_alert",
                    channel: "push",
                    status: "pending",
                    message: args.message,
                })
            );

            if (admin.email) {
                notifications.push(
                    ctx.db.insert("notifications", {
                        userId: admin._id,
                        assignmentId: args.assignmentId,
                        requestId: args.requestId,
                        type: "admin_alert",
                        channel: "email",
                        status: "pending",
                        message: args.message,
                    })
                );
            }
        }

        await Promise.all(notifications);
    },
});

// Mark notification as delivered
export const markNotificationDelivered = mutation({
    args: {
        id: v.id("notifications"),
        status: v.string(), // "sent", "delivered", "failed"
    },
    handler: async (ctx, args) => {
        const update: any = { status: args.status };

        if (args.status === "sent") {
            update.sentAt = Date.now();
        } else if (args.status === "delivered") {
            update.deliveredAt = Date.now();
        }

        await ctx.db.patch(args.id, update);
    },
});

// Get notification history for an assignment
export const getNotificationHistory = query({
    args: { assignmentId: v.id("tasks") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("notifications")
            .withIndex("by_assignmentId", (q) => q.eq("assignmentId", args.assignmentId))
            .order("desc")
            .collect();
    },
});

// Get pending notifications for a specific user
export const getMyPendingNotifications = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("notifications")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();
    },
});

// Get unresponsive workers (assignments pending >5 min without acknowledgment)
export const getUnresponsiveWorkers = query({
    args: {},
    handler: async (ctx) => {
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

        const assignments = await ctx.db
            .query("tasks")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        const unresponsive = assignments.filter(
            (a) => a.assignedAt < tenMinutesAgo && !a.acknowledgedAt
        );

        return Promise.all(
            unresponsive.map(async (a) => {
                const worker = a.staffId ? await ctx.db.get(a.staffId) : null;
                // Double check if worker exists and has the expected fields
                // Convex ctx.db.get return value depends on the table schema
                const workerData = worker as any;
                return {
                    ...a,
                    workerName: workerData?.name || "Unassigned",
                    workerEmail: workerData?.email,
                };
            })
        );
    },
});

// Get pending notifications that need to be sent
export const getPendingNotifications = query({
    args: {},
    handler: async (ctx) => {
        const pending = await ctx.db
            .query("notifications")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        console.log(`[getPendingNotifications] Found ${pending.length} pending notifications in total`);

        return Promise.all(
            pending.map(async (n) => {
                const user = await ctx.db.get(n.userId);
                const userData = user as any;
                return {
                    ...n,
                    userEmail: userData?.email,
                    userPhone: userData?.phoneNumber,
                };
            })
        );
    },
});

// Internal mutation to mark notification as sent/failed
export const updateNotificationStatus = internalMutation({
    args: {
        id: v.id("notifications"),
        status: v.string(), // "sent", "failed"
        error: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: args.status,
            sentAt: args.status === "sent" ? Date.now() : undefined,
        });
    },
});

