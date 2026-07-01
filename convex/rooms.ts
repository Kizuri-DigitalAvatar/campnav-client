import { query, mutation } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
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

export const getRooms = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("rooms").collect();
    },
});

export const create = mutation({
    args: {
        roomNumber: v.string(),
        category: v.string(),
        capacity: v.number(),
        pricePerNight: v.optional(v.number()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { status = "available", ...roomData } = args;
        const roomId = await ctx.db.insert("rooms", {
            ...roomData,
            status,
        });
        await recordOccupancySnapshot(ctx);
        return roomId;
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
        const { id, occupantId, ...rest } = args;
        // Handle the null case for occupantId specifically because of union
        const updateData: Partial<Doc<"rooms">> = { ...rest };
        if (occupantId !== undefined) {
            updateData.occupantId = occupantId === null ? undefined : occupantId;
        }
        await ctx.db.patch(id, updateData);
        await recordOccupancySnapshot(ctx);
    },
});

export const deleteRoom = mutation({
    args: { id: v.id("rooms") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
        await recordOccupancySnapshot(ctx);
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
        await recordOccupancySnapshot(ctx);
    },
});

export const getOccupancyStats = query({
    args: {},
    handler: async (ctx) => {
        const rooms = await ctx.db.query("rooms").collect();
        
        const totalRooms = rooms.length;
        const occupiedRooms = rooms.filter(r => r.status === "occupied").length;
        const availableRooms = rooms.filter(r => r.status === "available").length;
        const maintenanceRooms = rooms.filter(r => r.status === "maintenance").length;
        
        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
        
        // Group by category
        const categoryStats = rooms.reduce((acc, room) => {
            if (!acc[room.category]) {
                acc[room.category] = {
                    total: 0,
                    occupied: 0,
                    available: 0,
                    maintenance: 0
                };
            }
            acc[room.category].total++;
            if (room.status === "occupied" || room.status === "available" || room.status === "maintenance") {
                acc[room.category][room.status]++;
            }
            return acc;
        }, {} as Record<string, { total: number; occupied: number; available: number; maintenance: number }>);
        
        // Calculate revenue potential
        const occupiedRevenue = rooms
            .filter(r => r.status === "occupied" && r.pricePerNight)
            .reduce((sum, r) => sum + (r.pricePerNight || 0), 0);
        
        const potentialRevenue = rooms
            .filter(r => r.pricePerNight)
            .reduce((sum, r) => sum + (r.pricePerNight || 0), 0);
        
        return {
            totalRooms,
            occupiedRooms,
            availableRooms,
            maintenanceRooms,
            occupancyRate: Math.round(occupancyRate * 10) / 10,
            categoryStats,
            occupiedRevenue,
            potentialRevenue,
            revenueUtilization: potentialRevenue > 0 ? Math.round((occupiedRevenue / potentialRevenue) * 1000) / 10 : 0
        };
    },
});

export const getOccupancyTrends = query({
    args: {
        days: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const days = args.days || 30;
        const now = Date.now();
        const dayInMs = 24 * 60 * 60 * 1000;

        const snapshots = await ctx.db.query("occupancySnapshots").collect();
        const snapshotsByDate = new Map(snapshots.map((snapshot) => [snapshot.date, snapshot]));
        const currentStats = await calculateOccupancyStats(ctx);

        const trends = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now - (i * dayInMs));
            const dateKey = date.toISOString().split('T')[0];
            const snapshot = snapshotsByDate.get(dateKey);
            const occupancyRate = snapshot?.occupancyRate ?? currentStats.occupancyRate;
            const availableRooms = snapshot?.availableRooms ?? currentStats.availableRooms;
            const maintenanceRooms = snapshot?.maintenanceRooms ?? currentStats.maintenanceRooms;
            trends.push({
                date: dateKey,
                occupancy: occupancyRate,
                available: availableRooms,
                maintenance: maintenanceRooms
            });
        }
        
        return trends;
    },
});

async function calculateOccupancyStats(ctx: QueryCtx | MutationCtx) {
    const rooms = await ctx.db.query("rooms").collect();
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
    const availableRooms = rooms.filter((r) => r.status === "available").length;
    const maintenanceRooms = rooms.filter((r) => r.status === "maintenance").length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 1000) / 10 : 0;

    return {
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms,
        occupancyRate,
    };
}

async function recordOccupancySnapshot(ctx: MutationCtx) {
    const date = new Date().toISOString().split("T")[0];
    const stats = await calculateOccupancyStats(ctx);
    const existing = await ctx.db
        .query("occupancySnapshots")
        .withIndex("by_date", (q) => q.eq("date", date))
        .first();

    const snapshot: Omit<Doc<"occupancySnapshots">, "_id" | "_creationTime"> = {
        date,
        ...stats,
        createdAt: Date.now(),
    };

    if (existing) {
        await ctx.db.patch(existing._id, snapshot);
        return;
    }

    await ctx.db.insert("occupancySnapshots", snapshot);
}
