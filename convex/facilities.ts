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
    // Check for conflicts (confirmed bookings at the same time and facility)
    const existing = await ctx.db
      .query("facilityBookings")
      .withIndex("by_facility", (q) => q.eq("facility", args.facility))
      .filter((q) => q.eq(q.field("date"), args.date))
      .collect();

    const hasConflict = existing.some(
      (b) =>
        b.status === "confirmed" &&
        ((args.startTime >= b.startTime && args.startTime < b.endTime) ||
          (args.endTime > b.startTime && args.endTime <= b.endTime))
    );

    if (hasConflict) {
      throw new Error("This time slot is already booked.");
    }

    const bookingId = await ctx.db.insert("facilityBookings", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
    return bookingId;
  },
});

export const cancelBooking = mutation({
  args: { bookingId: v.id("facilityBookings"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.userId !== args.userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.bookingId, { status: "cancelled" });
    return args.bookingId;
  },
});

export const listBookings = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const q = args.userId
      ? ctx.db
          .query("facilityBookings")
          .withIndex("by_userId", (qi) => qi.eq("userId", args.userId!))
      : ctx.db.query("facilityBookings");
    return await q.order("desc").collect();
  },
});

export const getFacilityAvailability = query({
  args: { facility: v.string(), date: v.number() },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("facilityBookings")
      .withIndex("by_facility", (q) => q.eq("facility", args.facility))
      .filter((q) => q.eq(q.field("date"), args.date))
      .collect();

    return bookings
      .filter((b) => b.status === "confirmed")
      .map((b) => ({
        start: b.startTime,
        end: b.endTime,
      }));
  },
});
