import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createMealOrder = mutation({
  args: {
    userId: v.id("users"),
    date: v.number(),
    mealType: v.string(),
    items: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
      specialInstructions: v.optional(v.string()),
    })),
    dietaryRestrictions: v.array(v.string()),
    preferences: v.optional(v.object({
      riceType: v.string(),
      spiceLevel: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    return await ctx.db.insert("mealOrders", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const getMealOrders = query({
  args: {
    userId: v.optional(v.id("users")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let mealQuery = ctx.db.query("mealOrders");

    if (args.userId) {
      mealQuery = mealQuery.withIndex("by_userId", (q) => q.eq("userId", args.userId));
    }
    if (args.status) {
      mealQuery = mealQuery.withIndex("by_status", (q) => q.eq("status", args.status));
    }

    return await mealQuery.order("desc").collect();
  },
});

