import { query, mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";

export const getActiveBroadcasts = query({
  args: {},
  handler: async (ctx) => {
    const broadcasts = await ctx.db
      .query("emergencyBroadcasts")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    
    // Also get recently resolved broadcasts (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentResolved = await ctx.db
      .query("emergencyBroadcasts")
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "resolved"),
          q.gt(q.field("resolvedAt"), oneDayAgo)
        )
      )
      .collect();
    
    // Enrich with user information
    const enrichedBroadcasts = await Promise.all(
      [...broadcasts, ...recentResolved].map(async (broadcast) => {
        const user = broadcast.userId ? await ctx.db.get(broadcast.userId) as Doc<"users"> | null : null;
        return {
          ...broadcast,
          createdBy: user?.name || "System",
        };
      })
    );
    
    return enrichedBroadcasts.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getIncidents = query({
  args: {
    status: v.optional(v.string()),
    severity: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = args.status
      ? ctx.db.query("safetyIncidents").withIndex("by_status", (q) => q.eq("status", args.status!))
      : args.severity
        ? ctx.db.query("safetyIncidents").withIndex("by_severity", (q) => q.eq("severity", args.severity!))
        : args.location
          ? ctx.db.query("safetyIncidents").withIndex("by_location", (q) => q.eq("location", args.location!))
          : ctx.db.query("safetyIncidents");

    if (args.status && args.severity) query = query.filter((q) => q.eq(q.field("severity"), args.severity));
    if ((args.status || args.severity) && args.location) query = query.filter((q) => q.eq(q.field("location"), args.location));
    
    const incidents = await query.order("desc").collect();
    
    // Enrich with user information
    return Promise.all(
      incidents.map(async (incident) => {
        const user = await ctx.db.get(incident.userId);
        return {
          ...incident,
          reportedBy: user?.name || "Unknown",
        };
      })
    );
  },
});

export const getSafetyKPIs = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // Get incidents from last 30 days
    const recentIncidents = await ctx.db
      .query("safetyIncidents")
      .withIndex("by_reportedAt", (q) => q.gte("reportedAt", thirtyDaysAgo))
      .collect();
    
    // Get all incidents for trend analysis
    const allIncidents = await ctx.db.query("safetyIncidents").collect();
    
    // Get recent audits
    const recentAudits = await ctx.db
      .query("safetyAudits")
      .withIndex("by_auditDate", (q) => q.gte("auditDate", thirtyDaysAgo))
      .collect();
    
    // Get active emergency broadcasts
    const activeBroadcasts = await ctx.db
      .query("emergencyBroadcasts")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    
    // Incident statistics
    const totalIncidents = recentIncidents.length;
    const criticalIncidents = recentIncidents.filter(i => i.severity === "critical").length;
    const highIncidents = recentIncidents.filter(i => i.severity === "high").length;
    const openIncidents = recentIncidents.filter(i => i.status === "open").length;
    const resolvedIncidents = recentIncidents.filter(i => i.status === "resolved" || i.status === "closed").length;
    
    // Incident type breakdown
    const incidentsByType = recentIncidents.reduce((acc, incident) => {
      acc[incident.type] = (acc[incident.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Incident location breakdown
    const incidentsByLocation = recentIncidents.reduce((acc, incident) => {
      acc[incident.location] = (acc[incident.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Incident severity breakdown
    const incidentsBySeverity = recentIncidents.reduce((acc, incident) => {
      acc[incident.severity] = (acc[incident.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Audit statistics
    const totalAudits = recentAudits.length;
    const passedAudits = recentAudits.filter(a => a.status === "passed").length;
    const failedAudits = recentAudits.filter(a => a.status === "failed").length;
    const averageAuditScore = recentAudits.length > 0 
      ? Math.round(recentAudits.reduce((sum, a) => sum + a.overallScore, 0) / recentAudits.length)
      : 0;
    
    // Calculate safety score (0-100)
    const severityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
    const incidentScore = recentIncidents.reduce((sum, i) => sum + (severityWeights[i.severity as keyof typeof severityWeights] || 1), 0);
    const maxPossibleScore = Math.max(recentIncidents.length * 4, 1);
    const safetyIncidentScore = Math.max(0, 100 - (incidentScore / maxPossibleScore) * 100);
    
    const auditScore = averageAuditScore;
    const overallSafetyScore = Math.round((safetyIncidentScore * 0.6) + (auditScore * 0.4));
    
    // Trend data (last 7 days)
    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - (i * 24 * 60 * 60 * 1000));
      const dayStart = date.setHours(0, 0, 0, 0);
      const dayEnd = date.setHours(23, 59, 59, 999);
      
      const dayIncidents = allIncidents.filter(i => 
        i.reportedAt >= dayStart && i.reportedAt <= dayEnd
      );
      
      trends.push({
        date: date.toISOString().split('T')[0],
        incidents: dayIncidents.length,
        critical: dayIncidents.filter(i => i.severity === "critical").length,
        high: dayIncidents.filter(i => i.severity === "high").length,
      });
    }
    
    return {
      totalIncidents,
      criticalIncidents,
      highIncidents,
      openIncidents,
      resolvedIncidents,
      incidentsByType,
      incidentsByLocation,
      incidentsBySeverity,
      totalAudits,
      passedAudits,
      failedAudits,
      averageAuditScore,
      activeBroadcasts: activeBroadcasts.length,
      overallSafetyScore,
      safetyIncidentScore: Math.round(safetyIncidentScore),
      auditScore,
      resolutionRate: totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 100,
      trends,
      daysWithoutIncident: calculateDaysWithoutIncident(allIncidents),
    };
  },
});

export const createIncident = mutation({
  args: {
    type: v.string(),
    severity: v.string(),
    location: v.string(),
    category: v.string(),
    description: v.string(),
    immediateAction: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateSystemUser(ctx);
    
    return await ctx.db.insert("safetyIncidents", {
      userId,
      type: args.type,
      severity: args.severity,
      location: args.location,
      category: args.category,
      description: args.description,
      immediateAction: args.immediateAction,
      images: args.images,
      status: "open",
      reportedAt: Date.now(),
    });
  },
});

// New mutation to delete an incident
export const deleteIncident = mutation({
  args: {
    id: v.id("safetyIncidents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const updateIncident = mutation({
  args: {
    id: v.id("safetyIncidents"),
    status: v.optional(v.string()),
    rootCause: v.optional(v.string()),
    preventiveAction: v.optional(v.string()),
    investigationNotes: v.optional(v.string()),
    correctiveActions: v.optional(v.array(v.object({
      action: v.string(),
      assignedTo: v.optional(v.string()),
      dueDate: v.optional(v.number()),
    }))),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    const updateData: Partial<Doc<"safetyIncidents">> = { ...rest };
    
    if (args.status === "resolved" || args.status === "closed") {
      updateData.resolvedAt = Date.now();
    }
    
    await ctx.db.patch(id, updateData);
  },
});

export const createAudit = mutation({
  args: {
    auditType: v.string(),
    location: v.string(),
    checklistItems: v.array(v.object({
      item: v.string(),
      category: v.string(),
      required: v.boolean(),
      completed: v.boolean(),
      score: v.optional(v.number()),
      notes: v.optional(v.string()),
    })),
    auditorName: v.string(),
    recommendations: v.optional(v.array(v.string())),
    followUpRequired: v.optional(v.boolean()),
    followUpDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateSystemUser(ctx);
    
    // Calculate overall score
    const completedItems = args.checklistItems.filter(item => item.completed);
    const scoredItems = completedItems.filter(item => item.score !== undefined);
    const averageScore = scoredItems.length > 0 
      ? scoredItems.reduce((sum, item) => sum + (item.score || 0), 0) / scoredItems.length
      : 0;
    const overallScore = Math.round((averageScore / 5) * 100); // Convert to percentage
    
    // Determine status
    let status = "failed";
    if (overallScore >= 90) status = "passed";
    else if (overallScore >= 70) status = "needs_improvement";
    
    // Set next audit date (30 days from now)
    const nextAuditDate = Date.now() + (30 * 24 * 60 * 60 * 1000);
    
    return await ctx.db.insert("safetyAudits", {
      userId,
      auditType: args.auditType,
      location: args.location,
      checklistItems: args.checklistItems,
      overallScore,
      status,
      auditorName: args.auditorName,
      auditDate: Date.now(),
      nextAuditDate,
      recommendations: args.recommendations,
      followUpRequired: args.followUpRequired || false,
      followUpDate: args.followUpDate,
    });
  },
});

export const createEmergencyBroadcast = mutation({
  args: {
    type: v.string(),
    severity: v.string(),
    title: v.string(),
    message: v.string(),
    affectedAreas: v.array(v.string()),
    instructions: v.optional(v.array(v.string())),
    estimatedDuration: v.optional(v.string()),
    targetAudience: v.array(v.string()),
    deliveryChannels: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateSystemUser(ctx);
    
    const broadcast = await ctx.db.insert("emergencyBroadcasts", {
      userId,
      type: args.type,
      severity: args.severity,
      title: args.title,
      message: args.message,
      affectedAreas: args.affectedAreas,
      instructions: args.instructions,
      estimatedDuration: args.estimatedDuration,
      status: "active",
      createdAt: Date.now(),
      targetAudience: args.targetAudience,
      deliveryChannels: args.deliveryChannels,
    });
    
    // In a real implementation, this would trigger actual notifications
    // For now, we'll just mark them as sent
    const deliveryStatus = args.deliveryChannels.map(channel => ({
      channel,
      sent: true,
      sentAt: Date.now(),
    }));
    
    await ctx.db.patch(broadcast, { deliveryStatus });
    
    return broadcast;
  },
});

export const resolveBroadcast = mutation({
  args: {
    id: v.id("emergencyBroadcasts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "resolved",
      resolvedAt: Date.now(),
    });
  },
});

// Helper function to get or create a system user for operations
async function getOrCreateSystemUser(ctx: MutationCtx) {
  const systemUser = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", "system@campnav.com"))
    .first();
  
  if (systemUser) return systemUser._id;
  
  return await ctx.db.insert("users", {
    name: "System",
    email: "system@campnav.com",
    role: "admin",
  });
}

// Helper function to calculate days without incident
function calculateDaysWithoutIncident(incidents: Doc<"safetyIncidents">[]): number {
  if (incidents.length === 0) return 999; // No incidents ever
  
  const sortedIncidents = incidents.sort((a, b) => b.reportedAt - a.reportedAt);
  const lastIncidentDate = new Date(sortedIncidents[0].reportedAt);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - lastIncidentDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
