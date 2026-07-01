import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";

export const upsert = mutation({
  // ... (keep existing upsert)
  args: {
    email: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
    password: v.optional(v.string()),
    role: v.optional(v.string()),
    userCategory: v.optional(v.string()),
    userSubcategory: v.optional(v.string()),
    department: v.optional(v.string()),
    accessLevel: v.optional(v.number()),
    assignedDuties: v.optional(v.array(v.string())),
    durationStart: v.optional(v.number()),
    durationEnd: v.optional(v.number()),
    isOnSite: v.optional(v.boolean()),
    campStaffId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    const updateData: any = {
      name: args.name,
      image: args.image,
      role: args.role,
      userCategory: args.userCategory,
      userSubcategory: args.userSubcategory,
      department: args.department,
      accessLevel: args.accessLevel,
      assignedDuties: args.assignedDuties,
      durationStart: args.durationStart,
      durationEnd: args.durationEnd,
      isOnSite: args.isOnSite,
      campStaffId: args.campStaffId,
    };

    if (args.password !== undefined) {
      updateData.password = args.password;
    }

    if (existing) {
      await ctx.db.patch(existing._id, updateData);
      return (await ctx.db.get(existing._id))!;
    }

    const _id = await ctx.db.insert("users", {
      email: args.email,
      ...updateData,
      points: 0,
    });

    // If it's a new user and we have a password, send credentials
    if (args.password) {
      await ctx.db.insert("notifications", {
        userId: _id,
        type: "account_created",
        channel: "email",
        status: "pending",
        message: `Welcome to CAMPNAV, ${args.name}!\n\nYour account has been created. Here are your login credentials:\n\nEmail: ${args.email}\nPassword: ${args.password}\n\nPlease log in and change your password as soon as possible.`,
      });

      // Trigger email processing immediately
      await ctx.scheduler.runAfter(0, internal.email.processEmailNotifications, {});
    }

    return (await ctx.db.get(_id))!;
  },
});

export const deleteUser = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const list = query({
  args: {
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const baseQuery = args.role && args.role !== "all"
      ? ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", args.role!))
      : ctx.db.query("users");

    const users = await baseQuery.order("desc").collect();

    const results = await Promise.all(
      users.map(async (u) => {
        let imageUrl = null;
        if (u.image) {
          if (u.image.startsWith("http")) {
            imageUrl = u.image;
          } else {
            try {
              imageUrl = await ctx.storage.getUrl(u.image);
            } catch (e) {
              console.error("Failed to get storage URL for", u.image, e);
              imageUrl = null;
            }
          }
        }
        return {
          ...u,
          imageUrl,
        };
      })
    );

    return results;
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").order("desc").collect();
    return users;
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    const roles = ["camp_manager", "camp_supervisor", "staff", "resident"] as const;

    const byRole = roles.map((role) => {
      const count = users.filter((u) => u.role === role).length;
      const name = role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      return { name, value: count };
    });

    const departments = ["housekeeping", "maintenance", "kitchen", "shop", "electrical"] as const;
    const byDepartment = departments.map((dept) => {
      const count = users.filter((u) => u.department === dept).length;
      const name = dept.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      return { name, value: count };
    });

    const now = Date.now();
    const activeVisitors = users.filter((u) =>
      u.role === "resident" &&
      typeof u.durationStart === "number" && u.durationStart <= now &&
      (u.durationEnd === undefined || u.durationEnd === null || (typeof u.durationEnd === "number" && u.durationEnd >= now))
    ).length;

    const onLeaveCount = users.filter((u) =>
      u.onLeaveUntil && u.onLeaveUntil > now
    ).length;

    const onSiteCount = users.filter((u) => u.isOnSite === true).length;

    return {
      byRole,
      byDepartment,
      activeVisitors,
      onLeaveCount,
      onSiteCount,
      totalUsers: users.length,
    };
  },
});

export const verifyUser = query({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!user || user.password !== args.password) {
      return null;
    }

    let imageUrl = null;
    if (user.image) {
      if (user.image.startsWith("http")) {
        imageUrl = user.image;
      } else {
        try {
          imageUrl = await ctx.storage.getUrl(user.image);
        } catch (e) {
          imageUrl = null;
        }
      }
    }

    return { ...user, imageUrl, roomNumber: user.roomNumber };
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    roomNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    // Check if user exists
    const existingUser = await ctx.db.get(userId);
    if (!existingUser) {
      throw new Error("User not found. Please log in again.");
    }

    await ctx.db.patch(userId, {
      name: updates.name,
      email: updates.email,
      ...(updates.image !== undefined && { image: updates.image }),
      ...(updates.roomNumber !== undefined && { roomNumber: updates.roomNumber }),
    });

    return await ctx.db.get(userId);
  },
});

