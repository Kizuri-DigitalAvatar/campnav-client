/**
 * Single source of copy for the public marketing site.
 *
 * Everything a non-developer is likely to want to change lives here — contact
 * details, headline claims, module descriptions, FAQ. The numbers under
 * `IMPACT` are illustrative targets, not audited customer results: replace them
 * with real figures before the site goes live.
 */

export const CONTACT = {
    email: "hello@zurimining.com",
    phone: "+232 00 000 000",
    location: "Freetown, Sierra Leone",
    responsePromise: "We reply to every demo request within one business day.",
}

export const HERO = {
    eyebrow: "Camp operations platform",
    title: "Run the whole camp",
    titleAccent: "from one place",
    subtitle:
        "CAMPNAV connects residents, staff and management on a single platform — service requests, dispatch, meals, maintenance, safety reporting and live occupancy, all in real time.",
    bullets: [
        "Requests routed to the right team in seconds",
        "Works on any phone — installable, offline-aware",
        "Live dashboards for managers and supervisors",
    ],
}

export type ModulePreviewRow = {
    label: string
    meta: string
    state: "done" | "active" | "queued"
}

export type Module = {
    id: string
    name: string
    icon: string
    tagline: string
    points: string[]
    preview: {
        title: string
        subtitle: string
        chips: { label: string; value: string }[]
        rows: ModulePreviewRow[]
    }
}

