import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const bookFacility = mutation({
  args: {
    facility: v.string(),
    date: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    numberOfParticipants: v.optional(v.number()),
    specialRequests: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const bookingId = await ctx.db.insert("facilityBookings", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
    return bookingId;
  },
});

export const listBookings = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("facilityBookings");
    if (args.userId) {
      q = q.filter((f) => f.eq(f.field("userId"), args.userId));
    }
    return await q.order("desc").collect();
  },
});
