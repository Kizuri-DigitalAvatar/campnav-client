import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const upsert = mutation({
  // ... (keep existing upsert)
  args: {
    email: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
    password: v.optional(v.string()),
    role: v.optional(v.string()),
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

    // Queue welcome email for new user
    await ctx.db.insert("notifications", {
      userId: _id,
      type: "welcome",
      channel: "email",
      status: "pending",
      message: `Welcome to CAMPNAV! Your account has been created.\n\nLogin Email: ${args.email}\nDefault Password: ${args.password || 'Not provided'}\n\nPlease login at ${process.env.NEXT_PUBLIC_APP_URL || 'https://campnav.vercel.app'}/login to access your dashboard.`,
    });

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

    const roles = ["admin", "camper", "camp-staff", "visitor"] as const;

    const byRole = roles.map((role) => {
      const count = users.filter((u) => u.role === role).length;
      const name = role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
      return { name, value: count };
    });

    const now = Date.now();
    const activeVisitors = users.filter((u) =>
      u.role === "visitor" &&
      typeof u.durationStart === "number" && u.durationStart <= now &&
      (u.durationEnd === undefined || u.durationEnd === null || (typeof u.durationEnd === "number" && u.durationEnd >= now))
    ).length;

    return {
      byRole,
      activeVisitors,
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

    return { ...user, imageUrl };
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
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
    });

    return await ctx.db.get(userId);
  },
});
