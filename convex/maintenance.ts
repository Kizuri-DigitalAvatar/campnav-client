import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createMaintenanceTask = mutation({
  args: {
    title: v.string(),
    type: v.string(), // "grease_service", "fumigation", "ac_service", "general"
    frequency: v.string(), // "daily", "weekly", "monthly", "quarterly", "annually"
    assignedTo: v.optional(v.id("users")),
    nextDue: v.number(),
    checklist: v.array(v.object({
      item: v.string(),
      completed: v.boolean(),
      notes: v.optional(v.string()),
      completedAt: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Validate assigned user exists
    if (args.assignedTo) {
      const user = await ctx.db.get(args.assignedTo);
      if (!user) {
        throw new Error("Assigned user not found");
      }
    }

    return await ctx.db.insert("preventiveMaintenance", {
      title: args.title,
      type: args.type,
      frequency: args.frequency,
      assignedTo: args.assignedTo,
      nextDue: args.nextDue,
      checklist: args.checklist,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const updateMaintenanceTask = mutation({
  args: {
    taskId: v.id("preventiveMaintenance"),
    status: v.string(), // "pending", "in_progress", "completed", "overdue"
    checklist: v.optional(v.array(v.object({
      item: v.string(),
      completed: v.boolean(),
      notes: v.optional(v.string()),
      completedAt: v.optional(v.number()),
    }))),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Maintenance task not found");
    }

    const updateData: any = { status: args.status };

    // Add timestamps for status changes
    const now = Date.now();
    if (args.status === "in_progress") {
      updateData.lastCompleted = task.lastCompleted; // Store previous completion
    } else if (args.status === "completed") {
      updateData.completedAt = now;
      updateData.lastCompleted = now;
    }

    // Update checklist if provided
    if (args.checklist) {
      updateData.checklist = args.checklist.map(item => ({
        ...item,
        completedAt: item.completed && !item.completedAt ? now : item.completedAt,
      }));
    }

    await ctx.db.patch(args.taskId, updateData);
    return await ctx.db.get(args.taskId);
  },
});

export const scheduleNextMaintenance = mutation({
  args: {
    taskId: v.id("preventiveMaintenance"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Maintenance task not found");
    }

    // Calculate next due date based on frequency
    const lastCompleted = task.lastCompleted || task.createdAt;
    let nextDue = lastCompleted;

    switch (task.frequency) {
      case "daily":
        nextDue = lastCompleted + (24 * 60 * 60 * 1000);
        break;
      case "weekly":
        nextDue = lastCompleted + (7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        nextDue = lastCompleted + (30 * 24 * 60 * 60 * 1000);
        break;
      case "quarterly":
        nextDue = lastCompleted + (90 * 24 * 60 * 60 * 1000);
        break;
      case "annually":
        nextDue = lastCompleted + (365 * 24 * 60 * 60 * 1000);
        break;
    }

    // Reset task for next cycle
    await ctx.db.patch(args.taskId, {
      nextDue,
      status: "pending",
      checklist: task.checklist.map(item => ({
        ...item,
        completed: false,
        completedAt: undefined,
      })),
    });

    return await ctx.db.get(args.taskId);
  },
});

export const getMaintenanceTasks = query({
  args: {
    status: v.optional(v.string()),
    type: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    overdue: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = args.status
      ? ctx.db.query("preventiveMaintenance").withIndex("by_status", (q) => q.eq("status", args.status!))
      : args.type
        ? ctx.db.query("preventiveMaintenance").withIndex("by_type", (q) => q.eq("type", args.type!))
        : ctx.db.query("preventiveMaintenance");

    if (args.status && args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }
    if (args.assignedTo) {
      query = query.filter((q) => q.eq(q.field("assignedTo"), args.assignedTo));
    }
    
    let tasks = await query.order("desc").collect();
    
    // Filter overdue tasks if requested
    if (args.overdue) {
      const now = Date.now();
      tasks = tasks.filter(task => 
        task.nextDue < now && 
        (task.status === "pending" || task.status === "in_progress")
      );
    }
    
    // Enrich with user information
    return Promise.all(
      tasks.map(async (task) => {
        const assignedUser = task.assignedTo ? await ctx.db.get(task.assignedTo) : null;
        return {
          ...task,
          assignedUserName: assignedUser?.name || "Unassigned",
          isOverdue: task.nextDue < Date.now() && task.status !== "completed",
          daysOverdue: Math.max(0, Math.ceil((Date.now() - task.nextDue) / (24 * 60 * 60 * 1000))),
        };
      })
    );
  },
});

export const getMaintenanceSchedule = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("preventiveMaintenance")
      .filter((q) => 
        q.and(
          q.gte(q.field("nextDue"), args.startDate),
          q.lte(q.field("nextDue"), args.endDate)
        )
      )
      .collect();
    
    // Group tasks by date
    const schedule = tasks.reduce((acc, task) => {
      const dateStr = new Date(task.nextDue).toDateString();
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(task);
      return acc;
    }, {} as Record<string, any[]>);
    
    return schedule;
  },
});

export const getMaintenanceStats = query({
  args: {},
  handler: async (ctx, args) => {
    const tasks = await ctx.db.query("preventiveMaintenance").collect();
    const now = Date.now();
    
    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(t => t.status === "pending").length;
    const inProgressTasks = tasks.filter(t => t.status === "in_progress").length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const overdueTasks = tasks.filter(t => 
      t.nextDue < now && 
      (t.status === "pending" || t.status === "in_progress")
    ).length;
    
    // Stats by type
    const typeStats = tasks.reduce((acc, task) => {
      if (!acc[task.type]) {
        acc[task.type] = {
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          overdue: 0,
        };
      }
      
      acc[task.type].total++;
      acc[task.type][task.status]++;
      
      if (task.nextDue < now && (task.status === "pending" || task.status === "in_progress")) {
        acc[task.type].overdue++;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    // Stats by frequency
    const frequencyStats = tasks.reduce((acc, task) => {
      if (!acc[task.frequency]) {
        acc[task.frequency] = 0;
      }
      acc[task.frequency]++;
      return acc;
    }, {} as Record<string, number>);
    
    // Upcoming tasks (next 7 days)
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);
    const upcomingTasks = tasks.filter(task => 
      task.nextDue >= now && 
      task.nextDue <= sevenDaysFromNow &&
      task.status === "pending"
    ).length;
    
    return {
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      typeStats,
      frequencyStats,
      upcomingTasks,
    };
  },
});

export const getMaintenanceChecklistTemplate = query({
  args: {
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const templates = {
      grease_service: [
        "Check grease levels in all equipment",
        "Clean and lubricate moving parts",
        "Inspect for leaks and wear",
        "Document grease consumption",
        "Schedule next service",
      ],
      fumigation: [
        "Inspect all areas for pest activity",
        "Apply fumigation treatment",
        "Seal entry points",
        "Post warning signs",
        "Document treatment details",
      ],
      ac_service: [
        "Check refrigerant levels",
        "Clean or replace filters",
        "Inspect ductwork and vents",
        "Test thermostat functionality",
        "Record temperature readings",
      ],
      general: [
        "Visual inspection of equipment",
        "Test safety features",
        "Check for unusual noises",
        "Verify proper operation",
        "Document findings",
      ],
    };
    
    return templates[args.type as keyof typeof templates] || templates.general;
  },
});
