import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profile: defineTable({
    name: v.optional(v.string()),
    authUserId: v.string(),
    credits: v.optional(v.number()),
    // Premium status - can be granted manually or via subscription
    isPremium: v.optional(v.boolean()),
    premiumGrantedBy: v.optional(
      v.union(
        v.literal("manual"), // Admin granted
        v.literal("subscription"), // From active subscription
        v.literal("lifetime") // Lifetime access
      )
    ),
    premiumGrantedAt: v.optional(v.number()),
    premiumExpiresAt: v.optional(v.number()), // null = lifetime/subscription-based
  }).index("by_auth_user_id", ["authUserId"]),
  
  // Unified subscriptions table for both Polar (web) and RevenueCat (native)
  // Single source of truth for all subscription and premium status data
  subscriptions: defineTable({
    userId: v.id("user"), // Better Auth user ID
    platform: v.union(v.literal("polar"), v.literal("revenuecat")),
    
    // Customer and subscription identifiers (required for tracking)
    platformCustomerId: v.string(), // Polar/RevenueCat customer ID
    platformSubscriptionId: v.string(), // Polar/RevenueCat subscription ID
    platformProductId: v.string(), // Product ID from platform
    
    // Subscription details
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("expired"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    productKey: v.optional(v.string()), // e.g., "proMonthly", "proYearly" - derived from webhook
    
    // Customer info (denormalized for convenience)
    customerEmail: v.string(),
    customerName: v.optional(v.string()),
    
    // Dates
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_platform", ["userId", "platform"])
    .index("by_user_status", ["userId", "status"])
    .index("by_platform_subscription_id", ["platformSubscriptionId"])
    // Composite index for guaranteed uniqueness across platforms
    .index("by_platform_and_subscription", ["platform", "platformSubscriptionId"]),
  
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
  }),
});
