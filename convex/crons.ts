import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Staff reminder schedule lives in cron.ts; check every minute so the
// 10- and 30-minute reminders land on time
crons.interval(
    "check unacknowledged assignments",
    { minutes: 1 },
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

// Morning nudge to admins about residents/staff who still have no room
crons.daily(
    "missing room reminders",
    { hourUTC: 7, minuteUTC: 0 },
    internal.users.remindMissingRooms
);

// Preventive maintenance: due-tomorrow / overdue reminders to assignees, summary to admins
crons.daily(
    "preventive maintenance reminders",
    { hourUTC: 6, minuteUTC: 0 },
    internal.preventive.sendDueReminders
);

export default crons;
