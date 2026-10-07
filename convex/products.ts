import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const list = query({
    args: {
        category: v.optional(v.string()),
        service: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
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
                    let imageUrl: string | null = null;
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
        } catch (e) {
            console.error("products.list handler error", e);
            return [];
        }
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
        const id = await ctx.db.insert("products", args);

        // Announce new products to residents and guests, linking straight to them
        if (args.isAvailable) {
            const isRoomService = args.service === "room-service" || args.service === "room_service";
            await ctx.runMutation(api.notifications.sendRoleNotification, {
                role: "resident",
                type: "new_product",
                message: `🆕 New in the ${isRoomService ? "room service menu" : "shop"}: ${args.name} (Le ${args.price.toFixed(2)}). Tap to take a look.`,
                link: isRoomService ? "/app/room-service" : `/app/shop?product=${id}`,
            });
        }
        return id;
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
