import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createSafetyAudit = mutation({
  args: {
    title: v.string(),
    category: v.string(), // "daily", "weekly", "monthly", "audit"
    items: v.array(v.object({
      description: v.string(),
      required: v.boolean(),
      completed: v.optional(v.boolean()),
      notes: v.optional(v.string()),
      completedBy: v.optional(v.id("users")),
      completedAt: v.optional(v.number()),
    })),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate assigned user exists
    if (args.assignedTo) {
      const user = await ctx.db.get(args.assignedTo);
      if (!user) {
        throw new Error("Assigned user not found");
      }
    }

    // Calculate overall score
    const requiredItems = args.items.filter(item => item.required);
    const completedRequiredItems = requiredItems.filter(item => item.completed);
    const overallScore = requiredItems.length > 0 
      ? Math.round((completedRequiredItems.length / requiredItems.length) * 100)
      : 0;

    // Determine status
    let status = "pending";
    if (overallScore >= 90) status = "passed";
    else if (overallScore >= 70) status = "needs_improvement";
    else status = "failed";

    return await ctx.db.insert("safetyChecklists", {
      title: args.title,
      category: args.category,
      items: args.items,
      assignedTo: args.assignedTo,
      dueDate: args.dueDate,
      status,
      overallScore,
      createdAt: Date.now(),
    });
  },
});

export const updateSafetyAudit = mutation({
  args: {
    auditId: v.id("safetyChecklists"),
    items: v.optional(v.array(v.object({
      description: v.string(),
      required: v.boolean(),
      completed: v.boolean(),
      notes: v.optional(v.string()),
      completedBy: v.optional(v.id("users")),
      completedAt: v.optional(v.number()),
    }))),
    status: v.optional(v.string()),
    followUpRequired: v.optional(v.boolean()),
    followUpDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Safety audit not found");
    }

    const updateData: any = {};

    if (args.items) {
      // Calculate new overall score
      const requiredItems = args.items.filter(item => item.required);
      const completedRequiredItems = requiredItems.filter(item => item.completed);
      const overallScore = requiredItems.length > 0 
        ? Math.round((completedRequiredItems.length / requiredItems.length) * 100)
        : 0;

      // Determine status based on score
      let status = "pending";
      if (overallScore >= 90) status = "passed";
      else if (overallScore >= 70) status = "needs_improvement";
      else status = "failed";

      updateData.items = args.items;
      updateData.overallScore = overallScore;
      updateData.status = status;
    }

    if (args.status) {
      updateData.status = args.status;
    }

    if (args.followUpRequired !== undefined) {
      updateData.followUpRequired = args.followUpRequired;
      updateData.followUpDate = args.followUpDate;
    }

    await ctx.db.patch(args.auditId, updateData);
    return await ctx.db.get(args.auditId);
  },
});

export const getSafetyAudits = query({
  args: {
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const query = args.status
      ? ctx.db.query("safetyChecklists").withIndex("by_status", (q) => q.eq("status", args.status!))
      : args.category
        ? ctx.db.query("safetyChecklists").withIndex("by_category", (q) => q.eq("category", args.category!))
        : ctx.db.query("safetyChecklists");

    let filteredQuery = query;
    if (args.status && args.category) {
      filteredQuery = filteredQuery.filter((q) => q.eq(q.field("category"), args.category));
    }
    if (args.assignedTo) {
      filteredQuery = filteredQuery.filter((q) => q.eq(q.field("assignedTo"), args.assignedTo));
    }
    
    const audits = await filteredQuery.order("desc").collect();
    
    // Enrich with user information
    return Promise.all(
      audits.map(async (audit) => {
        const assignedUser = audit.assignedTo ? await ctx.db.get(audit.assignedTo) : null;
        return {
          ...audit,
          assignedUserName: assignedUser?.name || "Unassigned",
          completionRate: Math.round((audit.items.filter(item => item.completed).length / audit.items.length) * 100),
        };
      })
    );
  },
});

