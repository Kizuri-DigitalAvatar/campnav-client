import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for unacknowledged assignments every 5 minutes
crons.interval(
    "check unacknowledged assignments",
    { minutes: 5 },
    internal.cron.checkUnacknowledgedAssignments
);

// Check for pending email notifications every minute
crons.interval(
    "process email notifications",
    { minutes: 1 },
    internal.email.processEmailNotifications
);

// Check for unresponded requests every 10 minutes
crons.interval(
    "check unresponded requests",
    { minutes: 10 },
    internal.cron.checkUnrespondedRequests
);

// Saturday reminder (menu week runs Sunday-Saturday): admins set next week's
// meal menu, residents review it and select their meals
crons.weekly(
    "weekly meal menu reminders",
    { dayOfWeek: "saturday", hourUTC: 9, minuteUTC: 0 },
    internal.menus.sendWeeklyMenuReminders
);

export default crons;
