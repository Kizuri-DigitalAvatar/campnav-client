import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { v } from "convex/values";

const DAY = 24 * 60 * 60 * 1000;

// How far nextDue moves forward after each completion
function addFrequency(from: number, frequency: string) {
  const d = new Date(from);
  switch (frequency) {
    case "daily": d.setDate(d.getDate() + 1); break;
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    case "annually": d.setFullYear(d.getFullYear() + 1); break;
    case "monthly":
    default: d.setMonth(d.getMonth() + 1); break;
  }
  return d.getTime();
}

// In-app + email notification to one user, honouring their preferences
async function notifyUser(ctx: MutationCtx, userId: Id<"users">, message: string) {
  const user = await ctx.db.get(userId);
  if (!user) return;
  const prefs = user.notificationPreferences || { push: true, email: true, sms: true };
  if (prefs.push) {
    await ctx.db.insert("notifications", { userId, type: "preventive", channel: "push", status: "pending", message });
  }
  if (prefs.email && user.email) {
    await ctx.db.insert("notifications", { userId, type: "preventive", channel: "email", status: "pending", message });
  }
}

function dueLabel(nextDue: number, timeZone?: string) {
  return formatIn(nextDue, { weekday: "short", month: "short", day: "numeric" }, timeZone);
}

// Convex runs in UTC; format in the admin's zone when we know it
function formatIn(ts: number, opts: Intl.DateTimeFormatOptions, timeZone?: string) {
  try {
    return new Date(ts).toLocaleString("en-GB", { ...opts, timeZone: timeZone || "UTC" });
  } catch {
    return new Date(ts).toLocaleString("en-GB", { ...opts, timeZone: "UTC" });
  }
}

function windowLabel(start: number, durationMinutes: number | undefined, timeZone?: string) {
  const dateTime: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" };
  const startText = formatIn(start, dateTime, timeZone);
  if (!durationMinutes) return `from ${startText}`;
  const end = start + durationMinutes * 60 * 1000;
  const sameDay = formatIn(start, { dateStyle: "short" }, timeZone) === formatIn(end, { dateStyle: "short" }, timeZone);
  const endText = sameDay
    ? formatIn(end, { hour: "2-digit", minute: "2-digit" }, timeZone)
    : formatIn(end, dateTime, timeZone);
  return `${startText} – ${endText}`;
}

export const create = mutation({
  args: {
    title: v.string(),
    type: v.string(),
    frequency: v.string(),
    nextDue: v.number(),
    assignedTo: v.optional(v.id("users")),
    durationMinutes: v.optional(v.number()),
    timeZone: v.optional(v.string()),
    checklist: v.array(v.object({
      item: v.string(),
      completed: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("preventiveMaintenance", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
    const when = windowLabel(args.nextDue, args.durationMinutes, args.timeZone);
    if (args.assignedTo) {
      await notifyUser(ctx, args.assignedTo,
        `🛠️ You've been assigned preventive maintenance: "${args.title}" (${args.frequency}), first scheduled ${when}.`);
    }
    // Let residents and guests know when the work starts and ends
    await ctx.runMutation(api.notifications.sendRoleNotification, {
      role: "resident",
      type: "maintenance_notice",
      message: `🛠️ Scheduled maintenance: ${args.title}, ${when}. Repeats ${args.frequency}. Some services may be briefly unavailable.`,
    });
    return id;
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
      let lastCompletedByName: string | null = null;
      if (item.lastCompletedBy) {
        lastCompletedByName = (await ctx.db.get(item.lastCompletedBy))?.name ?? null;
      }
      return { ...item, assignedName, lastCompletedByName };
    }));
  },
});

// Staff app: the schedules assigned to this staff member, soonest due first
export const listForStaff = query({
  args: { staffId: v.id("users") },
  handler: async (ctx, args) => {
    const items = (await ctx.db.query("preventiveMaintenance").collect())
      .filter((i) => i.assignedTo === args.staffId);
    return items.sort((a, b) => a.nextDue - b.nextDue);
  },
});

export const assign = mutation({
  args: { id: v.id("preventiveMaintenance"), staffId: v.union(v.id("users"), v.null()) },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Schedule not found");
    const assignedTo = args.staffId ?? undefined;
    if (assignedTo === item.assignedTo) return;

    await ctx.db.patch(args.id, { assignedTo, lastDueNotifiedAt: undefined });
    if (assignedTo) {
      await notifyUser(ctx, assignedTo,
        `🛠️ You've been assigned preventive maintenance: "${item.title}" (${item.frequency}), next scheduled ${windowLabel(item.nextDue, item.durationMinutes, item.timeZone)}.`);
    }
  },
});

