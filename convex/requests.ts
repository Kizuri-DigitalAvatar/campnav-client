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
        staffId: v.optional(v.id("users")),
        
        // New fields
        category: v.optional(v.string()),
        subCategory: v.optional(v.string()),
        applianceModel: v.optional(v.string()),
        dateNoticed: v.optional(v.string()),
        specialAttention: v.optional(v.boolean()),
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

        let assignedStaffId: any = args.staffId;
        let noVacantStaff = false;

        // If no staff explicitly chosen, pick from vacant staff (no active task)
        if (!assignedStaffId) {
            const allStaff = (await Promise.all(
                ["camp-staff", "staff"].map((role) =>
                    ctx.db
                        .query("users")
                        .withIndex("by_role", (q) => q.eq("role", role))
                        .collect()
                )
            )).flat();

            const vacantStaff = allStaff.filter((staff) => !staff.currentTaskId);
            // Prefer vacant staff whose duties match the request type
            const dutyMatched = vacantStaff.filter((staff) =>
                (staff.assignedDuties || []).includes(dutyType)
            );

            if (dutyMatched.length > 0) {
                assignedStaffId = dutyMatched[0]._id;
            } else if (vacantStaff.length > 0) {
                assignedStaffId = vacantStaff[0]._id;
            } else {
                // Nobody is free — admins must assign manually
                noVacantStaff = true;
            }
        }

        // Create tasks/assignment
        const assignmentId = await ctx.db.insert("tasks", {
            staffId: assignedStaffId,
            requestId,
            roomNumber: args.roomNumber,
            serviceType: dutyType,
            description: args.description,
            priority: args.priority,
            category: args.category,
            subCategory: args.subCategory,
            applianceModel: args.applianceModel,
            accessPreference: args.accessPreference,
            image: args.image,
            status: "pending", // pending confirmation from staff
            assignedAt: Date.now(),
        });

        // If assigned to specific staff, update their currentTaskId
        if (assignedStaffId) {
            await ctx.db.patch(assignedStaffId, {
                currentTaskId: assignmentId,
            });
        }

        // Notify all camp-staff about the new task (vacant staff will see it on their board)
        const displayType = args.type.charAt(0).toUpperCase() + args.type.slice(1).replace("_", " ");
        await ctx.runMutation(api.notifications.sendRoleNotification, {
            role: "camp-staff",
            assignmentId,
            requestId,
            type: "assignment",
            message: `New ${displayType} Request: ${args.roomNumber} - ${args.category ? `[${args.category}${args.subCategory ? ` / ${args.subCategory}` : ""}] ` : ""}${args.description}`,
        });

        // No vacant staff — alert admins so they can assign someone manually
        if (noVacantStaff) {
            await ctx.runMutation(api.notifications.sendRoleNotification, {
                role: "admin",
                assignmentId,
                requestId,
                type: "admin_alert",
                message: `⚠️ No vacant staff for ${displayType} request (Room ${args.roomNumber}): "${args.description}". Please assign a staff member manually.`,
            });
        }

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

export const updateOfficeUse = mutation({
    args: {
        id: v.id("requests"),
        urgency: v.optional(v.string()),
        tradesperson: v.optional(v.string()),
        workOrderSent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...officeUseFields } = args;
        const request = await ctx.db.get(id);
        if (!request) throw new Error("Request not found");

        await ctx.db.patch(id, {
            officeUse: {
                ...(request.officeUse || {}),
                ...officeUseFields,
            },
            // If urgency is set, also update the main priority field for compatibility
            ...(args.urgency ? { priority: args.urgency } : {}),
        });
    },
});
