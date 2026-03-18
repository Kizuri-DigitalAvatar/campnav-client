import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: { category: v.optional(v.string()) },
    handler: async (ctx, args) => {
        let menusQuery = ctx.db.query("menus");
        const menus = await menusQuery.order("desc").collect();

        const results = await Promise.all(
            menus.map(async (menu) => {
                let url = null;
                try {
                    url = await ctx.storage.getUrl(menu.storageId);
                } catch (e) {
                    console.error("Failed to get menu storage URL", e);
                }
                return { ...menu, url };
            })
        );

        if (args.category) {
            return results.filter(m => m.category === args.category);
        }
        return results;
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        storageId: v.string(),
        type: v.string(),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("menus", {
            ...args,
            uploadedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("menus") },
    handler: async (ctx, args) => {
        const menu = await ctx.db.get(args.id);
        if (menu) {
            await ctx.storage.delete(menu.storageId);
            await ctx.db.delete(args.id);
        }
    },
});
