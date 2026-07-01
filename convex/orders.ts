import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    status: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let baseQuery: any;
    
    if (args.source && args.source !== "all") {
      baseQuery = ctx.db.query("orders")
        .withIndex("by_source", (q) => q.eq("source", args.source!));
    } else if (args.status && args.status !== "all") {
      baseQuery = ctx.db.query("orders")
        .withIndex("by_status", (q) => q.eq("status", args.status!));
    } else {
      baseQuery = ctx.db.query("orders");
    }

    let orders = await baseQuery.order("desc").collect();

    if (args.source && args.source !== "all" && args.status && args.status !== "all") {
      orders = orders.filter((o: any) => o.status === args.status);
    }

    const results = await Promise.all(
      orders.map(async (o: any) => {
        let userName = "Deleted User";
        if (o.userId) {
          try {
            const user: any = await ctx.db.get(o.userId);
            if (user) {
              userName = user.name;
            }
          } catch (e) {
            console.error("Failed to fetch user for order", o._id, o.userId, e);
          }
        }

        let productImage = o.productImage;
        if (productImage && !productImage.startsWith("http")) {
          try {
            productImage = await ctx.storage.getUrl(productImage);
          } catch (e) {
            console.error("Failed to resolve product image", productImage, e);
          }
        }
        if (!productImage && o.source === "shop") {
          const productList = await ctx.db.query("products").collect();
          const product = productList.find(p => p.name === o.summary);
          if (product?.image) {
            try {
              productImage = product.image.startsWith("http")
                ? product.image
                : await ctx.storage.getUrl(product.image);
            } catch (e) {
              console.error("Failed to resolve fallback product image", product.image, e);
            }
          }
        }

        return { ...o, userName, productImage };
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
    roomNumber: v.optional(v.string()),
    quantity: v.optional(v.number()),
    productImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const _id = await ctx.db.insert("orders", {
      userId: args.userId,
      source: args.source,
      summary: args.summary,
      total: args.total,
      roomNumber: args.roomNumber,
      status: "pending",
      quantity: args.quantity ?? 1,
      productImage: args.productImage,
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

export const confirmReceipt = mutation({
  args: {
    orderId: v.id("orders"),
    userId: v.id("users"),
    note: v.optional(v.string()),
    evidence: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.userId !== args.userId) {
      throw new Error("You can only verify your own orders");
    }

    const update: any = {
      status: order.status === "failed" ? "failed" : "completed",
      confirmedAt: Date.now(),
      confirmationNote: args.note,
      confirmationEvidence: args.evidence,
    };

    await ctx.db.patch(args.orderId, update);
    return await ctx.db.get(args.orderId);
  },
});

export const incrementShopOrder = mutation({
  args: {
    orderId: v.id("orders"),
    amount: v.number(),
    unitPrice: v.number(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    const currentQty = order.quantity ?? 1;
    const newQty = currentQty + args.amount;
    const newTotal = order.total + args.unitPrice * args.amount;
    await ctx.db.patch(args.orderId, { quantity: newQty, total: newTotal });
    return await ctx.db.get(args.orderId);
  },
});

export const deleteOrder = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const listForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return Promise.all(orders.map(async (o: any) => {
      let productImage = o.productImage;
      if (productImage && !productImage.startsWith("http")) {
        try {
          productImage = await ctx.storage.getUrl(productImage);
        } catch (e) {
          console.error("Failed to resolve product image", productImage, e);
        }
      }
      if (!productImage && o.source === "shop") {
        const productList = await ctx.db.query("products").collect();
        const product = productList.find(p => p.name === o.summary);
        if (product?.image) {
          try {
            productImage = product.image.startsWith("http")
              ? product.image
              : await ctx.storage.getUrl(product.image);
          } catch (e) {
            console.error("Failed to resolve fallback product image", product.image, e);
          }
        }
      }
      return { ...o, productImage };
    }));
  },
});
