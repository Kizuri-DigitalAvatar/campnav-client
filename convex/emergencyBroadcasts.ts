import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createBroadcast = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: v.string(),
    severity: v.string(),
    createdBy: v.id("users"),
    targetAudience: v.optional(v.array(v.string())),
    siteStatus: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const broadcastId = await ctx.db.insert("emergencyBroadcasts", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
    return broadcastId;
  },
});

export const getActiveBroadcasts = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("emergencyBroadcasts")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const getAllBroadcasts = query({
  handler: async (ctx) => {
    return await ctx.db.query("emergencyBroadcasts").order("desc").collect();
  },
});

export const updateBroadcastStatus = mutation({
  args: {
    broadcastId: v.id("emergencyBroadcasts"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.broadcastId, {
      isActive: args.isActive,
    });
  },
});

export const getBroadcastsByType = query({
  args: {
    type: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emergencyBroadcasts")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
  },
});
