import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const create = mutation({
    args: {
        userId: v.id("users"),
        type: v.string(),
        roomNumber: v.string(),
        description: v.string(),
        priority: v.string(),
        image: v.optional(v.string()),
        
        // New fields
        category: v.optional(v.string()),
        subCategory: v.optional(v.string()),
        applianceModel: v.optional(v.string()),
        accessPreference: v.optional(v.string()),
        laundryItems: v.optional(v.array(v.object({
            name: v.string(),
            quantity: v.number(),
            type: v.string(),
        }))),
        starch: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (user) {
            await ctx.db.patch(args.userId, {
                points: (user.points ?? 0) + 50
            });
        }

        const requestId = await ctx.db.insert("requests", {
            ...args,
            status: "pending",
            createdAt: Date.now(),
        });

        // Map request types to duty types
        const typeDutyMap: Record<string, string> = {
            "housekeeping": "housekeeping",
            "maintenance": "maintenance",
            "laundry": "laundry",
            "room_service": "room_service",
            "delivery": "delivery"
        };

        const dutyType = typeDutyMap[args.type.toLowerCase()] || args.type.toLowerCase();

        // Find vacant camp-staff with matching duty
        const allStaff = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "camp-staff"))
            .collect();

        // Filter staff who have this duty assigned and are currently vacant
        const availableStaff = allStaff.filter(staff => {
            const duties = staff.assignedDuties || [];
            const hasMatchingDuty = duties.includes(dutyType);
            const isVacant = !staff.currentTaskId; // No current task means vacant
            return hasMatchingDuty && isVacant;
        });

        let assignedStaffId: any = undefined;

        // If we have available staff, assign to the first one
        if (availableStaff.length > 0) {
            assignedStaffId = availableStaff[0]._id;
        }

        // Create task assignment
        const taskId = await ctx.db.insert("tasks", {
            staffId: assignedStaffId,
            requestId,
            roomNumber: args.roomNumber,
            serviceType: dutyType,
            status: assignedStaffId ? "pending" : "pending", // pending confirmation from staff
            assignedAt: Date.now(),
        });

        // If assigned to specific staff, update their currentTaskId
        if (assignedStaffId) {
            await ctx.db.patch(assignedStaffId, {
                currentTaskId: taskId,
            });
        }

        // Notify all camp-staff about the new task (vacant staff will see it on their board)
        // This matches the user's request to broadcast to all staff
        const displayType = args.type.charAt(0).toUpperCase() + args.type.slice(1).replace("_", " ");
        await ctx.runMutation(api.notifications.sendRoleNotification, {
            role: "camp-staff",
            assignmentId: taskId,
            requestId,
            type: "assignment",
            message: `New ${displayType} Request: ${args.roomNumber} - ${args.category ? `[${args.category}${args.subCategory ? ` / ${args.subCategory}` : ""}] ` : ""}${args.description}`,
        });

        // Trigger email processing immediately (don't wait for cron)
        await ctx.scheduler.runAfter(0, internal.email.processEmailNotifications, {});

        return requestId;
    },
});

export const listForUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const requests = await ctx.db
            .query("requests")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();

        return Promise.all(
            requests.map(async (r) => {
                let imageUrl = null;
                if (r.image) {
                    try {
                        imageUrl = await ctx.storage.getUrl(r.image);
                    } catch (e) {
                        imageUrl = null;
                    }
                }
                return { ...r, imageUrl };
            })
        );
    },
});

export const list = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const baseQuery = args.status && args.status !== "all"
            ? ctx.db.query("requests").withIndex("by_status", (q) => q.eq("status", args.status!))
            : ctx.db.query("requests");

        const requests = await baseQuery.order("desc").collect();

        return Promise.all(
            requests.map(async (r) => {
                let userName = "Unknown";
                const user = await ctx.db.get(r.userId);
                if (user) userName = user.name;

                let imageUrl = null;
                if (r.image) {
                    try {
                        imageUrl = await ctx.storage.getUrl(r.image);
                    } catch (e) {
                        imageUrl = null;
                    }
                }
                return { ...r, userName, imageUrl };
            })
        );
    },
});

