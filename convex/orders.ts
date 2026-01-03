import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const baseQuery = args.status && args.status !== "all"
      ? ctx.db.query("orders").withIndex("by_status", (q) => q.eq("status", args.status!))
      : ctx.db.query("orders");

    const orders = await baseQuery.order("desc").collect();

    const results = await Promise.all(
      orders.map(async (o) => {
        let userName = "Deleted User";
        if (o.userId) {
          try {
            const user = await ctx.db.get(o.userId);
            if (user) {
              userName = user.name;
            }
          } catch (e) {
            console.error("Failed to fetch user for order", o._id, o.userId, e);
          }
        }
        return { ...o, userName };
      })
    );

    return results;
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    source: v.string(),
    summary: v.string(),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const _id = await ctx.db.insert("orders", {
      userId: args.userId,
      source: args.source,
      summary: args.summary,
      total: args.total,
      status: "pending",
      createdAt: now,
    });
    return await ctx.db.get(_id);
  },
});

export const updateStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, { status: args.status });
    return await ctx.db.get(args.orderId);
  },
});

export const deleteOrder = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
