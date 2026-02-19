import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  campsites: defineTable({
    name: v.string(),
    description: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    price: v.number(),
    images: v.array(v.string()),
    amenities: v.array(v.string()),
  }),
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    password: v.optional(v.string()),
    role: v.optional(v.string()), // admin, camper, camp-staff, visitor
    assignedDuties: v.optional(v.array(v.string())), // For camp-staff: ["housekeeping", "maintenance", "laundry"]
    currentTaskId: v.optional(v.id("tasks")), // For tracking if camp-staff is vacant
    phoneNumber: v.optional(v.string()), // For SMS notifications
    notificationPreferences: v.optional(v.object({
      push: v.boolean(),
      email: v.boolean(),
      sms: v.boolean(),
    })),
    durationStart: v.optional(v.number()), // For visitors (timestamp)
    durationEnd: v.optional(v.number()), // For visitors (timestamp)
    isOnSite: v.optional(v.boolean()), // For camp-staff
    campStaffId: v.optional(v.string()), // For camp-staff
    points: v.optional(v.number()),
  })
    .index("by_role", ["role"])
    .index("by_email", ["email"]),
  orders: defineTable({
    userId: v.id("users"),
    /** e.g. "room_service", "shop" */
    source: v.string(),
    /** Free-form summary of what was ordered */
    summary: v.string(),
    total: v.number(),
    status: v.string(), // e.g. "pending", "in_progress", "completed"
    createdAt: v.number(), // timestamp (Date.now())
  }).index("by_status", ["status"])
    .index("by_userId", ["userId"]),
  announcements: defineTable({
    title: v.string(),
    content: v.string(),
    author: v.string(),
    priority: v.string(), // "low", "medium", "high"
    coverImage: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_priority", ["priority"]),
  tasks: defineTable({
    staffId: v.optional(v.id("users")), // camp-staff assigned
    requestId: v.optional(v.id("requests")),
    roomNumber: v.string(),
    serviceType: v.string(), // e.g. "housekeeping", "maintenance", "laundry"
    status: v.string(), // "pending", "confirmed", "in_progress", "completed", "rated"
    viewedBy: v.optional(v.array(v.id("users"))), // Track which staff members have viewed this task
    assignedAt: v.number(),
    staffConfirmedAt: v.optional(v.number()), // When camp-staff confirms acceptance
    acknowledgedAt: v.optional(v.number()), // When worker responds
    startedAt: v.optional(v.number()), // When work begins
    completedAt: v.optional(v.number()), // When work finishes
    camperConfirmedAt: v.optional(v.number()), // When camper confirms completion
    rating: v.optional(v.number()), // 1-5 stars
    feedback: v.optional(v.string()), // Camper's written feedback
    updates: v.optional(v.array(v.object({
      timestamp: v.number(),
      text: v.optional(v.string()),
      images: v.optional(v.array(v.string())), // Storage IDs
      audio: v.optional(v.string()), // Storage ID
    }))),
    lastReminderSent: v.optional(v.number()), // For escalation tracking
    reminderCount: v.optional(v.number()), // Number of reminders sent
    lastEscalationSent: v.optional(v.number()), // For camper/admin escalation
    escalationLevel: v.optional(v.number()), // 1 through 4
  }).index("by_staffId", ["staffId"])
    .index("by_status", ["status"])
    .index("by_requestId", ["requestId"]),
  notifications: defineTable({
    userId: v.id("users"),
    assignmentId: v.optional(v.id("tasks")),
    requestId: v.optional(v.id("requests")),
    type: v.string(), // "assignment", "reminder", "admin_alert"
    channel: v.string(), // "push", "email", "sms"
    status: v.string(), // "pending", "sent", "delivered", "failed"
    message: v.string(),
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
  }).index("by_userId", ["userId"])
    .index("by_assignmentId", ["assignmentId"])
    .index("by_status", ["status"])
    .index("by_requestId", ["requestId"]),
  reports: defineTable({
    userId: v.id("users"),
    type: v.string(), // "bug", "feedback", "incident"
    title: v.string(),
    message: v.string(),
    status: v.string(), // "unread", "resolved"
    createdAt: v.number(),
  }).index("by_status", ["status"]),
  rooms: defineTable({
    roomNumber: v.string(),
    category: v.string(), // "standard", "deluxe", "cabin"
    capacity: v.number(),
    status: v.string(), // "available", "occupied", "maintenance"
    occupantId: v.optional(v.id("users")), // current visitor
    pricePerNight: v.optional(v.number()),
  }).index("by_status", ["status"]),
  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.string(),
    service: v.optional(v.string()),
    image: v.optional(v.string()),
    stock: v.number(),
    isAvailable: v.boolean(),
  }).index("by_category", ["category"])
    .index("by_available", ["isAvailable"])
    .index("by_service", ["service"]),
  requests: defineTable({
    userId: v.id("users"),
    type: v.string(), // "maintenance", "housekeeping", "laundry", "room_service"
    roomNumber: v.string(),
    description: v.string(),
    priority: v.string(), // "urgent", "important", "low"
    status: v.string(), // "pending", "in_progress", "completed"
    createdAt: v.number(),
    image: v.optional(v.string()), // storageId
    dailyNotificationCount: v.optional(v.number()), // Max 4 per day
    lastDailyNotificationAt: v.optional(v.number()),
  }).index("by_userId", ["userId"])
    .index("by_status", ["status"]),
  activities: defineTable({
    title: v.string(),
    description: v.string(),
    date: v.number(), // timestamp
    time: v.string(),
    location: v.string(),
    category: v.optional(v.string()), // e.g. "Social", "Workshop", "Outdoor"
    capacity: v.optional(v.number()),
  }).index("by_date", ["date"]),
});
