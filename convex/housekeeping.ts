import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const assign = mutation({
    args: {
        housekeeperId: v.id("users"),
        roomNumber: v.string(),
        serviceType: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("housekeeping", {
            housekeeperId: args.housekeeperId,
            roomNumber: args.roomNumber,
            serviceType: args.serviceType,
            status: "pending",
            assignedAt: Date.now(),
        });
    },
});

export const updateStatus = mutation({
    args: { id: v.id("housekeeping"), status: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: args.status });
    },
});

export const remove = mutation({
    args: { id: v.id("housekeeping") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        const assignments = await ctx.db.query("housekeeping").order("desc").collect();
        return Promise.all(
            assignments.map(async (a) => {
                let housekeeperName = "Unknown";
                if (a.housekeeperId) {
                    try {
                        const housekeeper = await ctx.db.get(a.housekeeperId);
                        if (housekeeper) {
                            housekeeperName = housekeeper.name;
                        }
                    } catch (e) {
                        console.error("Failed to fetch housekeeper", a._id, a.housekeeperId, e);
                    }
                }
                return { ...a, housekeeperName };
            })
        );
    },
});
