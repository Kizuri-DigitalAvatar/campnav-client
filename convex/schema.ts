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
    role: v.optional(v.string()), // camp_manager, camp_supervisor, staff, resident, guest
    department: v.optional(v.string()), // housekeeping, maintenance, shop, kitchen, etc.
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
    lastAccessScan: v.optional(v.number()), // Last access scan timestamp
    campStaffId: v.optional(v.string()), // For camp-staff
    points: v.optional(v.number()),
    roomNumber: v.optional(v.string()), // For campers
    dietaryRequirements: v.optional(v.array(v.string())), // For meal preferences
    disciplinaryPoints: v.optional(v.number()), // For loyalty point deductions
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
    status: v.string(), // e.g. "pending", "in_progress", "completed", "failed"
    roomNumber: v.optional(v.string()),
    createdAt: v.number(), // timestamp (Date.now())
    confirmedAt: v.optional(v.number()),
    confirmationNote: v.optional(v.string()),
    confirmationEvidence: v.optional(v.array(v.string())), // storageIds for proof of delivery
    quantity: v.optional(v.number()),
    productImage: v.optional(v.string()),
  }).index("by_status", ["status"])
    .index("by_userId", ["userId"])
    .index("by_source", ["source"]),
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
    description: v.optional(v.string()),
    priority: v.optional(v.string()),
    category: v.optional(v.string()),
    subCategory: v.optional(v.string()),
    applianceModel: v.optional(v.string()),
    accessPreference: v.optional(v.string()),
    image: v.optional(v.string()),
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
      replies: v.optional(v.array(v.object({
        userId: v.id("users"),
        userName: v.string(),
        text: v.string(),
        timestamp: v.number(),
      }))),
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
    category: v.string(), // "executive", "hq_house", "standard"
    subCategory: v.optional(v.string()), // E1, E2, E3, E4, H1:1, H1:2, etc.
    bedConfiguration: v.optional(v.string()), // B1, B2 for standard rooms
    capacity: v.number(),
    status: v.string(), // "available", "occupied", "maintenance"
    occupantId: v.optional(v.id("users")), // current visitor
    pricePerNight: v.optional(v.number()),
  }).index("by_status", ["status"])
    .index("by_category", ["category"]),
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
    
    // Maintenance specific
    category: v.optional(v.string()),
    subCategory: v.optional(v.string()),
    applianceModel: v.optional(v.string()),
    dateNoticed: v.optional(v.string()),
    specialAttention: v.optional(v.boolean()),
    accessPreference: v.optional(v.string()),
    officeUse: v.optional(v.object({
      urgency: v.optional(v.string()),
      tradesperson: v.optional(v.string()),
      workOrderSent: v.optional(v.string()),
    })),
    
    // Laundry specific
    laundryItems: v.optional(v.array(v.object({
      name: v.string(),
      quantity: v.number(),
      type: v.string(), // "laundry" | "dry_cleaning"
    }))),
    starch: v.optional(v.string()),
  }).index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"]),
  menus: defineTable({
    name: v.string(),
    storageId: v.optional(v.string()),
    content: v.optional(v.string()),
    type: v.string(), // "image" | "pdf" | "text"
    schedule: v.optional(v.string()), // "daily" | "weekly"
    category: v.optional(v.string()), // e.g. "Food", "Drink"
    uploadedAt: v.number(),
  }),
  activities: defineTable({
    title: v.string(),
    description: v.string(),
    date: v.number(), // timestamp
    time: v.string(),
    location: v.string(),
    category: v.optional(v.string()), // e.g. "Social", "Workshop", "Outdoor"
    capacity: v.optional(v.number()),
    coverImage: v.optional(v.string()),
    interestedCount: v.optional(v.number()),
  }).index("by_date", ["date"]),
  activityInterests: defineTable({
    activityId: v.id("activities"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_activityId", ["activityId"])
    .index("by_activity_user", ["activityId", "userId"])
    .index("by_userId", ["userId"]),
  
  // HSE Management
  hseIncidents: defineTable({
    title: v.string(),
    description: v.string(),
    type: v.string(), // "incident", "hazard"
    location: v.string(), // "camp", "site"
    severity: v.string(), // "low", "medium", "high", "critical"
    reportedBy: v.id("users"),
    assignedTo: v.optional(v.id("users")),
    status: v.string(), // "open", "in_progress", "resolved", "closed"
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
    correctiveActions: v.optional(v.array(v.string())),
  }).index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_severity", ["severity"]),
    
  // Emergency Broadcasts
  emergencyBroadcasts: defineTable({
    title: v.string(),
    message: v.string(),
    type: v.string(), // "weather", "fire", "security", "general"
    severity: v.string(), // "low", "medium", "high", "critical"
    isActive: v.optional(v.boolean()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    targetAudience: v.optional(v.array(v.string())), // ["all", "staff", "residents"]
    siteStatus: v.optional(v.string()), // "operational", "restricted", "closed"
    userId: v.optional(v.string()),
    status: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    affectedAreas: v.optional(v.array(v.string())),
    deliveryChannels: v.optional(v.array(v.string())),
    deliveryStatus: v.optional(v.array(v.any())),
    estimatedDuration: v.optional(v.string()),
    instructions: v.optional(v.array(v.any())),
  }).index("by_active", ["isActive"])
    .index("by_type", ["type"]),
    
  // Safety Checklists
  safetyChecklists: defineTable({
    title: v.string(),
    category: v.string(), // "daily", "weekly", "monthly", "audit"
    items: v.array(v.object({
      description: v.string(),
      required: v.boolean(),
      completed: v.optional(v.boolean()),
      notes: v.optional(v.string()),
      completedBy: v.optional(v.id("users")),
      completedAt: v.optional(v.number()),
    })),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.number(),
    status: v.string(), // "pending", "in_progress", "completed", "overdue"
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_status", ["status"])
    .index("by_category", ["category"]),
    
  // RnR Management
  rnrRequests: defineTable({
    userId: v.id("users"),
    type: v.string(), // "leave", "flight", "accommodation"
    startDate: v.number(),
    endDate: v.number(),
    status: v.string(), // "pending", "approved", "rejected", "completed"
    reason: v.string(),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    flightDetails: v.optional(v.object({
      bookingReference: v.string(),
      departure: v.string(),
      arrival: v.string(),
      airline: v.string(),
      confirmationCode: v.string(),
    })),
    countdownDays: v.optional(v.number()),
    notificationsSent: v.optional(v.array(v.string())), // Track notifications to HoD, Kitchen, etc.
    createdAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"]),
    
  // Meal Management
  mealOrders: defineTable({
    userId: v.id("users"),
    date: v.number(), // Date of meal (timestamp)
    mealType: v.string(), // "breakfast", "lunch", "dinner"
    items: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
      specialInstructions: v.optional(v.string()),
    })),
    dietaryRestrictions: v.array(v.string()),
    preferences: v.optional(v.object({
      riceType: v.string(), // "rice", "bulgur"
      spiceLevel: v.string(), // "mild", "medium", "spicy"
    })),
    status: v.string(), // "pending", "confirmed", "preparing", "ready", "completed"
    createdAt: v.number(),
    confirmedAt: v.optional(v.number()),
    readyAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"])
    .index("by_date", ["date"])
    .index("by_status", ["status"]),
    
  // Facilities Booking
  facilityBookings: defineTable({
    userId: v.id("users"),
    facility: v.string(), // "gym", "mini_golf", "tennis"
    date: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    status: v.string(), // "pending", "confirmed", "cancelled", "completed"
    numberOfParticipants: v.optional(v.number()),
    specialRequests: v.optional(v.string()),
    createdAt: v.number(),
    confirmedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"])
    .index("by_facility", ["facility"])
    .index("by_date", ["date"])
    .index("by_status", ["status"]),
    
  // Preventive Maintenance
  preventiveMaintenance: defineTable({
    title: v.string(),
    type: v.string(), // "grease_service", "fumigation", "ac_service", "general"
    frequency: v.string(), // "daily", "weekly", "monthly", "quarterly", "annually"
    lastCompleted: v.optional(v.number()),
    nextDue: v.number(),
    assignedTo: v.optional(v.id("users")),
    status: v.string(), // "pending", "in_progress", "completed", "overdue"
    checklist: v.array(v.object({
      item: v.string(),
      completed: v.boolean(),
      notes: v.optional(v.string()),
      completedAt: v.optional(v.number()),
    })),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_nextDue", ["nextDue"]),
    
  // Invoicing
  invoices: defineTable({
    userId: v.id("users"),
    invoiceNumber: v.string(),
    period: v.string(), // "monthly", "weekly"
    startDate: v.number(),
    endDate: v.number(),
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      total: v.number(),
    })),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    status: v.string(), // "draft", "sent", "paid", "overdue"
    paymentMethod: v.optional(v.string()), // "cash", "card", "transfer"
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_status", ["status"]),
    
  // Loyalty Points Transactions
  loyaltyTransactions: defineTable({
    userId: v.id("users"),
    type: v.string(), // "earned", "redeemed", "deducted"
    points: v.number(),
    reason: v.string(),
    relatedTo: v.optional(v.string()), // Reference to related entity
    createdAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_type", ["type"]),
});