export const MODULES: Module[] = [
    {
        id: "requests",
        name: "Service requests",
        icon: "ConciergeBell",
        tagline: "One inbox for everything a resident needs.",
        points: [
            "Residents raise a request in two taps — room service, laundry, housekeeping, delivery.",
            "Auto-routed to the department on duty, with photo and note attachments.",
            "Every status change is timestamped, so nothing gets lost between shifts.",
        ],
        preview: {
            title: "Requests · live queue",
            subtitle: "Routed automatically by department",
            chips: [
                { label: "Open", value: "12" },
                { label: "Avg. pickup", value: "4m" },
            ],
            rows: [
                { label: "Room 214 · Extra towels", meta: "Housekeeping", state: "active" },
                { label: "Room 108 · AC not cooling", meta: "Maintenance", state: "queued" },
                { label: "Room 302 · Laundry pickup", meta: "Laundry", state: "done" },
            ],
        },
    },
    {
        id: "dispatch",
        name: "Staff dispatch",
        icon: "Users",
        tagline: "The right task, to the right person, on shift.",
        points: [
            "Tasks are offered to available staff by department and duty assignment.",
            "Staff acknowledge, start and complete from their phone — no paper handovers.",
            "Supervisors see who is free, who is loaded, and what is running late.",
        ],
        preview: {
            title: "Dispatch board",
            subtitle: "Housekeeping · morning shift",
            chips: [
                { label: "On duty", value: "9" },
                { label: "Available", value: "3" },
            ],
            rows: [
                { label: "Aminata K. · Room 214", meta: "In progress", state: "active" },
                { label: "Joseph B. · Block C sweep", meta: "Acknowledged", state: "queued" },
                { label: "Fatmata S. · Room 119", meta: "Completed 09:42", state: "done" },
            ],
        },
    },
    {
        id: "meals",
        name: "Meals & menus",
        icon: "Utensils",
        tagline: "Publish the menu, capture the headcount.",
        points: [
            "Daily and weekly menus published to every resident's phone.",
            "Dietary requirements travel with the resident's profile.",
            "The kitchen sees expected covers before service instead of guessing.",
        ],
        preview: {
            title: "Today's service",
            subtitle: "Mess hall · dinner",
            chips: [
                { label: "Covers", value: "248" },
                { label: "Special diets", value: "17" },
            ],
            rows: [
                { label: "Jollof rice & grilled chicken", meta: "Main", state: "active" },
                { label: "Vegetable stew", meta: "Vegetarian · 11", state: "queued" },
                { label: "Lunch service", meta: "Closed 14:30", state: "done" },
            ],
        },
    },
    {
        id: "maintenance",
        name: "Maintenance",
        icon: "Wrench",
        tagline: "Reactive jobs and planned upkeep in one log.",
        points: [
            "Fault reports carry photos, room, category and urgency from the start.",
            "Preventive schedules raise their own jobs — generators, pumps, HVAC.",
            "Full history per room and per asset, ready for audit.",
        ],
        preview: {
            title: "Maintenance log",
            subtitle: "Reactive + preventive",
            chips: [
                { label: "Open jobs", value: "8" },
                { label: "Due today", value: "1" },
            ],
            rows: [
                { label: "Generator B · 250h service", meta: "Preventive · due today", state: "active" },
                { label: "Room 108 · AC unit", meta: "Reported 08:15", state: "queued" },
                { label: "Block A · water pump", meta: "Closed yesterday", state: "done" },
            ],
        },
    },
    {
        id: "hse",
        name: "HSE & incidents",
        icon: "ShieldCheck",
        tagline: "Report a hazard before it becomes an incident.",
        points: [
            "Anyone on site can log a hazard, near-miss or incident with evidence attached.",
            "Emergency broadcasts reach every device at once.",
            "The incident register stays complete and exportable for compliance reviews.",
        ],
        preview: {
            title: "HSE register",
            subtitle: "This month",
            chips: [
                { label: "Reports", value: "23" },
                { label: "Open", value: "2" },
            ],
            rows: [
                { label: "Wet floor · kitchen corridor", meta: "Hazard · under review", state: "active" },
                { label: "Near miss · loading bay", meta: "Assigned to HSE lead", state: "queued" },
                { label: "Fire drill · Block C", meta: "Completed", state: "done" },
            ],
        },
    },
    {
        id: "occupancy",
        name: "Rooms & occupancy",
        icon: "BedDouble",
        tagline: "Know what is occupied, free or out of service.",
        points: [
            "Live room status across every block and category.",
            "Check-in and check-out update occupancy instantly.",
            "Daily snapshots build the occupancy trend management asks for.",
        ],
        preview: {
            title: "Occupancy",
            subtitle: "All blocks · today",
            chips: [
                { label: "Occupied", value: "86%" },
                { label: "Out of service", value: "4" },
            ],
            rows: [
                { label: "Block A · 48 rooms", meta: "92% occupied", state: "active" },
                { label: "Block B · 36 rooms", meta: "81% occupied", state: "queued" },
                { label: "Block C · 24 rooms", meta: "Turnover complete", state: "done" },
            ],
        },
    },
    {
        id: "updates",
        name: "Updates & activities",
        icon: "Megaphone",
        tagline: "Announcements people actually receive.",
        points: [
            "Priority-tagged announcements land on every resident's home screen.",
            "An activity calendar for briefings, drills, sports and social nights.",
            "Push, email and SMS channels so urgent notices never rely on a noticeboard.",
        ],
        preview: {
            title: "Camp updates",
            subtitle: "Published this week",
            chips: [
                { label: "Announcements", value: "6" },
                { label: "Activities", value: "9" },
            ],
            rows: [
                { label: "Water shutdown · Block B", meta: "High priority", state: "active" },
                { label: "Safety briefing · Hall A", meta: "Today 14:00", state: "queued" },
                { label: "Campfire night", meta: "Friday 21:00", state: "done" },
            ],
        },
    },
    {
        id: "reports",
        name: "Reports & billing",
        icon: "BarChart3",
        tagline: "The numbers management asks for, already assembled.",
        points: [
            "Service volumes, response times and completion rates by department.",
            "Occupancy and consumption trends over any period.",
            "Billing lines tied to the rooms and services that generated them.",
        ],
        preview: {
            title: "Operations report",
            subtitle: "Last 30 days",
            chips: [
                { label: "Requests", value: "1,284" },
                { label: "On time", value: "94%" },
            ],
            rows: [
                { label: "Housekeeping", meta: "612 jobs · 97% on time", state: "done" },
                { label: "Maintenance", meta: "233 jobs · 89% on time", state: "active" },
                { label: "Room service", meta: "439 orders · 95% on time", state: "done" },
            ],
        },
    },
]

