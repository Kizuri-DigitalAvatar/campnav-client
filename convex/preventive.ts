import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    type: v.string(),
    frequency: v.string(),
    nextDue: v.number(),
    assignedTo: v.optional(v.id("users")),
    checklist: v.array(v.object({
      item: v.string(),
      completed: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("preventiveMaintenance", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("preventiveMaintenance").order("desc").collect();
    return Promise.all(items.map(async (item) => {
      let assignedName = "Unassigned";
      if (item.assignedTo) {
        const user = await ctx.db.get(item.assignedTo);
        if (user) assignedName = user.name;
      }
      return { ...item, assignedName };
    }));
  },
});

export const updateStatus = mutation({
  args: { id: v.id("preventiveMaintenance"), status: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { 
      status: args.status,
      completedAt: args.status === "completed" ? Date.now() : undefined,
      lastCompleted: args.status === "completed" ? Date.now() : undefined,
    });
  },
});
