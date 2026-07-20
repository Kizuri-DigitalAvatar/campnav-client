import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Facility management (shared with admin) ──────────────────────────────────

export const listFacilities = query({
  args: { includeInactive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const facilities = args.includeInactive
      ? await ctx.db.query("facilities").collect()
      : await ctx.db.query("facilities").withIndex("by_active", (q) => q.eq("isActive", true)).collect();
    return Promise.all(
      facilities.map(async (f) => {
        const imageUrls = await Promise.all(
          (f.images ?? []).map((id) => ctx.storage.getUrl(id))
        );
        return { ...f, imageUrls: imageUrls.filter(Boolean) };
      })
    );
  },
});

export const createFacility = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    capacity: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
    amenities: v.optional(v.array(v.string())),
    openingTime: v.optional(v.string()),
    closingTime: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("facilities", { ...args, isActive: true, createdAt: Date.now() });
  },
});

export const updateFacility = mutation({
  args: {
    id: v.id("facilities"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    capacity: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
    amenities: v.optional(v.array(v.string())),
    openingTime: v.optional(v.string()),
    closingTime: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const deleteFacility = mutation({
  args: { id: v.id("facilities") },
  handler: async (ctx, args) => {
    const facility = await ctx.db.get(args.id);
    if (facility?.images) {
      await Promise.all(facility.images.map((id) => ctx.storage.delete(id)));
    }
    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

export const getFacilityBookings = query({
  args: {
    userId: v.optional(v.id("users")),
    facility: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const bookings = args.userId
      ? await ctx.db.query("facilityBookings").withIndex("by_userId", (q) => q.eq("userId", args.userId!)).collect()
      : args.facility
      ? await ctx.db.query("facilityBookings").withIndex("by_facility", (q) => q.eq("facility", args.facility!)).collect()
      : args.status
      ? await ctx.db.query("facilityBookings").withIndex("by_status", (q) => q.eq("status", args.status!)).collect()
      : await ctx.db.query("facilityBookings").order("desc").collect();
    return Promise.all(
      bookings.map(async (b) => {
        const user = await ctx.db.get(b.userId);
        return { ...b, userName: user?.name ?? "Unknown" };
      })
    );
  },
});

export const updateFacilityBookingStatus = mutation({
  args: { bookingId: v.id("facilityBookings"), status: v.string() },
  handler: async (ctx, args) => {
    const update: Record<string, unknown> = { status: args.status };
    if (args.status === "confirmed") update.confirmedAt = Date.now();
    await ctx.db.patch(args.bookingId, update);
  },
});

export const getFacilityStats = query({
  args: {},
  handler: async (ctx) => {
    const bookings = await ctx.db.query("facilityBookings").collect();
    const total = bookings.length;
    const confirmed = bookings.filter((b) => b.status === "confirmed").length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    return {
      totalBookings: total,
      confirmedBookings: confirmed,
      completedBookings: completed,
      confirmationRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
    };
  },
});

// ── Admin presence ────────────────────────────────────────────────────────────

export const pingPresence = mutation({
  args: { userId: v.id("users"), currentPage: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("adminPresence")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { lastSeen: Date.now(), currentPage: args.currentPage });
    } else {
      await ctx.db.insert("adminPresence", { userId: args.userId, lastSeen: Date.now(), currentPage: args.currentPage });
    }
  },
});

export const getActiveAdmins = query({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 5 * 60 * 1000;
    const presence = await ctx.db
      .query("adminPresence")
      .withIndex("by_lastSeen", (q) => q.gte("lastSeen", cutoff))
      .collect();
    return Promise.all(
      presence.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return { ...p, name: user?.name ?? "Unknown", role: user?.role ?? "", image: user?.image ?? null };
      })
    );
  },
});

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
