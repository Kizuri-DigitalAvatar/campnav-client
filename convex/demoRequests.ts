import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Public submission from the marketing site's "Book a demo" form.
 * Stores the lead first, then schedules the sales notification email so a
 * mail failure can never lose the lead.
 */
export const create = mutation({
    args: {
        fullName: v.string(),
        workEmail: v.string(),
        company: v.string(),
        phone: v.optional(v.string()),
        jobTitle: v.optional(v.string()),
        campSize: v.optional(v.string()),
        interests: v.optional(v.array(v.string())),
        message: v.optional(v.string()),
        preferredTime: v.optional(v.string()),
        source: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const fullName = args.fullName.trim();
        const workEmail = args.workEmail.trim().toLowerCase();
        const company = args.company.trim();

        if (fullName.length < 2) throw new Error("Please enter your full name.");
        if (!EMAIL_RE.test(workEmail)) throw new Error("Please enter a valid work email address.");
        if (company.length < 2) throw new Error("Please enter your company or camp name.");

        const now = Date.now();

        // Collapse duplicate submissions from the same address within 5 minutes
        const recent = await ctx.db
            .query("demoRequests")
            .withIndex("by_createdAt", (q) => q.gt("createdAt", now - 5 * 60 * 1000))
            .collect();
        const duplicate = recent.find((r) => r.workEmail === workEmail);
        if (duplicate) return { id: duplicate._id, duplicate: true };

        const id = await ctx.db.insert("demoRequests", {
            fullName,
            workEmail,
            company,
            phone: args.phone?.trim() || undefined,
            jobTitle: args.jobTitle?.trim() || undefined,
            campSize: args.campSize || undefined,
            interests: args.interests?.length ? args.interests : undefined,
            message: args.message?.trim() || undefined,
            preferredTime: args.preferredTime?.trim() || undefined,
            source: args.source || "landing",
            status: "new",
            createdAt: now,
        });

        await ctx.scheduler.runAfter(0, internal.demoEmail.notifyDemoRequest, { id });

        return { id, duplicate: false };
    },
});

export const get = query({
    args: { id: v.id("demoRequests") },
    handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const list = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (args.status && args.status !== "all") {
            return await ctx.db
                .query("demoRequests")
                .withIndex("by_status", (q) => q.eq("status", args.status as string))
                .order("desc")
                .collect();
        }
        return await ctx.db.query("demoRequests").withIndex("by_createdAt").order("desc").collect();
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id("demoRequests"),
        status: v.string(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: args.status,
            ...(args.notes !== undefined ? { notes: args.notes } : {}),
            updatedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("demoRequests") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

/** Used by the email action to record delivery outcome without blocking the form. */
export const markNotified = internalMutation({
    args: { id: v.id("demoRequests"), notes: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const existing = await ctx.db.get(args.id);
        if (!existing) return;
        await ctx.db.patch(args.id, {
            notes: args.notes ?? existing.notes,
            updatedAt: Date.now(),
        });
    },
});