export const createUserWithRole = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.string(),
    department: v.optional(v.string()),
    assignedDuties: v.optional(v.array(v.string())),
    roomNumber: v.optional(v.string()),
    roomCategory: v.optional(v.string()),
    accessLevel: v.optional(v.number()),
    supervisorId: v.optional(v.id("users")),
    contractType: v.optional(v.string()),
    hireDate: v.optional(v.number()),
    emergencyContact: v.optional(v.object({
      name: v.string(),
      phone: v.string(),
      relationship: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existing) {
      throw new Error("User with this email already exists");
    }

    // Validate role hierarchy
    const validRoles = ["camp_manager", "camp_supervisor", "staff", "resident"];
    if (!validRoles.includes(args.role)) {
      throw new Error("Invalid role specified");
    }

    // Validate department for staff roles
    if (args.role === "staff" && !args.department) {
      throw new Error("Department is required for staff roles");
    }

    const validDepartments = ["housekeeping", "maintenance", "kitchen", "shop", "electrical"];
    if (args.department && !validDepartments.includes(args.department)) {
      throw new Error("Invalid department specified");
    }

    // Set default access levels based on role
    let accessLevel = args.accessLevel;
    if (!accessLevel) {
      switch (args.role) {
        case "camp_manager": accessLevel = 5; break;
        case "camp_supervisor": accessLevel = 4; break;
        case "staff": accessLevel = 3; break;
        case "resident": accessLevel = 1; break;
        default: accessLevel = 1;
      }
    }

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      role: args.role,
      department: args.department,
      assignedDuties: args.assignedDuties,
      roomNumber: args.roomNumber,
      roomCategory: args.roomCategory,
      accessLevel,
      supervisorId: args.supervisorId,
      contractType: args.contractType,
      hireDate: args.hireDate || Date.now(),
      emergencyContact: args.emergencyContact,
      points: 0,
      disciplinaryPoints: 0,
      leaveBalance: args.role === "staff" ? 21 : 0, // 21 days for staff
      isOnSite: args.role === "staff" ? false : undefined,
    });
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.string(),
    department: v.optional(v.string()),
    accessLevel: v.optional(v.number()),
    supervisorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate role hierarchy
    const validRoles = ["camp_manager", "camp_supervisor", "staff", "resident"];
    if (!validRoles.includes(args.role)) {
      throw new Error("Invalid role specified");
    }

    // Validate department for staff roles
    if (args.role === "staff" && !args.department) {
      throw new Error("Department is required for staff roles");
    }

    const validDepartments = ["housekeeping", "maintenance", "kitchen", "shop", "electrical"];
    if (args.department && !validDepartments.includes(args.department)) {
      throw new Error("Invalid department specified");
    }

    // Update access level based on new role if not provided
    let accessLevel = args.accessLevel;
    if (!accessLevel) {
      switch (args.role) {
        case "camp_manager": accessLevel = 5; break;
        case "camp_supervisor": accessLevel = 4; break;
        case "staff": accessLevel = 3; break;
        case "resident": accessLevel = 1; break;
        default: accessLevel = 1;
      }
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
      department: args.department,
      accessLevel,
      supervisorId: args.supervisorId,
    });

    return await ctx.db.get(args.userId);
  },
});

export const updateAccessControl = mutation({
  args: {
    userId: v.id("users"),
    isOnSite: v.boolean(),
    location: v.optional(v.string()), // Where they're scanning in/out
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user has access to be on site
    const now = Date.now();
    if (args.isOnSite) {
      // Check if user is on leave
      if (user.onLeaveUntil && user.onLeaveUntil > now) {
        throw new Error("User is currently on leave");
      }

      // Check if user has proper access level
      if (!user.accessLevel || user.accessLevel < 1) {
        throw new Error("User does not have access permissions");
      }
    }

    await ctx.db.patch(args.userId, {
      isOnSite: args.isOnSite,
      lastAccessScan: now,
    });

    return await ctx.db.get(args.userId);
  },
});

export const manageLeave = mutation({
  args: {
    userId: v.id("users"),
    action: v.string(), // "request", "approve", "deny", "cancel"
    startDate: v.number(),
    endDate: v.number(),
    reason: v.optional(v.string()),
    approvedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const leaveDays = Math.ceil((args.endDate - args.startDate) / (24 * 60 * 60 * 1000));

    switch (args.action) {
      case "request":
        // Check if user has enough leave balance
        if ((user.leaveBalance || 0) < leaveDays) {
          throw new Error("Insufficient leave balance");
        }
        // In a real system, this would create a leave request for approval
        break;

      case "approve":
        // Deduct from leave balance and set onLeaveUntil
        const newBalance = (user.leaveBalance || 0) - leaveDays;
        await ctx.db.patch(args.userId, {
          leaveBalance: newBalance,
          onLeaveUntil: args.endDate,
        });
        break;

      case "deny":
        // No changes needed, just log the denial
        break;

      case "cancel":
        // Return leave days to balance and clear onLeaveUntil
        const currentBalance = user.leaveBalance || 0;
        await ctx.db.patch(args.userId, {
          leaveBalance: currentBalance + leaveDays,
          onLeaveUntil: undefined,
        });
        break;

      default:
        throw new Error("Invalid leave action");
    }

    return await ctx.db.get(args.userId);
  },
});

export const manageDisciplinaryPoints = mutation({
  args: {
    userId: v.id("users"),
    action: v.string(), // "add", "remove"
    points: v.number(),
    reason: v.string(),
    recordedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentPoints = user.disciplinaryPoints || 0;
    let newPoints = currentPoints;

    switch (args.action) {
      case "add":
        newPoints = currentPoints + args.points;
        break;
      case "remove":
        newPoints = Math.max(0, currentPoints - args.points);
        break;
      default:
        throw new Error("Invalid disciplinary action");
    }

    await ctx.db.patch(args.userId, {
      disciplinaryPoints: newPoints,
    });

    // In a real system, this would create a disciplinary record
    return await ctx.db.get(args.userId);
  },
});

export const getUsersByDepartment = query({
  args: {
    department: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("department"), args.department))
      .collect();

    return Promise.all(
      users.map(async (user) => ({
        ...user,
        supervisor: user.supervisorId ? await ctx.db.get(user.supervisorId) : null,
      }))
    );
  },
});

export const getSubordinates = query({
  args: {
    supervisorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const subordinates = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("supervisorId"), args.supervisorId))
      .collect();

    return subordinates;
  },
});
