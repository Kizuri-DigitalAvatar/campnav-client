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

// Why a request has (or hasn't) got a staff member on it: every staff member's
// availability, plus whether they were notified about this task and ignored it.
export const getStaffingReport = query({
    args: { id: v.id("requests") },
    handler: async (ctx, args) => {
        const request = await ctx.db.get(args.id);
        if (!request) return null;

        const now = Date.now();
        const dutyType = request.type.toLowerCase();

        const task = await ctx.db
            .query("tasks")
            .withIndex("by_requestId", (q) => q.eq("requestId", args.id))
            .first();

        const requester = await ctx.db.get(request.userId);

        // Manual-assignment notifications only carry the task id, so look up both
        const byRequest = await ctx.db
            .query("notifications")
            .withIndex("by_requestId", (q) => q.eq("requestId", args.id))
            .collect();
        const byTask = task
            ? await ctx.db
                .query("notifications")
                .withIndex("by_assignmentId", (q) => q.eq("assignmentId", task._id))
                .collect()
            : [];
        const notifications = [...new Map([...byRequest, ...byTask].map((n) => [n._id, n])).values()]
            // Newest first, so each staff member's latest notification wins
            .sort((a, b) => b._creationTime - a._creationTime);
        const adminAlerts = notifications.filter((n) => n.type === "admin_alert" && n.channel === "push");

        const allStaff = (await Promise.all(
            ["camp-staff", "staff"].map((role) =>
                ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", role)).collect()
            )
        )).flat();

        const resolveImage = async (image?: string) => {
            if (!image) return null;
            if (image.startsWith("http")) return image;
            try { return await ctx.storage.getUrl(image); } catch { return null; }
        };

        const staff = await Promise.all(allStaff.map(async (s) => {
            // ── Availability ──
            const reasons: string[] = [];
            let availability: "available" | "busy" | "on_leave" | "off_site" = "available";

            let currentTask: null | {
                _id: string; roomNumber: string; serviceType: string; status: string; assignedAt: number
            } = null;
            let staleLock = false;
            if (s.currentTaskId && s.currentTaskId !== task?._id) {
                const ct = await ctx.db.get(s.currentTaskId);
                if (ct && !["completed", "rated", "cancelled"].includes(ct.status)) {
                    currentTask = {
                        _id: ct._id, roomNumber: ct.roomNumber, serviceType: ct.serviceType,
                        status: ct.status, assignedAt: ct.assignedAt,
                    };
                } else {
                    // Points at a finished or deleted task — they're actually free
                    staleLock = true;
                }
            }

            const onLeave = typeof s.onLeaveUntil === "number" && s.onLeaveUntil > now;
            if (onLeave) {
                availability = "on_leave";
                reasons.push(`On leave until ${new Date(s.onLeaveUntil!).toLocaleDateString()}`);
            }
            if (currentTask) {
                if (availability === "available") availability = "busy";
                reasons.push(
                    currentTask.status === "pending"
                        ? `Holding an unaccepted ${currentTask.serviceType.replace("_", " ")} task (Room ${currentTask.roomNumber})`
                        : `Working on ${currentTask.serviceType.replace("_", " ")} task (Room ${currentTask.roomNumber}) — ${currentTask.status.replace("_", " ")}`
                );
            }
            if (!s.isOnSite) {
                if (availability === "available") availability = "off_site";
                reasons.push("Marked off site");
            }
            if (staleLock) reasons.push("Had a stale task lock (task already finished)");

            const duties = s.assignedDuties || [];
            const dutyMatch = duties.includes(dutyType);
            if (!dutyMatch) reasons.push(`Not assigned ${dutyType.replace("_", " ")} duties`);

            // Every unfinished task on their plate (other than this one), accepted first
            const openTasks = (await ctx.db
                .query("tasks")
                .withIndex("by_staffId", (q) => q.eq("staffId", s._id))
                .collect())
                .filter((t) => t._id !== task?._id && !["completed", "rated", "cancelled"].includes(t.status))
                .map((t) => ({
                    _id: t._id,
                    requestId: t.requestId,
                    roomNumber: t.roomNumber,
                    serviceType: t.serviceType,
                    description: t.description,
                    status: t.status,
                    accepted: t.status !== "pending",
                    assignedAt: t.assignedAt,
                    acknowledgedAt: t.acknowledgedAt,
                    startedAt: t.startedAt,
                }))
                .sort((a, b) =>
                    Number(b.accepted) - Number(a.accepted) ||
                    (b.acknowledgedAt ?? b.assignedAt) - (a.acknowledgedAt ?? a.assignedAt)
                );

            // ── Engagement with this request ──
            const push = notifications.find((n) => n.userId === s._id && n.channel === "push" && n.type !== "admin_alert");
            const isAssignee = task?.staffId === s._id;
            const accepted = isAssignee && !!task && task.status !== "pending";
            const viewedTask = !!task?.viewedBy?.includes(s._id);

            let engagement: "accepted" | "viewed_ignored" | "seen_ignored" | "popup_ignored" | "not_seen" | "not_notified";
            if (accepted) engagement = "accepted";
            else if (viewedTask) engagement = "viewed_ignored";
            else if (push?.readAt) engagement = "seen_ignored";
            else if (push?.deliveredAt || push?.status === "delivered") engagement = "popup_ignored";
            else if (push) engagement = "not_seen";
            else engagement = "not_notified";

            return {
                _id: s._id,
                name: s.name,
                email: s.email,
                imageUrl: await resolveImage(s.image),
                department: s.department,
                assignedDuties: duties,
                isOnSite: !!s.isOnSite,
                onLeaveUntil: onLeave ? s.onLeaveUntil : undefined,
                availability,
                reasons,
                dutyMatch,
                currentTask,
                openTasks,
                isAssignee,
                engagement,
                notifiedAt: push?._creationTime,
                popupShownAt: push?.deliveredAt,
                notificationReadAt: push?.readAt,
                viewedTask,
            };
        }));

        const rank = { available: 0, off_site: 1, busy: 2, on_leave: 3 } as const;
        staff.sort((a, b) =>
            Number(b.isAssignee) - Number(a.isAssignee) ||
            Number(b.dutyMatch) - Number(a.dutyMatch) ||
            rank[a.availability] - rank[b.availability] ||
            (a.name || "").localeCompare(b.name || "")
        );

        let assignee = null;
        if (task?.staffId) {
            const a = staff.find((s) => s._id === task.staffId);
            assignee = a ? { _id: a._id, name: a.name } : null;
        }

        return {
            request: { ...request, requesterName: requester?.name ?? "Unknown" },
            task: task ? {
                _id: task._id, status: task.status, assignedAt: task.assignedAt,
                acknowledgedAt: task.acknowledgedAt, staffId: task.staffId,
                reminderCount: (task as any).reminderCount ?? 0,
            } : null,
            assignee,
            dutyType,
            alertedAt: adminAlerts.length > 0 ? Math.min(...adminAlerts.map((n) => n._creationTime)) : undefined,
            staff,
            summary: {
                total: staff.length,
                dutyMatched: staff.filter((s) => s.dutyMatch).length,
                available: staff.filter((s) => s.availability === "available").length,
                availableMatched: staff.filter((s) => s.availability === "available" && s.dutyMatch).length,
                busy: staff.filter((s) => s.availability === "busy").length,
                onLeave: staff.filter((s) => s.availability === "on_leave").length,
                offSite: staff.filter((s) => s.availability === "off_site").length,
                notified: staff.filter((s) => s.engagement !== "not_notified").length,
                ignored: staff.filter((s) => ["viewed_ignored", "seen_ignored", "popup_ignored"].includes(s.engagement)).length,
            },
        };
    },
});
