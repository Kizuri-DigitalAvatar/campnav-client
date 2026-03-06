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
            console.error("[processEmailNotifications] RESEND_API_KEY not found in environment variables");
            return;
        }
        console.log("[processEmailNotifications] RESEND_API_KEY is present");

        const resend = new Resend(resendApiKey);

        const pending = await ctx.runQuery(api.notifications.getPendingNotifications);
        console.log(`[processEmailNotifications] getPendingNotifications returned ${pending.length} items`);

        const emailNotifications = pending.filter((n: any) => {
            const isEmail = n.channel === "email";
            const hasEmail = !!n.userEmail;
            if (isEmail && !hasEmail) console.log(`[processEmailNotifications] Notification ${n._id} matches email channel but has no userEmail`);
            return isEmail && hasEmail;
        });

        console.log(`[processEmailNotifications] Filtered to ${emailNotifications.length} email notifications to send`);

        for (const notif of emailNotifications) {
            console.log(`Sending email notification to: ${notif.userEmail}`);
            try {
                // Fetch request details if available to enrich the email
                let requestInfo = "";
                if (notif.requestId) {
                    const request = await ctx.runQuery(api.requests.get, { id: notif.requestId });
                    if (request) {
                        requestInfo = `
                            <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #e5e7eb;">
                                <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Request Details</p>
                                <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 500;">Room: ${request.roomNumber}</p>
                                <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 500;">Type: ${request.type.charAt(0).toUpperCase() + request.type.slice(1)}</p>
                                <p style="margin: 12px 0 0 0; font-size: 14px; color: #374151; font-style: italic;">"${request.description}"</p>
                            </div>
                        `;
                    }
                }

                const subject = notif.type === 'welcome'
                    ? "Welcome to CAMPNAV: Your Account Details"
                    : `CAMPNAV: New ${notif.type === 'assignment' ? 'Service Request' : 'Notification'}`;

                const title = notif.type === 'welcome'
                    ? "Welcome to CAMPNAV"
                    : (notif.type === 'assignment' ? "New Service Request" : "New Notification");

                const formattedMessage = notif.message.replace(/\n/g, '<br/>');

                const { data, error } = await resend.emails.send({
                    from: "CAMPNAV <notifications@blankspacesl.com>",
                    to: [notif.userEmail],
                    subject: subject,
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #111827; }
                                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                                .header { margin-bottom: 24px; }
                                .logo { font-size: 24px; font-weight: 800; color: #000; letter-spacing: -0.025em; }
                                .title { font-size: 20px; font-weight: 600; margin-bottom: 8px; color: #111827; }
                                .message { font-size: 16px; color: #4b5563; margin-bottom: 24px; }
                                .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
                                .button { display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <div class="logo">CAMPNAV</div>
                                </div>
                                <h1 class="title">${title}</h1>
                                <p class="message">${formattedMessage}</p>
                                
                                ${requestInfo}

                                <div style="margin-top: 32px;">
                                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://campnav.vercel.app'}" class="button">Go to Dashboard</a>
                                </div>

                                <div class="footer">
                                    <p>This is an automated notification from CAMPNAV System.</p>
                                    <p>&copy; 2026 CAMPNAV. All rights reserved.</p>
                                </div>
                            </div>
                        </body>
                        </html>
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