export const getAuditStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const startDate = args.startDate || monthStart.getTime();
    const endDate = args.endDate || Date.now();
    
    const audits = await ctx.db
      .query("safetyChecklists")
      .filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), startDate),
          q.lte(q.field("createdAt"), endDate)
        )
      )
      .collect();
    
    const totalAudits = audits.length;
    const passedAudits = audits.filter(a => a.status === "passed").length;
    const failedAudits = audits.filter(a => a.status === "failed").length;
    const needsImprovementAudits = audits.filter(a => a.status === "needs_improvement").length;
    const pendingAudits = audits.filter(a => a.status === "pending").length;
    
    // Stats by category
    const categoryStats = audits.reduce((acc, audit) => {
      if (!acc[audit.category]) {
        acc[audit.category] = {
          total: 0,
          passed: 0,
          failed: 0,
          averageScore: 0,
        };
      }
      acc[audit.category].total++;
      if (audit.status === "passed") acc[audit.category].passed++;
      if (audit.status === "failed") acc[audit.category].failed++;
      acc[audit.category].averageScore += audit.overallScore || 0;
      return acc;
    }, {} as Record<string, { total: number; passed: number; failed: number; averageScore: number }>);
    
    // Calculate averages
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category];
      stats.averageScore = stats.total > 0 ? Math.round(stats.averageScore / stats.total) : 0;
    });
    
    // Overdue audits
    const now = Date.now();
    const overdueAudits = audits.filter(audit => 
      audit.dueDate < now && 
      (audit.status === "pending" || audit.status === "needs_improvement")
    ).length;
    
    // Completion rate
    const completedAudits = audits.filter(audit => 
      audit.status === "passed" || audit.status === "failed" || audit.status === "needs_improvement"
    ).length;
    const completionRate = totalAudits > 0 ? Math.round((completedAudits / totalAudits) * 100) : 0;
    
    return {
      totalAudits,
      passedAudits,
      failedAudits,
      needsImprovementAudits,
      pendingAudits,
      overdueAudits,
      completionRate,
      averageScore: totalAudits > 0 
        ? Math.round(audits.reduce((sum, a) => sum + (a.overallScore || 0), 0) / totalAudits)
        : 0,
      categoryStats,
    };
  },
});

export const getOverdueAudits = query({
  args: {},
  handler: async (ctx, args) => {
    const now = Date.now();
    const audits = await ctx.db
      .query("safetyChecklists")
      .filter((q) => 
        q.and(
          q.lt(q.field("dueDate"), now),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "needs_improvement")
          )
        )
      )
      .collect();
    
    // Enrich with user information
    return Promise.all(
      audits.map(async (audit) => {
        const assignedUser = audit.assignedTo ? await ctx.db.get(audit.assignedTo) : null;
        const daysOverdue = Math.ceil((now - audit.dueDate) / (24 * 60 * 60 * 1000));
        
        return {
          ...audit,
          assignedUserName: assignedUser?.name || "Unassigned",
          daysOverdue,
          urgency: daysOverdue > 7 ? "critical" : daysOverdue > 3 ? "high" : "medium",
        };
      })
    );
  },
});

export const createAuditTemplate = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    items: v.array(v.object({
      description: v.string(),
      required: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    // This would create a reusable audit template
    // For now, return the template data
    return {
      name: args.name,
      category: args.category,
      items: args.items,
      createdAt: Date.now(),
    };
  },
});

export const getAuditTemplates = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Return predefined audit templates based on category
    const templates = {
      daily: {
        name: "Daily Safety Checklist",
        category: "daily",
        items: [
          { description: "Check fire extinguishers", required: true },
          { description: "Inspect emergency exits", required: true },
          { description: "Test smoke detectors", required: true },
          { description: "Check first aid kits", required: true },
          { description: "Verify lighting in common areas", required: true },
          { description: "Inspect walkways for obstacles", required: true },
          { description: "Check security systems", required: true },
          { description: "Review incident log", required: true },
        ],
      },
      weekly: {
        name: "Weekly Safety Audit",
        category: "weekly",
        items: [
          { description: "Review all safety incidents", required: true },
          { description: "Inspect electrical systems", required: true },
          { description: "Check plumbing systems", required: true },
          { description: "Test emergency alarms", required: true },
          { description: "Inspect kitchen equipment", required: true },
          { description: "Review maintenance records", required: true },
          { description: "Check chemical storage", required: true },
          { description: "Verify training completion", required: true },
        ],
      },
      monthly: {
        name: "Monthly Comprehensive Audit",
        category: "monthly",
        items: [
          { description: "Complete fire safety inspection", required: true },
          { description: "Review all safety procedures", required: true },
          { description: "Inspect structural integrity", required: true },
          { description: "Test all emergency equipment", required: true },
          { description: "Review training records", required: true },
          { description: "Check inventory of safety supplies", required: true },
          { description: "Evaluate ventilation systems", required: true },
          { description: "Assess ergonomic conditions", required: true },
        ],
      },
      audit: {
        name: "Formal Safety Audit",
        category: "audit",
        items: [
          { description: "Review safety policy compliance", required: true },
          { description: "Evaluate emergency response procedures", required: true },
          { description: "Inspect all safety equipment", required: true },
          { description: "Review incident reports", required: true },
          { description: "Check training documentation", required: true },
          { description: "Assess risk assessments", required: true },
          { description: "Verify regulatory compliance", required: true },
          { description: "Review maintenance schedules", required: true },
        ],
      },
    };
    
    return args.category ? [templates[args.category as keyof typeof templates]] : Object.values(templates);
  },
});
