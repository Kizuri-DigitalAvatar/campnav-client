import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Full task view for a request: assigned staff, stage timestamps, updates, feedback
export const getByRequest = query({
    args: { requestId: v.id("requests") },
    handler: async (ctx, args) => {
        const tasks = await ctx.db.query("tasks").collect();
        const task = tasks.find((t) => t.requestId === args.requestId);
        if (!task) return null;

        const resolveUrl = async (storageId?: string) => {
            if (!storageId) return null;
            try {
                return await ctx.storage.getUrl(storageId);
            } catch {
                return null;
            }
        };

        let staff = null;
        if (task.staffId) {
            const s = await ctx.db.get(task.staffId);
            if (s) {
                staff = {
                    _id: s._id,
                    name: s.name,
                    imageUrl: s.image
                        ? (s.image.startsWith("http") ? s.image : await resolveUrl(s.image))
                        : null,
                    department: s.department,
                    assignedDuties: s.assignedDuties || [],
                    isOnSite: s.isOnSite || false,
                };
            }
        }

        const updates = await Promise.all(
            (task.updates || []).map(async (update) => ({
                ...update,
                imageUrls: (await Promise.all((update.images || []).map(resolveUrl))).filter(Boolean),
                audioUrl: await resolveUrl(update.audio),
            }))
        );

        return { ...task, staff, updates };
    },
});

// Assign a staff member to an existing request's task
export const assignStaffToRequest = mutation({
    args: {
        requestId: v.id("requests"),
        staffId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const request = await ctx.db.get(args.requestId);
        if (!request) throw new Error("Request not found");

        const tasks = await ctx.db.query("tasks").collect();
        const existingTask = tasks.find(t => t.requestId === args.requestId);

        let taskId: any;

        if (existingTask) {
            if (existingTask.staffId && existingTask.staffId !== args.staffId) {
                const prev = await ctx.db.get(existingTask.staffId);
                if (prev?.currentTaskId === existingTask._id) {
                    await ctx.db.patch(existingTask.staffId, { currentTaskId: undefined });
                }
            }
            await ctx.db.patch(existingTask._id, { staffId: args.staffId, status: "pending" });
            await ctx.db.patch(args.staffId, { currentTaskId: existingTask._id });
            taskId = existingTask._id;
        } else {
            taskId = await ctx.db.insert("tasks", {
                staffId: args.staffId,
                requestId: args.requestId,
                roomNumber: request.roomNumber,
                serviceType: request.type,
                description: request.description,
                priority: request.priority,
                status: "pending",
                assignedAt: Date.now(),
            });
            await ctx.db.patch(args.staffId, { currentTaskId: taskId });
        }

        await ctx.db.patch(args.requestId, { status: "in_progress" });

        const serviceLabel = request.type.replace("_", " ");
        const staff = await ctx.db.get(args.staffId);

        // Notify the assigned staff member
        await ctx.runMutation(api.notifications.sendAssignmentNotification, {
            userId: args.staffId,
            assignmentId: taskId,
            message: `New ${serviceLabel} task assigned — Room ${request.roomNumber}: ${request.description}`,
        });

        // Notify the resident that their request is now in progress
        const resident = await ctx.db.get(request.userId);
        if (resident) {
            const prefs = resident.notificationPreferences ?? { push: true, email: true, sms: false };
            const residentMsg = `Your ${serviceLabel} request for ${request.roomNumber} has been assigned to ${staff?.name ?? "a staff member"} and is now in progress.`;
            const inserts = [];
            if (prefs.push) {
                inserts.push(ctx.db.insert("notifications", {
                    userId: request.userId,
                    assignmentId: taskId,
                    requestId: args.requestId,
                    type: "assignment",
                    channel: "push",
                    status: "pending",
                    message: residentMsg,
                }));
            }
            if (prefs.email && resident.email) {
                inserts.push(ctx.db.insert("notifications", {
                    userId: request.userId,
                    assignmentId: taskId,
                    requestId: args.requestId,
                    type: "assignment",
                    channel: "email",
                    status: "pending",
                    message: residentMsg,
                }));
            }
            await Promise.all(inserts);
        }

        // Trigger email processing immediately
        await ctx.scheduler.runAfter(0, api.notifications.processEmailNotifications, {});
    },
});

