import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const rooms = await ctx.db.query("rooms").order("desc").collect();
        return Promise.all(
            rooms.map(async (r) => {
                let occupantName = null;
                if (r.occupantId) {
                    try {
                        const user = await ctx.db.get(r.occupantId);
                        if (user) {
                            occupantName = user.name;
                        } else {
                            occupantName = "Unknown (Deleted)";
                        }
                    } catch (e) {
                        console.error("Failed to fetch occupant for room", r._id, r.occupantId, e);
                        occupantName = "Error Loading";
                    }
                }
                return { ...r, occupantName };
            })
        );
    },
});

export const create = mutation({
    args: {
        roomNumber: v.string(),
        category: v.string(),
        capacity: v.number(),
        pricePerNight: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("rooms", {
            ...args,
            status: "available",
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("rooms"),
        roomNumber: v.optional(v.string()),
        category: v.optional(v.string()),
        capacity: v.optional(v.number()),
        status: v.optional(v.string()),
        occupantId: v.optional(v.union(v.id("users"), v.null())),
        pricePerNight: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...rest } = args;
        // Handle the null case for occupantId specifically because of union
        const updateData: any = { ...rest };
        if (updateData.occupantId === null) {
            updateData.occupantId = undefined;
        }
        await ctx.db.patch(id, updateData);
    },
});

export const deleteRoom = mutation({
    args: { id: v.id("rooms") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const assignOccupant = mutation({
    args: {
        roomId: v.id("rooms"),
        userId: v.union(v.id("users"), v.null()),
    },
    handler: async (ctx, args) => {
        const status = args.userId ? "occupied" : "available";
        const occupantId = args.userId === null ? undefined : args.userId;
        await ctx.db.patch(args.roomId, { occupantId, status });
    },
});
