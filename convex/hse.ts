import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const reportIncident = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.string(), // "incident", "hazard"
    location: v.string(), // "camp", "site"
    severity: v.string(), // "low", "medium", "high", "critical"
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

export const listIncidents = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("hseIncidents");
    if (args.userId) {
      q = q.filter((f) => f.eq(f.field("reportedBy"), args.userId));
    }
    const incidents = await q.order("desc").collect();
    
    return Promise.all(incidents.map(async (inc) => {
      const imageUrls = await Promise.all(
        (inc.images || []).map(async (id) => {
          try {
            return await ctx.storage.getUrl(id);
          } catch (e) {
            return null;
          }
        })
      );
      return { ...inc, imageUrls: imageUrls.filter(Boolean) };
    }));
  },
});
