import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { api } from "./_generated/api";

// Resident/guest "Contact Support" message: lands in the admin Reports tab
// and pings every admin's notification bell live
export const submitSupportMessage = mutation({
    args: {
        userId: v.id("users"),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const message = args.message.trim();
        if (!message) throw new Error("Message cannot be empty");

        const user = await ctx.db.get(args.userId);
        const userName = user?.name || "A guest";
        const room = (user as any)?.roomNumber ? ` (Room ${(user as any).roomNumber})` : "";

        const reportId = await ctx.db.insert("reports", {
            userId: args.userId,
            type: "support",
            title: `Support message from ${userName}${room}`,
            message,
            status: "unread",
            createdAt: Date.now(),
        });

        // Live notification for admins
        await ctx.runMutation(api.notifications.sendRoleNotification, {
            role: "admin",
            type: "support",
            message: `💬 ${userName}${room}: "${message.slice(0, 180)}${message.length > 180 ? "..." : ""}"`,
        });

        return reportId;
    },
});

export const create = mutation({
    args: {
        userId: v.id("users"),
        type: v.string(), // "bug", "feedback", "incident", "staff_unresponsive"
        title: v.string(),
        message: v.string(),
        status: v.string(), // "unread", "resolved"
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("reports", {
            ...args,
            createdAt: Date.now(),
        });
    },
});

export const markAsResolved = mutation({
    args: { id: v.id("reports") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: "resolved" });
    },
});

export const list = query({
    args: {
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const baseQuery = args.status && args.status !== "all"
            ? ctx.db.query("reports").withIndex("by_status", (q) => q.eq("status", args.status!))
            : ctx.db.query("reports");

        const reports = await baseQuery.order("desc").collect();

        const results = await Promise.all(
            reports.map(async (r) => {
                let userName = "Deleted User";
                if (r.userId) {
                    try {
                        const user = await ctx.db.get(r.userId);
                        if (user) {
                            userName = user.name;
                        }
                    } catch (e) {
                        console.error("Failed to fetch user for report", r._id, r.userId, e);
                    }
                }
                return { ...r, userName };
            })
        );

        return results;
    },
});