export const updateStatus = mutation({
    args: { id: v.id("requests"), status: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: args.status });
    },
});

export const remove = mutation({
    args: { id: v.id("requests") },
    handler: async (ctx, args) => {
        // 1. Find and cleanup all associated housekeeping assignments
        const assignments = await ctx.db
            .query("tasks")
            .withIndex("by_requestId", (q) => q.eq("requestId", args.id))
            .collect();

        for (const assignment of assignments) {
            // If assigned to a staff, clear their currentTaskId
            if (assignment.staffId) {
                const staff = await ctx.db.get(assignment.staffId);
                if (staff && staff.currentTaskId === assignment._id) {
                    await ctx.db.patch(assignment.staffId, {
                        currentTaskId: undefined,
                    });
                }
            }
            await ctx.db.delete(assignment._id);
        }

        // 2. Cleanup all associated notifications
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_requestId", (q) => q.eq("requestId", args.id))
            .collect();

        for (const notification of notifications) {
            await ctx.db.delete(notification._id);
        }

        // 3. Delete the request itself
        await ctx.db.delete(args.id);
    },
});

export const cancel = mutation({
    args: { id: v.id("requests") },
    handler: async (ctx, args) => {
        const request = await ctx.db.get(args.id);
        if (!request) throw new Error("Request not found");

        // Update request status
        await ctx.db.patch(args.id, { status: "cancelled" });

        // Find associated task
        const task = await ctx.db
            .query("tasks")
            .withIndex("by_requestId", (q) => q.eq("requestId", args.id))
            .first();

        if (task) {
            // Update task status
            await ctx.db.patch(task._id, { status: "cancelled" });

            // Free up assigned staff
            if (task.staffId) {
                const staff = await ctx.db.get(task.staffId);
                if (staff && staff.currentTaskId === task._id) {
                    await ctx.db.patch(task.staffId, {
                        currentTaskId: undefined,
                    });
                }
            }
        }
    },
});

export const get = query({
    args: { id: v.id("requests") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getWithTaskDetails = query({
    args: { id: v.id("requests") },
    handler: async (ctx, args) => {
        const request = await ctx.db.get(args.id);
        if (!request) return null;

        // Get associated task
        const task = await ctx.db
            .query("tasks")
            .withIndex("by_requestId", (q) => q.eq("requestId", args.id))
            .unique();

        let taskDetails = null;
        if (task) {
            let staffName = "Unassigned";
            if (task.staffId) {
                const staff = await ctx.db.get(task.staffId);
                if (staff) staffName = staff.name;
            }

            // Get names of people who viewed it
            const viewers = await Promise.all(
                (task.viewedBy || []).map(async (id) => {
                    const u = await ctx.db.get(id);
                    return u?.name || "Unknown Staff";
                })
            );

            // Get image URLs for updates
            const updatesWithUrls = await Promise.all(
                (task.updates || []).map(async (update) => {
                    const imageUrls = await Promise.all(
                        (update.images || []).map(async (id) => {
                            try { return await ctx.storage.getUrl(id); } catch (e) { return null; }
                        })
                    );
                    let audioUrl = null;
                    if (update.audio) {
                        try { audioUrl = await ctx.storage.getUrl(update.audio); } catch (e) { }
                    }
                    return { ...update, imageUrls: imageUrls.filter(Boolean), audioUrl };
                })
            );

            taskDetails = {
                ...task,
                staffName,
                viewers,
                updatesWithUrls,
            };
        }

        let imageUrl = null;
        if (request.image) {
            try { imageUrl = await ctx.storage.getUrl(request.image); } catch (e) { }
        }

        return { ...request, imageUrl, taskDetails };
    },
});
