import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const markAsResolved = mutation({
    args: { id: v.id("reports") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: "resolved" });
    },
});

export const list = query({
    args: {
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const baseQuery = args.status && args.status !== "all"
            ? ctx.db.query("reports").withIndex("by_status", (q) => q.eq("status", args.status!))
            : ctx.db.query("reports");

        const reports = await baseQuery.order("desc").collect();

        const results = await Promise.all(
            reports.map(async (r) => {
                let userName = "Deleted User";
                if (r.userId) {
                    try {
                        const user = await ctx.db.get(r.userId);
                        if (user) {
                            userName = user.name;
                        }
                    } catch (e) {
                        console.error("Failed to fetch user for report", r._id, r.userId, e);
                    }
                }
                return { ...r, userName };
            })
        );

        return results;
    },
});
