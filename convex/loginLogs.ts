import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const log = mutation({
    args: {
        userId: v.optional(v.id("users")),
        email: v.string(),
        userName: v.optional(v.string()),
        role: v.optional(v.string()),
        app: v.string(),
        status: v.string(),
        ipAddress: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        browser: v.optional(v.string()),
        os: v.optional(v.string()),
        device: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("loginLogs", {
            ...args,
            createdAt: Date.now(),
        });
    },
});

export const list = query({
    args: {
        app: v.optional(v.string()),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let logs = await ctx.db.query("loginLogs").order("desc").collect();
        if (args.app) logs = logs.filter(l => l.app === args.app);
        if (args.status) logs = logs.filter(l => l.status === args.status);
        return args.limit ? logs.slice(0, args.limit) : logs;
    },
});

export const remove = mutation({
    args: { id: v.id("loginLogs") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const clearAll = mutation({
    args: {},
    handler: async (ctx) => {
        const logs = await ctx.db.query("loginLogs").collect();
        await Promise.all(logs.map(l => ctx.db.delete(l._id)));
    },
});
