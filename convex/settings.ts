import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const KEY = "camp";

// Reception contact details shown to residents and guests in the client app
export const getReceptionContact = query({
    args: {},
    handler: async (ctx) => {
        const settings = await ctx.db
            .query("campSettings")
            .withIndex("by_key", (q) => q.eq("key", KEY))
            .first();
        return {
            phone: settings?.receptionPhone ?? null,
            whatsapp: settings?.receptionWhatsapp ?? null,
            hours: settings?.receptionHours ?? null,
            updatedAt: settings?.updatedAt ?? null,
        };
    },
});

export const setReceptionContact = mutation({
    args: {
        phone: v.optional(v.string()),
        whatsapp: v.optional(v.string()),
        hours: v.optional(v.string()),
        updatedBy: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const clean = (s?: string) => s?.trim() || undefined;
        const phone = clean(args.phone);
        const whatsapp = clean(args.whatsapp);
        // Phone numbers: digits, spaces, dashes, brackets and a leading +
        for (const [label, value] of [["Phone", phone], ["WhatsApp", whatsapp]] as const) {
            if (value && !/^\+?[\d\s\-()]{6,20}$/.test(value)) {
                throw new Error(`${label} number looks invalid. Use digits, e.g. +232 76 123456`);
            }
        }
        if (whatsapp && !whatsapp.startsWith("+")) {
            throw new Error("WhatsApp number must include the country code, starting with +");
        }

        const fields = {
            receptionPhone: phone,
            receptionWhatsapp: whatsapp,
            receptionHours: clean(args.hours),
            updatedAt: Date.now(),
            updatedBy: args.updatedBy,
        };
        const existing = await ctx.db
            .query("campSettings")
            .withIndex("by_key", (q) => q.eq("key", KEY))
            .first();
        if (existing) await ctx.db.patch(existing._id, fields);
        else await ctx.db.insert("campSettings", { key: KEY, ...fields });
    },
});
