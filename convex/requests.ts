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

        // Create housekeeping/task assignment
        const assignmentId = await ctx.db.insert("housekeeping", {
            housekeeperId: assignedStaffId,
            requestId,
            roomNumber: args.roomNumber,
            serviceType: dutyType,
            status: assignedStaffId ? "pending" : "pending", // pending confirmation from staff
            assignedAt: Date.now(),
        });

        // If assigned to specific staff, update their currentTaskId
        if (assignedStaffId) {
            await ctx.db.patch(assignedStaffId, {
                currentTaskId: assignmentId,
            });
        }

        // Notify all camp-staff about the new task (vacant staff will see it on their board)
        // This matches the user's request to broadcast to all staff
        const displayType = args.type.charAt(0).toUpperCase() + args.type.slice(1).replace("_", " ");
        await ctx.runMutation(api.notifications.sendRoleNotification, {
            role: "camp-staff",
            assignmentId,
            requestId,
            type: "assignment",
            message: `New ${displayType} Request: ${args.roomNumber} - ${args.description}`,
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
        await ctx.db.delete(args.id);
    },
});

export const get = query({
    args: { id: v.id("requests") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});
