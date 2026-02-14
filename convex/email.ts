"use node";

import { internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Resend } from "resend";

// Internal action to process email notifications via Resend
export const processEmailNotifications = internalAction({
    args: {},
    handler: async (ctx) => {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.error("RESEND_API_KEY not found in environment variables");
            return;
        }

        const resend = new Resend(resendApiKey);

        const pending = await ctx.runQuery(api.notifications.getPendingNotifications);
        const emailNotifications = pending.filter((n: any) => n.channel === "email" && n.userEmail);

        console.log(`Processing ${emailNotifications.length} email notifications`);

        for (const notif of emailNotifications) {
            try {
                const { data, error } = await resend.emails.send({
from: "CAMPNAV <notifications@blankspacesl.com>",
                    to: [notif.userEmail],
                    subject: "CAMPNAV: New Camp Service Request",
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                            <h1 style="color: #000;">New Camp Service Request</h1>
                            <p>${notif.message}</p>
                            <hr />
                            <p style="font-size: 12px; color: #666;">This is an automated notification from CAMPNAV.</p>
                        </div>
                    `,
                });

                if (error) {
                    console.error("Failed to send email:", error);
                    await ctx.runMutation(internal.notifications.updateNotificationStatus, {
                        id: notif._id,
                        status: "failed",
                        error: error.message,
                    });
                } else {
                    console.log("Email sent successfully:", data?.id);
                    await ctx.runMutation(internal.notifications.updateNotificationStatus, {
                        id: notif._id,
                        status: "sent",
                    });
                }
            } catch (error: any) {
                console.error("Error processing email notification:", error);
                await ctx.runMutation(internal.notifications.updateNotificationStatus, {
                    id: notif._id,
                    status: "failed",
                    error: error?.message || "Unknown error",
                });
            }

            // Add a small delay to respect Resend rate limits (2 req/sec free tier)
            await new Promise(resolve => setTimeout(resolve, 600));
        }
    },
});