export const toggleChecklistItem = mutation({
  args: { id: v.id("preventiveMaintenance"), index: v.number(), completed: v.boolean() },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Schedule not found");
    const checklist = item.checklist.map((c, i) =>
      i === args.index ? { ...c, completed: args.completed, completedAt: args.completed ? Date.now() : undefined } : c
    );
    await ctx.db.patch(args.id, {
      checklist,
      status: item.status === "pending" && args.completed ? "in_progress" : item.status,
    });
  },
});

// Record a completion and roll the schedule on to its next due date
async function completeItem(ctx: MutationCtx, item: Doc<"preventiveMaintenance">, completedBy?: Id<"users">) {
  const now = Date.now();
  await ctx.db.patch(item._id, {
    lastCompleted: now,
    completedAt: now,
    lastCompletedBy: completedBy,
    // Next cycle counts from the later of today and the old due date, so an early
    // completion doesn't shorten the cycle and a late one doesn't leave it overdue
    nextDue: addFrequency(Math.max(now, item.nextDue), item.frequency),
    status: "pending",
    checklist: item.checklist.map((c) => ({ item: c.item, completed: false })),
    lastDueNotifiedAt: undefined,
  });
}

export const complete = mutation({
  args: { id: v.id("preventiveMaintenance"), staffId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Schedule not found");
    await completeItem(ctx, item, args.staffId);
  },
});

export const updateStatus = mutation({
  args: { id: v.id("preventiveMaintenance"), status: v.string() },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Schedule not found");
    if (args.status === "completed") {
      await completeItem(ctx, item);
      return;
    }
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const remove = mutation({
  args: { id: v.id("preventiveMaintenance") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Daily: remind assignees about work due within a day, chase overdue work,
// and flag unassigned schedules that are coming up to admins.
export const sendDueReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const items = await ctx.db.query("preventiveMaintenance").collect();
    const overdueForAdmins: string[] = [];
    const unassignedSoon: string[] = [];

    for (const item of items) {
      // At most one reminder per schedule per day
      if (item.lastDueNotifiedAt && now - item.lastDueNotifiedAt < 20 * 60 * 60 * 1000) continue;

      const overdue = item.nextDue < now;
      const dueSoon = !overdue && item.nextDue - now <= DAY;

      if (!item.assignedTo) {
        if (overdue || item.nextDue - now <= 3 * DAY) unassignedSoon.push(item.title);
        continue;
      }
      if (!overdue && !dueSoon) continue;

      if (overdue && item.status !== "overdue") {
        await ctx.db.patch(item._id, { status: "overdue" });
      }
      await notifyUser(ctx, item.assignedTo, overdue
        ? `⚠️ Preventive maintenance overdue: "${item.title}" was due ${dueLabel(item.nextDue, item.timeZone)}. Please complete it as soon as possible.`
        : `🛠️ Preventive maintenance coming up: "${item.title}", ${windowLabel(item.nextDue, item.durationMinutes, item.timeZone)}.`);
      await ctx.db.patch(item._id, { lastDueNotifiedAt: now });
      if (overdue) overdueForAdmins.push(item.title);
    }

    const parts: string[] = [];
    if (overdueForAdmins.length) parts.push(`${overdueForAdmins.length} overdue (${overdueForAdmins.slice(0, 3).join(", ")}${overdueForAdmins.length > 3 ? "…" : ""})`);
    if (unassignedSoon.length) parts.push(`${unassignedSoon.length} due soon with nobody assigned (${unassignedSoon.slice(0, 3).join(", ")}${unassignedSoon.length > 3 ? "…" : ""})`);
    if (parts.length) {
      await ctx.runMutation(api.notifications.sendRoleNotification, {
        role: "admin",
        type: "preventive",
        message: `🛠️ Preventive maintenance: ${parts.join("; ")}.`,
      });
    }
  },
});
