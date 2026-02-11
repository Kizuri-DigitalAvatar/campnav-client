import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const assign = mutation({
    args: {
        housekeeperId: v.id("users"),
        roomNumber: v.string(),
        serviceType: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("housekeeping", {
            housekeeperId: args.housekeeperId,
            roomNumber: args.roomNumber,
            serviceType: args.serviceType,
            status: "pending",
            assignedAt: Date.now(),
        });
    },
});

export const updateStatus = mutation({
    args: { id: v.id("housekeeping"), status: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: args.status });
    },
});

export const remove = mutation({
    args: { id: v.id("housekeeping") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        const assignments = await ctx.db.query("housekeeping").order("desc").collect();
        return Promise.all(
            assignments.map(async (a) => {
                let housekeeperName = "Unknown";
                if (a.housekeeperId) {
                    try {
                        const housekeeper = await ctx.db.get(a.housekeeperId);
                        if (housekeeper) {
                            housekeeperName = housekeeper.name;
                        }
                    } catch (e) {
                        console.error("Failed to fetch housekeeper", a._id, a.housekeeperId, e);
                    }
                }
                // Get associated request details if any
                let requestDetails = null;
                if (a.requestId) {
                    const req = await ctx.db.get(a.requestId);
                    if (req) {
                        requestDetails = {
                            description: req.description,
                            priority: req.priority,
                        };
                    }
                }

                return { ...a, housekeeperName, requestDetails };
            })
        );
    },
});

// Get assignments for a specific worker
export const getWorkerAssignments = query({
    args: { workerId: v.id("users") },
    handler: async (ctx, args) => {
        // Get tasks assigned explicitly to this worker
        const assignedTasks = await ctx.db
            .query("housekeeping")
            .withIndex("by_housekeeperId", (q) => q.eq("housekeeperId", args.workerId))
            .collect();

        // Also get unassigned tasks that are pending
        // Since we don't have a specific index for housekeeperId === null, 
        // we'll query by status "pending" and filter.
        const unassignedTasks = await ctx.db
            .query("housekeeping")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        const filteredUnassigned = unassignedTasks.filter(t => !t.housekeeperId);

        // Combine and sort by assignedAt
        const allTasks = [...assignedTasks, ...filteredUnassigned].sort((a, b) => b.assignedAt - a.assignedAt);

        return Promise.all(
            allTasks.map(async (a) => {
                // Get image URLs for updates
                const updatesWithUrls = await Promise.all(
                    (a.updates || []).map(async (update) => {
                        const imageUrls = await Promise.all(
                            (update.images || []).map(async (storageId) => {
                                try {
                                    return await ctx.storage.getUrl(storageId);
                                } catch (e) {
                                    return null;
                                }
                            })
                        );

                        let audioUrl = null;
                        if (update.audio) {
                            try {
                                audioUrl = await ctx.storage.getUrl(update.audio);
                            } catch (e) {
                                audioUrl = null;
                            }
                        }

                        return {
                            ...update,
                            imageUrls: imageUrls.filter(url => url !== null),
                            audioUrl,
                        };
                    })
                );

                // Get associated request details if any
                let requestDetails = null;
                if (a.requestId) {
                    const req = await ctx.db.get(a.requestId);
                    if (req) {
                        let imageUrl = null;
                        if (req.image) {
                            try {
                                imageUrl = await ctx.storage.getUrl(req.image);
                            } catch (e) {
                                imageUrl = null;
                            }
                        }
                        requestDetails = {
                            description: req.description,
                            priority: req.priority,
                            imageUrl
                        };
                    }
                }

                return { ...a, updatesWithUrls, requestDetails };
            })
        );
    },
});

// Worker acknowledges assignment or picks up unassigned task
export const acknowledgeAssignment = mutation({
    args: { id: v.id("housekeeping"), housekeeperId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        const patch: any = {
            status: "acknowledged",
            acknowledgedAt: Date.now(),
        };
        if (args.housekeeperId) {
            patch.housekeeperId = args.housekeeperId;
        }
        await ctx.db.patch(args.id, patch);
    },
});

// Worker starts assignment
export const startAssignment = mutation({
    args: { id: v.id("housekeeping") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: "in_progress",
            startedAt: Date.now(),
        });
    },
});

// Worker adds update with multimedia
export const addUpdate = mutation({
    args: {
        id: v.id("housekeeping"),
        text: v.optional(v.string()),
        images: v.optional(v.array(v.string())), // Storage IDs
        audio: v.optional(v.string()), // Storage ID
    },
    handler: async (ctx, args) => {
        const assignment = await ctx.db.get(args.id);
        if (!assignment) throw new Error("Assignment not found");

        const newUpdate = {
            timestamp: Date.now(),
            text: args.text,
            images: args.images,
            audio: args.audio,
        };

        const updates = assignment.updates || [];
        updates.push(newUpdate);

        await ctx.db.patch(args.id, { updates });
    },
});

// Camp-staff confirms they accept the task
export const confirmTask = mutation({
    args: { id: v.id("housekeeping"), staffId: v.id("users") },
    handler: async (ctx, args) => {
        const assignment = await ctx.db.get(args.id);
        if (!assignment) throw new Error("Assignment not found");

        await ctx.db.patch(args.id, {
            status: "confirmed",
            staffConfirmedAt: Date.now(),
        });

        // Update staff's currentTaskId to mark them as busy
        await ctx.db.patch(args.staffId, {
            currentTaskId: args.id,
        });
    },
});

// Camp-staff marks task as completed
export const completeTask = mutation({
    args: { id: v.id("housekeeping") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: "completed",
            completedAt: Date.now(),
        });
    },
});

// Camper confirms completion
export const camperConfirmCompletion = mutation({
    args: { id: v.id("housekeeping") },
    handler: async (ctx, args) => {
        const assignment = await ctx.db.get(args.id);
        if (!assignment) throw new Error("Assignment not found");

        await ctx.db.patch(args.id, {
            camperConfirmedAt: Date.now(),
        });

        // Free up the staff member
        if (assignment.housekeeperId) {
            await ctx.db.patch(assignment.housekeeperId, {
                currentTaskId: undefined,
            });
        }

        // Update associated request status
        if (assignment.requestId) {
            await ctx.db.patch(assignment.requestId, {
                status: "completed",
            });
        }
    },
});

// Camper rates the completed task
export const rateTask = mutation({
    args: {
        id: v.id("housekeeping"),
        rating: v.number(), // 1-5
        feedback: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const assignment = await ctx.db.get(args.id);
        if (!assignment) throw new Error("Assignment not found");
        if (!assignment.camperConfirmedAt) {
            throw new Error("Task must be confirmed by camper before rating");
        }

        await ctx.db.patch(args.id, {
            rating: args.rating,
            feedback: args.feedback,
            status: "rated",
        });
    },
});

// Get average rating for a camp-staff member
export const getStaffRating = query({
    args: { staffId: v.id("users") },
    handler: async (ctx, args) => {
        const tasks = await ctx.db
            .query("housekeeping")
            .withIndex("by_housekeeperId", (q) => q.eq("housekeeperId", args.staffId))
            .collect();

        const ratedTasks = tasks.filter(t => t.rating !== undefined);
        if (ratedTasks.length === 0) {
            return { averageRating: 0, totalRatings: 0 };
        }

        const sum = ratedTasks.reduce((acc, t) => acc + (t.rating || 0), 0);
        const averageRating = sum / ratedTasks.length;

        return {
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            totalRatings: ratedTasks.length,
        };
    },
});
