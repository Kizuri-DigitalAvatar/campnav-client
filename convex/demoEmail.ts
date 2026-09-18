"use node";

import { internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { Resend } from "resend";

const FROM = "CAMPNAV <notifications@blankspacesl.com>";
const SALES_INBOX = process.env.SALES_INBOX || "hello@zurimining.com";

const row = (label: string, value?: string) =>
    value
        ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;width:150px;">${label}</td><td style="padding:6px 0;font-size:14px;color:#111827;font-weight:500;">${value}</td></tr>`
        : "";

/**
 * Notifies the sales inbox about a new demo request and sends the requester a
 * confirmation. Failures are logged and recorded on the lead — never thrown,
 * so a mail outage cannot break the public form.
 */
export const notifyDemoRequest = internalAction({
    args: { id: v.id("demoRequests") },
    handler: async (ctx, args) => {
        const lead = await ctx.runQuery(api.demoRequests.get, { id: args.id });
        if (!lead) return;

        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.error("[notifyDemoRequest] RESEND_API_KEY not set — lead stored but no email sent");
            await ctx.runMutation(internal.demoRequests.markNotified, {
                id: args.id,
                notes: "Email not sent: RESEND_API_KEY missing",
            });
            return;
        }

        const resend = new Resend(resendApiKey);
        const submitted = new Date(lead.createdAt).toLocaleString("en-GB", { timeZone: "UTC" }) + " UTC";

        try {
            await resend.emails.send({
                from: FROM,
                to: [SALES_INBOX],
                replyTo: lead.workEmail,
                subject: `New CAMPNAV demo request — ${lead.company}`,
                html: `
                    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;color:#111827;">
                        <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#2563eb;font-weight:700;margin:0 0 8px;">New demo request</p>
                        <h1 style="font-size:22px;margin:0 0 20px;">${lead.fullName} · ${lead.company}</h1>
                        <table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e7eb;">
                            ${row("Work email", lead.workEmail)}
                            ${row("Phone", lead.phone)}
                            ${row("Role", lead.jobTitle)}
                            ${row("Camp size", lead.campSize)}
                            ${row("Interested in", lead.interests?.join(", "))}
                            ${row("Preferred time", lead.preferredTime)}
                            ${row("Source", lead.source)}
                            ${row("Submitted", submitted)}
                        </table>
                        ${lead.message
                        ? `<div style="margin-top:20px;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
                                 <p style="margin:0;font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;">Message</p>
                                 <p style="margin:8px 0 0;font-size:14px;line-height:1.6;">${lead.message.replace(/\n/g, "<br/>")}</p>
                               </div>`
                        : ""}
                        <p style="margin-top:28px;font-size:12px;color:#6b7280;">Reply directly to this email to reach ${lead.fullName}.</p>
                    </div>
                `,
            });

            await resend.emails.send({
                from: FROM,
                to: [lead.workEmail],
                subject: "Thanks — your CAMPNAV demo request is in",
                html: `
                    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#111827;">
                        <div style="font-size:24px;font-weight:800;letter-spacing:-.02em;">CAMPNAV</div>
                        <h1 style="font-size:20px;margin:24px 0 12px;">Thanks, ${lead.fullName.split(" ")[0]} — we've got your request.</h1>
                        <p style="font-size:15px;line-height:1.65;color:#4b5563;margin:0 0 16px;">
                            A member of our team will reach out within one business day to arrange a walkthrough
                            of CAMPNAV for ${lead.company}. The demo runs about 30 minutes and covers resident
                            requests, staff dispatch, meals, HSE reporting and the management dashboard.
                        </p>
                        <p style="font-size:15px;line-height:1.65;color:#4b5563;margin:0 0 24px;">
                            If anything changes in the meantime, just reply to this email.
                        </p>
                        <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
                            <p style="margin:0;">CAMPNAV — camp operations in one place.</p>
                        </div>
                    </div>
                `,
            });

            await ctx.runMutation(internal.demoRequests.markNotified, {
                id: args.id,
                notes: "Sales notified + requester confirmed",
            });
        } catch (error: any) {
            console.error("[notifyDemoRequest] failed to send:", error);
            await ctx.runMutation(internal.demoRequests.markNotified, {
                id: args.id,
                notes: `Email failed: ${error?.message || "unknown error"}`,
            });
        }
    },
});