export const assign = mutation({
    args: {
        staffId: v.id("users"),
        roomNumber: v.string(),
        serviceType: v.string(),
        description: v.optional(v.string()),
        priority: v.optional(v.string()),
        category: v.optional(v.string()),
        subCategory: v.optional(v.string()),
        applianceModel: v.optional(v.string()),
        accessPreference: v.optional(v.string()),
        image: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("tasks", {
            staffId: args.staffId,
            roomNumber: args.roomNumber,
            serviceType: args.serviceType,
            description: args.description,
            priority: args.priority,
            category: args.category,
            subCategory: args.subCategory,
            applianceModel: args.applianceModel,
            accessPreference: args.accessPreference,
            image: args.image,
            status: "pending",
            assignedAt: Date.now(),
        });
    },
});

export const updateStatus = mutation({
    args: { id: v.id("tasks"), status: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: args.status });
    },
});

export const remove = mutation({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        const assignment = await ctx.db.get(args.id);
        if (!assignment) return;

        // 1. If assigned to a staff, clear their currentTaskId
        if (assignment.staffId) {
            const staff = await ctx.db.get(assignment.staffId);
            if (staff && staff.currentTaskId === assignment._id) {
                await ctx.db.patch(assignment.staffId, {
                    currentTaskId: undefined,
                });
            }
        }

        // 2. Cleanup associated notifications
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_assignmentId", (q) => q.eq("assignmentId", args.id))
            .collect();

        for (const notification of notifications) {
            await ctx.db.delete(notification._id);
        }

        // 3. Delete the assignment
        await ctx.db.delete(args.id);
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        const assignments = await ctx.db.query("tasks").order("desc").collect();
        return Promise.all(
            assignments.map(async (a) => {
                let staffName = "Unknown";
                if (a.staffId) {
                    try {
                        const staff = await ctx.db.get(a.staffId);
                        if (staff) {
                            staffName = staff.name;
                        }
                    } catch (e) {
                        console.error("Failed to fetch staff member", a._id, a.staffId, e);
                    }
                }
                // Get associated request details if any
                let requestDetails = null;
                if (a.requestId) {
                    const req = await ctx.db.get(a.requestId);
                    if (req) {
                        let imageUrl = null;
                        if (req.image) {
                            try { imageUrl = await ctx.storage.getUrl(req.image); } catch (e) { }
                        }
                        requestDetails = {
                            description: req.description,
                            priority: req.priority,
                            imageUrl,
                            category: req.category,
                            subCategory: req.subCategory,
                            accessPreference: req.accessPreference,
                            applianceModel: req.applianceModel,
                        };
                    }
                } else {
                    // Use fields on the assignment itself (manual admin-created task)
                    let imageUrl = null;
                    if (a.image) {
                        try { imageUrl = await ctx.storage.getUrl(a.image); } catch (e) { }
                    }
                    requestDetails = {
                        description: a.description,
                        priority: a.priority,
                        imageUrl,
                        category: a.category,
                        subCategory: a.subCategory,
                        accessPreference: a.accessPreference,
                        applianceModel: a.applianceModel,
                    };
                }

                return { ...a, staffName, requestDetails };
            })
        );
    },
});

// Record that a staff member has viewed an unassigned/pending task
export const recordView = mutation({
    args: { id: v.id("tasks"), staffId: v.id("users") },
    handler: async (ctx, args) => {
        const task = await ctx.db.get(args.id);
        if (!task) return;

        // Only record views for pending tasks
        if (task.status !== "pending") return;

        const viewedBy = task.viewedBy || [];
        if (!viewedBy.includes(args.staffId)) {
            viewedBy.push(args.staffId);
            await ctx.db.patch(args.id, { viewedBy });
        }
    },
});

