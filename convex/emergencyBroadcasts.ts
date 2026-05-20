import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createBroadcast = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: v.string(),
    severity: v.string(),
    userId: v.id("users"),
    affectedAreas: v.array(v.string()),
    targetAudience: v.array(v.string()),
    deliveryChannels: v.array(v.string()),
    instructions: v.optional(v.array(v.string())),
    estimatedDuration: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    siteStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const broadcastId = await ctx.db.insert("emergencyBroadcasts", {
      ...args,
      status: "active",
      createdAt: Date.now(),
    });
    return broadcastId;
  },
});

export const getActiveBroadcasts = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("emergencyBroadcasts")
      .withIndex("by_status", (q) => q.eq("status", "active"))
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
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.broadcastId, {
      status: args.status,
      ...(args.status === "resolved" ? { resolvedAt: Date.now() } : {}),
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
