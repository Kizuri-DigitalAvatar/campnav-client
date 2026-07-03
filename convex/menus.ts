import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: { category: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const menus = await ctx.db.query("menus").order("desc").collect();

            const results = await Promise.all(
                menus.map(async (menu) => {
                    let url: string | null = null;
                    if (menu.storageId) {
                        try {
                            url = await ctx.storage.getUrl(menu.storageId as any);
                        } catch (e) {
                            console.error("Failed to get menu storage URL", e);
                        }
                    }
                    const items = menu.items
                        ? await Promise.all(menu.items.map(async (item) => ({
                            ...item,
                            imageUrl: item.image ? await ctx.storage.getUrl(item.image as any) : null,
                        })))
                        : undefined;
                    return { ...menu, url, items };
                })
            );

            if (args.category) {
                return results.filter(m => m.category === args.category);
            }
            return results;
        } catch (e) {
            console.error("menus.list handler error", e);
            return [];
        }
    },
});

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MEAL_TYPE_ORDER = ["breakfast", "lunch", "dinner", "snack", "drink"];

type MenuItem = {
    name: string;
    mealType: string;
    description?: string;
    image?: string;
};

// Plain-text fallback so surfaces that only read `content` still show the menu
function itemsToText(items: MenuItem[]) {
    const groups = new Map<string, MenuItem[]>();
    for (const item of items) {
        const key = item.mealType || "other";
        groups.set(key, [...(groups.get(key) || []), item]);
    }
    const orderedKeys = [...groups.keys()].sort(
        (a, b) => (MEAL_TYPE_ORDER.indexOf(a) + 100) % 100 - (MEAL_TYPE_ORDER.indexOf(b) + 100) % 100
    );
    return orderedKeys
        .map((key) => {
            const lines = (groups.get(key) || []).map(
                (i) => `- ${i.name}${i.description ? ` — ${i.description}` : ""}`
            );
            return `${key.toUpperCase()}\n${lines.join("\n")}`;
        })
        .join("\n\n");
}

export const getWeek = query({
    args: { weekStart: v.number() },
    handler: async (ctx, args) => {
        const menus = (await ctx.db.query("menus").collect()).filter(
            (m) => m.weekStart === args.weekStart && m.dayOfWeek !== undefined
        );
        return await Promise.all(menus.map(async (menu) => ({
            ...menu,
            items: menu.items
                ? await Promise.all(menu.items.map(async (item) => ({
                    ...item,
                    imageUrl: item.image ? await ctx.storage.getUrl(item.image as any) : null,
                })))
                : undefined,
        })));
    },
});

export const saveWeek = mutation({
    args: {
        weekStart: v.number(),
        days: v.array(v.object({
            dayOfWeek: v.number(),
            items: v.array(v.object({
                name: v.string(),
                mealType: v.string(),
                description: v.optional(v.string()),
                image: v.optional(v.string()),
            })),
        })),
    },
    handler: async (ctx, args) => {
        const existing = (await ctx.db.query("menus").collect()).filter(
            (m) => m.weekStart === args.weekStart && m.dayOfWeek !== undefined
        );

        for (const day of args.days) {
            const match = existing.find((m) => m.dayOfWeek === day.dayOfWeek);
            const items = day.items
                .map((i) => ({
                    ...i,
                    name: i.name.trim(),
                    description: i.description?.trim() || undefined,
                }))
                .filter((i) => i.name);

            if (items.length === 0) {
                if (match) await ctx.db.delete(match._id);
                continue;
            }

            const fields = {
                items,
                content: itemsToText(items),
                uploadedAt: Date.now(),
            };

            if (match) {
                await ctx.db.patch(match._id, fields);
            } else {
                await ctx.db.insert("menus", {
                    name: `${DAY_NAMES[day.dayOfWeek]} Menu`,
                    type: "text",
                    category: "Room Service",
                    schedule: "weekly",
                    dayOfWeek: day.dayOfWeek,
                    weekStart: args.weekStart,
                    ...fields,
                });
            }
        }
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

        // Handle storage replacement or removal
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

        // Switching to text content
        if (args.content !== undefined) {
            updates.content = args.content;
        }

        // Update storage reference
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
