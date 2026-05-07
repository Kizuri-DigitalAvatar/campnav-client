import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createIncident = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.string(),
    location: v.string(),
    severity: v.string(),
    reportedBy: v.id("users"),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const incidentId = await ctx.db.insert("hseIncidents", {
      ...args,
      status: "open",
      createdAt: Date.now(),
    });
    return incidentId;
  },
});

export const getIncidents = query({
  handler: async (ctx) => {
    return await ctx.db.query("hseIncidents").order("desc").collect();
  },
});

export const updateIncidentStatus = mutation({
  args: {
    incidentId: v.id("hseIncidents"),
    status: v.string(),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { incidentId, ...updates } = args;
    await ctx.db.patch(incidentId, {
      ...updates,
      resolvedAt: args.status === "resolved" ? Date.now() : undefined,
    });
  },
});

export const getIncidentsByStatus = query({
  args: {
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("hseIncidents")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});
