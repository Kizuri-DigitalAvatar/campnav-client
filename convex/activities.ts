import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        date: v.number(),
        time: v.string(),
        location: v.string(),
        category: v.optional(v.string()),
        capacity: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("activities", {
            ...args,
        });
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("activities").order("asc").collect();
    },
});

export const listUpcoming = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        // Simplified: just get everything sorted by date for now
        // In a real app we'd filter by date >= startOfDay(now)
        return await ctx.db
            .query("activities")
            .withIndex("by_date", (q) => q.lt("date", now + 1000 * 60 * 60 * 24 * 7)) // Next 7 days approx
            .collect();
    },
});

export const update = mutation({
    args: {
        id: v.id("activities"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        date: v.optional(v.number()),
        time: v.optional(v.string()),
        location: v.optional(v.string()),
        category: v.optional(v.string()),
        capacity: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...rest } = args;
        await ctx.db.patch(id, rest);
    },
});

export const remove = mutation({
    args: { id: v.id("activities") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
