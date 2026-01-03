import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: {
        category: v.optional(v.string()),
        service: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let baseQuery;
        if (args.service && args.service !== "none") {
            baseQuery = ctx.db.query("products").withIndex("by_service", (q) => q.eq("service", args.service!));
        } else if (args.category && args.category !== "all") {
            baseQuery = ctx.db.query("products").withIndex("by_category", (q) => q.eq("category", args.category!));
        } else {
            baseQuery = ctx.db.query("products");
        }

        const products = await baseQuery.order("desc").collect();

        return Promise.all(
            products.map(async (p) => {
                let imageUrl = null;
                if (p.image) {
                    if (p.image.startsWith("http")) {
                        imageUrl = p.image;
                    } else {
                        try {
                            imageUrl = await ctx.storage.getUrl(p.image);
                        } catch (e) {
                            console.error("Failed to get product image URL", p.image, e);
                            imageUrl = null;
                        }
                    }
                }
                return { ...p, imageUrl };
            })
        );
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        price: v.number(),
        category: v.string(),
        service: v.optional(v.string()),
        image: v.optional(v.string()),
        stock: v.number(),
        isAvailable: v.boolean(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("products", args);
    },
});

export const update = mutation({
    args: {
        id: v.id("products"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        price: v.optional(v.number()),
        category: v.optional(v.string()),
        service: v.optional(v.string()),
        image: v.optional(v.string()),
        stock: v.optional(v.number()),
        isAvailable: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...rest } = args;
        await ctx.db.patch(id, rest);
    },
});

export const remove = mutation({
    args: { id: v.id("products") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