// Get a single task by ID with full details
export const getById = query({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        const task = await ctx.db.get(args.id);
        if (!task) return null;

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

        let requestDetails = null;
        if (task.requestId) {
            const req = await ctx.db.get(task.requestId);
            if (req) {
                let imageUrl = null;
                if (req.image) {
                    try { imageUrl = await ctx.storage.getUrl(req.image); } catch (e) { }
                }
                requestDetails = { ...req, imageUrl };
            }
        }

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

        return { ...task, staffName, viewers, requestDetails, updatesWithUrls };
    },
});

// Get assignments for a specific worker
export const getWorkerAssignments = query({
    args: { workerId: v.id("users") },
    handler: async (ctx, args) => {
        // Get tasks assigned explicitly to this worker
        const assignedTasks = await ctx.db
            .query("tasks")
            .withIndex("by_staffId", (q) => q.eq("staffId", args.workerId))
            .collect();

        // Also get unassigned tasks that are pending
        const unassignedTasks = await ctx.db
            .query("tasks")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        const filteredUnassigned = unassignedTasks.filter(t => !t.staffId);

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
// Notify the resident/guest who made the request about a task status change
async function notifyRequester(
    ctx: any,
    task: any,
    taskId: any,
    type: string,
    message: string
) {
    if (!task?.requestId) return;
    const request = await ctx.db.get(task.requestId);
    if (!request?.userId) return;
    await ctx.db.insert("notifications", {
        userId: request.userId,
        assignmentId: taskId,
        requestId: task.requestId,
        type,
        channel: "push",
        status: "pending",
        message,
    });
}

function taskLabel(task: any) {
    const service = (task?.serviceType || "service").replace("_", " ");
    return `your ${service} request${task?.roomNumber ? ` (Room ${task.roomNumber})` : ""}`;
}

export const acknowledgeAssignment = mutation({
    args: { id: v.id("tasks"), staffId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Task not found");
        // Prevent two staff members claiming the same open task
        if (args.staffId && existing.staffId && existing.staffId !== args.staffId) {
            throw new Error("This task has already been taken by another staff member");
        }
        const patch: any = {
            status: "acknowledged",
            acknowledgedAt: Date.now(),
        };
        if (args.staffId) {
            patch.staffId = args.staffId;
            // Mark staff as busy
            await ctx.db.patch(args.staffId, {
                currentTaskId: args.id,
            });
        }
        await ctx.db.patch(args.id, patch);

        // Update associated request status to in_progress
        const assignment = await ctx.db.get(args.id);
        if (assignment?.requestId) {
            await ctx.db.patch(assignment.requestId, { status: "in_progress" });
        }

        // Let the requester know their request was accepted
        const staffId = args.staffId || assignment?.staffId;
        const staff = staffId ? await ctx.db.get(staffId) : null;
        await notifyRequester(
            ctx,
            assignment,
            args.id,
            "acceptance",
            `✅ ${(staff as any)?.name || "A staff member"} accepted ${taskLabel(assignment)}.`
        );
    },
});

// Worker starts assignment
export const startAssignment = mutation({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        const task = await ctx.db.get(args.id);
        await ctx.db.patch(args.id, {
            status: "in_progress",
            startedAt: Date.now(),
        });
        if (task?.requestId) {
            await ctx.db.patch(task.requestId, { status: "in_progress" });
        }

        // Let the requester know work has started
        const staff = task?.staffId ? await ctx.db.get(task.staffId) : null;
        await notifyRequester(
            ctx,
            task,
            args.id,
            "progress",
            `🔧 ${(staff as any)?.name || "A staff member"} started working on ${taskLabel(task)}.`
        );
    },
});

// Worker adds update with multimedia
export const addUpdate = mutation({
    args: {
        id: v.id("tasks"),
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

        // Let the requester know the staff member posted an update
        const staff = assignment.staffId ? await ctx.db.get(assignment.staffId) : null;
        const attachments = [
            args.images?.length ? `${args.images.length} photo${args.images.length > 1 ? "s" : ""}` : null,
            args.audio ? "a voice note" : null,
        ].filter(Boolean).join(" and ");
        const detail = args.text?.trim()
            ? `: "${args.text.trim().slice(0, 140)}${args.text.trim().length > 140 ? "..." : ""}"`
            : attachments ? ` with ${attachments}` : "";
        await notifyRequester(
            ctx,
            assignment,
            args.id,
            "update",
            `💬 ${(staff as any)?.name || "A staff member"} posted an update on ${taskLabel(assignment)}${detail}`
        );
    },
});

// Camp-staff confirms they accept the task
export const confirmTask = mutation({
    args: { id: v.id("tasks"), staffId: v.id("users") },
    handler: async (ctx, args) => {
        const assignment = await ctx.db.get(args.id);
        if (!assignment) throw new Error("Assignment not found");

        await ctx.db.patch(args.id, {
            status: "confirmed",
            staffConfirmedAt: Date.now(),
        });

        // Update associated request status to in_progress
        if (assignment.requestId) {
            await ctx.db.patch(assignment.requestId, { status: "in_progress" });
        }

        // Update staff's currentTaskId to mark them as busy
        await ctx.db.patch(args.staffId, {
            currentTaskId: args.id,
        });

        // Notify camper that the worker has accepted
        if (assignment.requestId) {
            const request = await ctx.db.get(assignment.requestId);
            if (request) {
                const staff = await ctx.db.get(args.staffId);
                await ctx.db.insert("notifications", {
                    userId: request.userId,
                    assignmentId: args.id,
                    requestId: assignment.requestId,
                    type: "acceptance",
                    channel: "push",
                    status: "pending",
                    message: `${staff?.name || "A worker"} has accepted your request for ${assignment.roomNumber}.`,
                });
            }
        }
    },
});

// Camp-staff marks task as completed
export const completeTask = mutation({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        const assignment = await ctx.db.get(args.id);
        if (!assignment) throw new Error("Assignment not found");

        await ctx.db.patch(args.id, {
            status: "completed",
            completedAt: Date.now(),
        });

        // Update associated request status
        if (assignment.requestId) {
            await ctx.db.patch(assignment.requestId, {
                status: "completed",
            });
        }

        // Free up the staff member so they can take new tasks
        if (assignment.staffId) {
            await ctx.db.patch(assignment.staffId, {
                currentTaskId: undefined,
            });
        }

        // Notify camper that the task is completed
        if (assignment.requestId) {
            const request = await ctx.db.get(assignment.requestId);
            if (request) {
                await ctx.db.insert("notifications", {
                    userId: request.userId,
                    assignmentId: args.id,
                    requestId: assignment.requestId,
                    type: "completion",
                    channel: "push",
                    status: "pending",
                    message: `Your request for ${assignment.roomNumber} has been completed.`,
                });
            }
        }
    },
});

// Camper confirms completion
export const camperConfirmCompletion = mutation({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        const assignment = await ctx.db.get(args.id);
        if (!assignment) throw new Error("Assignment not found");

        await ctx.db.patch(args.id, {
            camperConfirmedAt: Date.now(),
        });

        // Free up the staff member
        if (assignment.staffId) {
            await ctx.db.patch(assignment.staffId, {
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
        id: v.id("tasks"),
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

        // Let the staff member know they received feedback
        if (assignment.staffId) {
            const stars = "★".repeat(args.rating) + "☆".repeat(Math.max(0, 5 - args.rating));
            await ctx.db.insert("notifications", {
                userId: assignment.staffId,
                assignmentId: args.id,
                type: "feedback",
                channel: "push",
                status: "delivered",
                message: `You received ${stars} (${args.rating}/5) for "${assignment.description || assignment.serviceType || "a task"}"${args.feedback ? `: "${args.feedback}"` : ""}`,
            });
        }
    },
});

// Get average rating for a camp-staff member
export const getStaffRating = query({
    args: { staffId: v.id("users") },
    handler: async (ctx, args) => {
        const tasks = await ctx.db
            .query("tasks")
            .withIndex("by_staffId", (q) => q.eq("staffId", args.staffId))
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
