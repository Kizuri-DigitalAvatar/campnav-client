import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const create = mutation({
    args: {
        title: v.string(),
        content: v.string(),
        author: v.string(),
        priority: v.string(),
        coverImage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("announcements", {
            title: args.title,
            content: args.content,
            author: args.author,
            priority: args.priority,
            coverImage: args.coverImage,
            createdAt: Date.now(),
        });
        return id;
    },
});

export const remove = mutation({
    args: { id: v.id("announcements") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const list = query({
    args: {
        priority: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const baseQuery = args.priority && args.priority !== "all"
            ? ctx.db.query("announcements").withIndex("by_priority", (q) => q.eq("priority", args.priority!))
            : ctx.db.query("announcements");

        const list = await baseQuery.order("desc").collect();

        const results = await Promise.all(
            list.map(async (a) => {
                let coverImageUrl = null;
                if (a.coverImage) {
                    if (a.coverImage.startsWith("http")) {
                        coverImageUrl = a.coverImage;
                    } else {
                        try {
                            coverImageUrl = await ctx.storage.getUrl(a.coverImage);
                        } catch (e) {
                            console.error("Failed to get storage URL for", a.coverImage, e);
                            coverImageUrl = null;
                        }
                    }
                }
                return {
                    ...a,
                    coverImageUrl,
                };
            })
        );

        return results;
    },
});
