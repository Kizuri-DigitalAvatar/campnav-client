import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

export const create = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        date: v.number(),
        time: v.string(),
        location: v.string(),
        category: v.optional(v.string()),
        capacity: v.optional(v.number()),
        coverImage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("activities", {
            ...args,
        });
        const message = `📅 New activity: ${args.title} @ ${args.time} on ${new Date(args.date).toLocaleDateString()}`;
        await Promise.all([
            ctx.runMutation(api.notifications.sendRoleNotification, {
                role: "camper",
                type: "activity",
                message,
            }),
            ctx.runMutation(api.notifications.sendRoleNotification, {
                role: "camp-staff",
                type: "activity",
                message,
            }),
        ]);
        return id;
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        const list = await ctx.db.query("activities").order("asc").collect();
        return Promise.all(list.map(async (a) => {
            let coverImageUrl = null;
            if (a.coverImage) {
                try {
                    coverImageUrl = await ctx.storage.getUrl(a.coverImage);
                } catch (e) {
                    coverImageUrl = null;
                }
            }
            const interested = await ctx.db
                .query("activityInterests")
                .withIndex("by_activityId", (q) => q.eq("activityId", a._id))
                .collect();
            const interestedCount = a.interestedCount ?? interested.length;
            return { ...a, coverImageUrl, interestedCount, interested };
        }));
    },
});

export const listUpcoming = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        // Simplified: just get everything sorted by date for now
        // In a real app we'd filter by date >= startOfDay(now)
        return await ctx.db
            .query("activities")
            .withIndex("by_date", (q) => q.lt("date", now + 1000 * 60 * 60 * 24 * 7)) // Next 7 days approx
            .collect();
    },
});

export const update = mutation({
    args: {
        id: v.id("activities"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        date: v.optional(v.number()),
        time: v.optional(v.string()),
        location: v.optional(v.string()),
        category: v.optional(v.string()),
        capacity: v.optional(v.number()),
        coverImage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...rest } = args;
        await ctx.db.patch(id, rest);
    },
});

export const remove = mutation({
    args: { id: v.id("activities") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const get = query({
    args: { id: v.id("activities"), userId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        const activity = await ctx.db.get(args.id);
        if (!activity) return null;

        let coverImageUrl = null;
        if (activity.coverImage) {
            try {
                coverImageUrl = await ctx.storage.getUrl(activity.coverImage);
            } catch (e) {
                coverImageUrl = null;
            }
        }

        const interests = await ctx.db
            .query("activityInterests")
            .withIndex("by_activityId", (q) => q.eq("activityId", args.id))
            .collect();

        const interestedCount = interests.length;
        const isInterested = args.userId
            ? interests.some((i) => i.userId === args.userId)
            : false;

        return { ...activity, coverImageUrl, interestedCount, isInterested };
    },
});

export const toggleInterest = mutation({
    args: { activityId: v.id("activities"), userId: v.id("users") },
    handler: async (ctx, args) => {
        // Check existing
        const existing = await ctx.db
            .query("activityInterests")
            .withIndex("by_activity_user", (q) => q.eq("activityId", args.activityId).eq("userId", args.userId))
            .unique();

        if (existing) {
            await ctx.db.delete(existing._id);
            const count = await ctx.db
                .query("activityInterests")
                .withIndex("by_activityId", (q) => q.eq("activityId", args.activityId))
                .collect()
                .then((r) => r.length);
            await ctx.db.patch(args.activityId, { interestedCount: count });
            return { interested: false, interestedCount: count };
        }

        await ctx.db.insert("activityInterests", {
            activityId: args.activityId,
            userId: args.userId,
            createdAt: Date.now(),
        });

        // Notify admins about interest
        const user = await ctx.db.get(args.userId);
        await ctx.runMutation(api.notifications.sendRoleNotification, {
            role: "admin",
            type: "activity_interest",
            message: `${user?.name || "Someone"} is interested in an activity.`,
        });

        const count = await ctx.db
            .query("activityInterests")
            .withIndex("by_activityId", (q) => q.eq("activityId", args.activityId))
            .collect()
            .then((r) => r.length);
        await ctx.db.patch(args.activityId, { interestedCount: count });

        return { interested: true, interestedCount: count };
    },
});

export const listMyActivities = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const interests = await ctx.db
            .query("activityInterests")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();

        const activityIds = interests.map((i) => i.activityId);
        const activities = await Promise.all(
            activityIds.map((id) => ctx.db.get(id))
        );

        return activities.filter((a): a is NonNullable<typeof a> => a !== null);
    },
});

export const getRecommended = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const upcoming = await ctx.db
            .query("activities")
            .withIndex("by_date", (q) => q.gt("date", now))
            .order("asc")
            .take(10);

        // Sort by interestedCount descending and take top 3
        return upcoming
            .sort((a, b) => (b.interestedCount || 0) - (a.interestedCount || 0))
            .slice(0, 3);
    },
});