export const STEPS = [
    {
        title: "We map your camp",
        body: "Blocks, rooms, departments, duty rosters and service categories are loaded so the platform matches how your site already works.",
    },
    {
        title: "Your people get access",
        body: "Residents, staff and managers each get the right view — installable on any phone, no app store required.",
    },
    {
        title: "Operations move online",
        body: "Requests, dispatch, meals, maintenance and HSE run through CAMPNAV from day one, with your team supported through the switch.",
    },
]

export const AUDIENCES = [
    {
        id: "residents",
        title: "Residents & guests",
        icon: "UserRound",
        body: "Request a service, check the menu, read announcements and track everything they have asked for — without having to find someone to ask.",
        features: [
            "Two-tap service requests",
            "Menus & dietary profile",
            "Announcements & activities",
            "Full request history",
        ],
    },
    {
        id: "staff",
        title: "Camp staff",
        icon: "HardHat",
        body: "A clear task list for the shift, with everything needed to finish the job already attached to it.",
        features: [
            "Assigned & available tasks",
            "Acknowledge, start, complete",
            "Photo evidence on jobs",
            "Shift history",
        ],
    },
    {
        id: "management",
        title: "Camp management",
        icon: "LayoutDashboard",
        body: "Live visibility across every department, plus the records and reports needed for clients and auditors.",
        features: [
            "Live operations dashboard",
            "Occupancy & room control",
            "HSE & incident register",
            "Exportable reports",
        ],
    },
]

/** Illustrative targets — replace with audited figures before launch. */
export const IMPACT = [
    { value: 92, suffix: "%", label: "of requests picked up inside 10 minutes" },
    { value: 5, suffix: "×", label: "faster than radio-and-paper dispatch" },
    { value: 100, suffix: "%", label: "of jobs logged with a timestamped trail" },
    { value: 24, suffix: "/7", label: "operations coverage across every shift" },
]

export const COMPARISON = {
    before: {
        title: "Before CAMPNAV",
        points: [
            "Requests arrive by radio, WhatsApp and corridor conversations",
            "Nobody can say who picked up a job, or when",
            "Maintenance history lives in a notebook",
            "Announcements depend on a noticeboard people walk past",
            "Month-end reporting means rebuilding the month from memory",
        ],
    },
    after: {
        title: "With CAMPNAV",
        points: [
            "Every request enters one queue, routed to the department on duty",
            "Each job carries who, when and what — automatically",
            "Full asset and room history, searchable and exportable",
            "Priority announcements pushed to every device instantly",
            "Reports assembled as the work happens, ready on demand",
        ],
    },
}

export const FAQS = [
    {
        q: "Do residents and staff need to install an app?",
        a: "No app store required. CAMPNAV runs in the browser and installs to the home screen as a progressive web app, so it behaves like a native app on both Android and iOS while staying instantly updatable.",
    },
    {
        q: "Will it work with our patchy site connectivity?",
        a: "The app is built for intermittent connections — screens are cached, so staff can keep moving through the interface, and actions sync as soon as the connection returns.",
    },
    {
        q: "Can we keep our existing departments and workflows?",
        a: "Yes. Departments, duty assignments, room categories and service types are all configured to match your site. CAMPNAV adapts to your structure rather than forcing a new one on you.",
    },
    {
        q: "How do managers see what is happening?",
        a: "The management dashboard shows live request volumes, staff availability, occupancy, incidents and maintenance in one place, with reports you can export for clients and auditors.",
    },
    {
        q: "How long does setup take?",
        a: "Most camps are live within a couple of weeks: site mapping and data load, then a staged rollout by department with hands-on support for supervisors and staff.",
    },
    {
        q: "Who owns the data?",
        a: "You do. Your camp's data stays yours, and can be exported at any time in standard formats.",
    },
]

export const CAMP_SIZES = [
    "Under 100 residents",
    "100 – 300 residents",
    "300 – 800 residents",
    "800 – 2,000 residents",
    "Over 2,000 residents",
]

export const INTERESTS = [
    "Service requests",
    "Staff dispatch",
    "Meals & menus",
    "Maintenance",
    "HSE & incidents",
    "Occupancy & rooms",
    "Reports & billing",
]
