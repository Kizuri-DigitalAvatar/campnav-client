import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createMealOrder = mutation({
  args: {
    userId: v.id("users"),
    date: v.number(),
    mealType: v.string(), // "breakfast", "lunch", "dinner"
    items: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
      specialInstructions: v.optional(v.string()),
    })),
    dietaryRestrictions: v.array(v.string()),
    preferences: v.optional(v.object({
      riceType: v.string(), // "rice", "bulgur"
      spiceLevel: v.string(), // "mild", "medium", "spicy"
    })),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.insert("mealOrders", {
      userId: args.userId,
      date: args.date,
      mealType: args.mealType,
      items: args.items,
      dietaryRestrictions: args.dietaryRestrictions,
      preferences: args.preferences,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const updateMealOrderStatus = mutation({
  args: {
    orderId: v.id("mealOrders"),
    status: v.string(), // "pending", "confirmed", "preparing", "ready", "completed"
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Meal order not found");
    }

    const updateData: any = { status: args.status };

    // Add timestamps for status changes
    const now = Date.now();
    switch (args.status) {
      case "confirmed":
        updateData.confirmedAt = now;
        break;
      case "ready":
        updateData.readyAt = now;
        break;
      case "completed":
        updateData.completedAt = now;
        break;
    }

    await ctx.db.patch(args.orderId, updateData);
    return await ctx.db.get(args.orderId);
  },
});

export const getMealOrders = query({
  args: {
    userId: v.optional(v.id("users")),
    date: v.optional(v.number()),
    status: v.optional(v.string()),
    mealType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = args.userId
      ? ctx.db.query("mealOrders").withIndex("by_userId", (q) => q.eq("userId", args.userId!))
      : args.date
        ? ctx.db.query("mealOrders").withIndex("by_date", (q) => q.eq("date", args.date!))
        : args.status
          ? ctx.db.query("mealOrders").withIndex("by_status", (q) => q.eq("status", args.status!))
          : ctx.db.query("mealOrders");

    if (args.userId && args.date) query = query.filter((q) => q.eq(q.field("date"), args.date));
    if ((args.userId || args.date) && args.status) query = query.filter((q) => q.eq(q.field("status"), args.status));
    if (args.mealType) query = query.filter((q) => q.eq(q.field("mealType"), args.mealType));
    
    const orders = await query.order("desc").collect();
    
    // Enrich with user information
    return Promise.all(
      orders.map(async (order) => {
        const user = await ctx.db.get(order.userId);
        return {
          ...order,
          userName: user?.name || "Unknown",
        };
      })
    );
  },
});

export const getMealStats = query({
  args: {
    date: v.optional(v.number()), // Specific date or today if not provided
  },
  handler: async (ctx, args) => {
    const targetDate = args.date || new Date().setHours(0, 0, 0, 0);
    const nextDay = targetDate + (24 * 60 * 60 * 1000);
    
    const orders = await ctx.db
      .query("mealOrders")
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), targetDate),
          q.lt(q.field("date"), nextDay)
        )
      )
      .collect();
    
    const breakfastOrders = orders.filter(o => o.mealType === "breakfast");
    const lunchOrders = orders.filter(o => o.mealType === "lunch");
    const dinnerOrders = orders.filter(o => o.mealType === "dinner");
    
    const totalOrders = orders.length;
    const confirmedOrders = orders.filter(o => o.status === "confirmed").length;
    const preparingOrders = orders.filter(o => o.status === "preparing").length;
    const readyOrders = orders.filter(o => o.status === "ready").length;
    const completedOrders = orders.filter(o => o.status === "completed").length;
    
    // Dietary restrictions analysis
    const dietaryRestrictions = orders.reduce((acc, order) => {
      order.dietaryRestrictions?.forEach(restriction => {
        acc[restriction] = (acc[restriction] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    // Preferences analysis
    const ricePreferences = orders.reduce((acc, order) => {
      if (order.preferences?.riceType) {
        acc[order.preferences.riceType] = (acc[order.preferences.riceType] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const spicePreferences = orders.reduce((acc, order) => {
      if (order.preferences?.spiceLevel) {
        acc[order.preferences.spiceLevel] = (acc[order.preferences.spiceLevel] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return {
      date: targetDate,
      totalOrders,
      byMealType: {
        breakfast: breakfastOrders.length,
        lunch: lunchOrders.length,
        dinner: dinnerOrders.length,
      },
      byStatus: {
        pending: orders.filter(o => o.status === "pending").length,
        confirmed: confirmedOrders,
        preparing: preparingOrders,
        ready: readyOrders,
        completed: completedOrders,
      },
      dietaryRestrictions,
      preferences: {
        riceType: ricePreferences,
        spiceLevel: spicePreferences,
      },
    };
  },
});

export const getDietaryRequirements = query({
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
    
    // Analyze dietary restrictions from meal orders
    const requirements = await Promise.all(
      users.map(async (user) => {
        const orders = await ctx.db
          .query("mealOrders")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .collect();
        
        // Extract dietary restrictions from order history
        const restrictions = new Set<string>();
        const preferences = {
          riceType: "rice",
          spiceLevel: "medium",
        };
        
        orders.forEach(order => {
          order.dietaryRestrictions?.forEach(restriction => 
            restrictions.add(restriction)
          );
          
          if (order.preferences?.riceType) {
            preferences.riceType = order.preferences.riceType;
          }
          if (order.preferences?.spiceLevel) {
            preferences.spiceLevel = order.preferences.spiceLevel;
          }
        });
        
        return {
          userId: user._id,
          userName: user.name,
          dietaryRestrictions: Array.from(restrictions),
          preferences,
          orderCount: orders.length,
          lastOrderDate: orders.length > 0 ? Math.max(...orders.map(o => o.date)) : null,
        };
      })
    );
    
    return args.userId ? requirements[0] : requirements;
  },
});

export const createBulkMealOrders = mutation({
  args: {
    orders: v.array(v.object({
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
    })),
  },
  handler: async (ctx, args) => {
    const createdOrders = [];
    
    for (const orderData of args.orders) {
      const user = await ctx.db.get(orderData.userId);
      if (!user) {
        console.error(`User ${orderData.userId} not found, skipping order`);
        continue;
      }
      
      const order = await ctx.db.insert("mealOrders", {
        userId: orderData.userId,
        date: orderData.date,
        mealType: orderData.mealType,
        items: orderData.items,
        dietaryRestrictions: orderData.dietaryRestrictions,
        preferences: orderData.preferences,
        status: "pending",
        createdAt: Date.now(),
      });
      
      createdOrders.push(order);
    }
    
    return createdOrders;
  },
});

export const getMealInventoryRequirements = query({
  args: {
    date: v.number(),
    mealType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("mealOrders")
      .withIndex("by_date", (q) => q.eq("date", args.date));
    
    if (args.mealType) {
      query = query.filter((q) => q.eq(q.field("mealType"), args.mealType));
    }
    
    const orders = await query.collect();
    
    // Calculate inventory requirements
    const inventoryRequirements = orders.reduce((acc, order) => {
      order.items.forEach(item => {
        const key = `${item.name}_${order.mealType}`;
        if (!acc[key]) {
          acc[key] = {
            name: item.name,
            mealType: order.mealType,
            totalQuantity: 0,
            dietaryNotes: new Set<string>(),
            specialInstructions: new Set<string>(),
          };
        }
        
        acc[key].totalQuantity += item.quantity;
        
        if (order.dietaryRestrictions) {
          order.dietaryRestrictions.forEach(restriction => 
            acc[key].dietaryNotes.add(restriction)
          );
        }
        
        if (item.specialInstructions) {
          acc[key].specialInstructions.add(item.specialInstructions);
        }
      });
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(inventoryRequirements);
  },
});
