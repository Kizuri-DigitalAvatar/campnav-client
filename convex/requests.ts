import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
        return await ctx.db.insert("requests", {
            ...args,
            status: "pending",
            createdAt: Date.now(),
        });
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
