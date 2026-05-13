import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createRnrRequest = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    reason: v.string(),
    flightDetails: v.optional(v.object({
      bookingReference: v.string(),
      departure: v.string(),
      arrival: v.string(),
      airline: v.string(),
      confirmationCode: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const requestId = await ctx.db.insert("rnrRequests", {
      ...args,
      status: "pending",
      countdownDays: Math.ceil((args.startDate - Date.now()) / (24 * 60 * 60 * 1000)),
      createdAt: Date.now(),
    });
    return requestId;
  },
});

export const getRequests = query({
  handler: async (ctx) => {
    return await ctx.db.query("rnrRequests").order("desc").collect();
  },
});

export const getRequestsByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rnrRequests")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const approveRequest = mutation({
  args: {
    requestId: v.id("rnrRequests"),
    approvedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, {
      status: "approved",
      approvedBy: args.approvedBy,
      approvedAt: Date.now(),
    });
  },
});

export const rejectRequest = mutation({
  args: {
    requestId: v.id("rnrRequests"),
    approvedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      approvedBy: args.approvedBy,
      approvedAt: Date.now(),
    });
  },
});

export const getUpcomingRequests = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 7;
    const cutoffDate = Date.now() + (days * 24 * 60 * 60 * 1000);
    return await ctx.db
      .query("rnrRequests")
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "approved"),
          q.gt(q.field("startDate"), Date.now()),
          q.lte(q.field("startDate"), cutoffDate)
        )
      )
      .collect();
  },
});
