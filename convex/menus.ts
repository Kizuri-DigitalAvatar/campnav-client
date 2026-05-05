import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: { category: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const menusQuery = ctx.db.query("menus");
        const menus = await menusQuery.order("desc").collect();

        const results = await Promise.all(
            menus.map(async (menu) => {
                let url = null;
                if (menu.storageId) {
                    try {
                        url = await ctx.storage.getUrl(menu.storageId);
                    } catch (e) {
                        console.error("Failed to get menu storage URL", e);
                    }
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
        storageId: v.optional(v.string()),
        content: v.optional(v.string()),
        type: v.string(),
        schedule: v.optional(v.string()),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (!args.storageId && !args.content) {
            throw new Error("Provide either a file or inline content");
        }
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
            if (menu.storageId) {
                await ctx.storage.delete(menu.storageId);
            }
            await ctx.db.delete(args.id);
        }
    },
});

export const update = mutation({
    args: {
        id: v.id("menus"),
        name: v.optional(v.string()),
        category: v.optional(v.string()),
        schedule: v.optional(v.string()),
        content: v.optional(v.string()),
        storageId: v.optional(v.string()),
        type: v.optional(v.string()),
        clearStorage: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const menu = await ctx.db.get(args.id);
        if (!menu) throw new Error("Menu not found");

        if (args.storageId && args.storageId !== menu.storageId && menu.storageId) {
            await ctx.storage.delete(menu.storageId);
        } else if (args.clearStorage && menu.storageId) {
            await ctx.storage.delete(menu.storageId);
        }

        const updates: any = {};
        if (args.name !== undefined) updates.name = args.name;
        if (args.category !== undefined) updates.category = args.category;
        if (args.schedule !== undefined) updates.schedule = args.schedule;
        if (args.type !== undefined) updates.type = args.type;
        if (args.content !== undefined) updates.content = args.content;

        if (args.storageId !== undefined) {
            updates.storageId = args.storageId;
            if (args.content === undefined) updates.content = null;
        } else if (args.clearStorage) {
            updates.storageId = undefined;
        }

        await ctx.db.patch(args.id, updates);
        return await ctx.db.get(args.id);
    },
});
