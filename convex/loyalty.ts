import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const addLoyaltyPoints = mutation({
  args: {
    userId: v.id("users"),
    points: v.number(),
    reason: v.string(),
    relatedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Add points to user's balance
    const currentPoints = user.points || 0;
    const newPoints = currentPoints + args.points;
    
    await ctx.db.patch(args.userId, {
      points: newPoints,
    });

    // Create transaction record
    await ctx.db.insert("loyaltyTransactions", {
      userId: args.userId,
      type: "earned",
      points: args.points,
      reason: args.reason,
      relatedTo: args.relatedTo,
      createdAt: Date.now(),
    });

    return await ctx.db.get(args.userId);
  },
});

export const deductLoyaltyPoints = mutation({
  args: {
    userId: v.id("users"),
    points: v.number(),
    reason: v.string(),
    recordedBy: v.id("users"),
    relatedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentPoints = user.points || 0;
    if (currentPoints < args.points) {
      throw new Error("Insufficient loyalty points");
    }

    // Deduct points from user's balance
    const newPoints = currentPoints - args.points;
    
    await ctx.db.patch(args.userId, {
      points: newPoints,
    });

    // Create transaction record
    await ctx.db.insert("loyaltyTransactions", {
      userId: args.userId,
      type: "deducted",
      points: args.points,
      reason: args.reason,
      relatedTo: args.relatedTo,
      createdAt: Date.now(),
    });

    return await ctx.db.get(args.userId);
  },
});

export const addDisciplinaryPoints = mutation({
  args: {
    userId: v.id("users"),
    points: v.number(),
    reason: v.string(),
    recordedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Add disciplinary points
    const currentDisciplinaryPoints = user.disciplinaryPoints || 0;
    const newDisciplinaryPoints = currentDisciplinaryPoints + args.points;
    
    await ctx.db.patch(args.userId, {
      disciplinaryPoints: newDisciplinaryPoints,
    });

    // Also deduct from loyalty points as penalty
    const currentLoyaltyPoints = user.points || 0;
    const loyaltyDeduction = Math.min(args.points * 10, currentLoyaltyPoints); // 10 loyalty points per disciplinary point
    
    await ctx.db.patch(args.userId, {
      points: Math.max(0, currentLoyaltyPoints - loyaltyDeduction),
    });

    // Create loyalty transaction for deduction
    if (loyaltyDeduction > 0) {
      await ctx.db.insert("loyaltyTransactions", {
        userId: args.userId,
        type: "deducted",
        points: loyaltyDeduction,
        reason: `Disciplinary action: ${args.reason}`,
        createdAt: Date.now(),
      });
    }

    return await ctx.db.get(args.userId);
  },
});

export const redeemLoyaltyPoints = mutation({
  args: {
    userId: v.id("users"),
    points: v.number(),
    reason: v.string(),
    relatedTo: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentPoints = user.points || 0;
    if (currentPoints < args.points) {
      throw new Error("Insufficient loyalty points for redemption");
    }

    // Deduct points for redemption
    const newPoints = currentPoints - args.points;
    
    await ctx.db.patch(args.userId, {
      points: newPoints,
    });

    // Create transaction record
    await ctx.db.insert("loyaltyTransactions", {
      userId: args.userId,
      type: "redeemed",
      points: args.points,
      reason: args.reason,
      relatedTo: args.relatedTo,
      createdAt: Date.now(),
    });

    return await ctx.db.get(args.userId);
  },
});

export const getLoyaltyTransactions = query({
  args: {
    userId: v.id("users"),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("loyaltyTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc");
    
    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }
    
    const transactions = await query.collect();
    const limitedTransactions = args.limit ? transactions.slice(0, args.limit) : transactions;
    
    return limitedTransactions;
  },
});

export const getLoyaltyStats = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let users;
    if (args.userId) {
      const user = await ctx.db.get(args.userId);
      users = user ? [user] : [];
    } else {
      users = await ctx.db.query("users").collect();
    }

    const stats = await Promise.all(
      users.map(async (user) => {
        const transactions = await ctx.db
          .query("loyaltyTransactions")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .collect();
        
        const earnedPoints = transactions
          .filter(t => t.type === "earned")
          .reduce((sum, t) => sum + t.points, 0);
        
        const redeemedPoints = transactions
          .filter(t => t.type === "redeemed")
          .reduce((sum, t) => sum + t.points, 0);
        
        const deductedPoints = transactions
          .filter(t => t.type === "deducted")
          .reduce((sum, t) => sum + t.points, 0);
        
        const currentBalance = user.points || 0;
        const disciplinaryPoints = user.disciplinaryPoints || 0;
        
        return {
          userId: user._id,
          userName: user.name,
          currentBalance,
          totalEarned: earnedPoints,
          totalRedeemed: redeemedPoints,
          totalDeducted: deductedPoints,
          disciplinaryPoints,
          transactionCount: transactions.length,
        };
      })
    );

    return args.userId ? stats[0] : stats;
  },
});

export const getTopLoyaltyEarners = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const limit = args.limit || 10;
    
    // Calculate loyalty stats for all users
    const userStats = await Promise.all(
      users.map(async (user) => {
        const transactions = await ctx.db
          .query("loyaltyTransactions")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .collect();
        
        const earnedPoints = transactions
          .filter(t => t.type === "earned")
          .reduce((sum, t) => sum + t.points, 0);
        
        return {
          userId: user._id,
          userName: user.name,
          earnedPoints,
          currentBalance: user.points || 0,
        };
      })
    );
    
    // Sort by earned points and return top users
    return userStats
      .sort((a, b) => b.earnedPoints - a.earnedPoints)
      .slice(0, limit);
  },
});
