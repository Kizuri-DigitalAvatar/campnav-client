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
    role: v.optional(v.string()), // admin, staff, visitor
    durationStart: v.optional(v.number()), // For visitors (timestamp)
    durationEnd: v.optional(v.number()), // For visitors (timestamp)
    isOnSite: v.optional(v.boolean()), // For staff
    campStaffId: v.optional(v.string()), // For staff
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
  }).index("by_status", ["status"]),
  announcements: defineTable({
    title: v.string(),
    content: v.string(),
    author: v.string(),
    priority: v.string(), // "low", "medium", "high"
    coverImage: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_priority", ["priority"]),
  housekeeping: defineTable({
    housekeeperId: v.id("users"),
    roomNumber: v.string(),
    serviceType: v.string(), // e.g. "Cleaning", "Maintenance", "Laundry"
    status: v.string(), // "pending", "in_progress", "completed"
    assignedAt: v.number(),
  }),
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
  }).index("by_userId", ["userId"])
    .index("by_status", ["status"]),
});
