import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profile: defineTable({
    email: v.string(),
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
    userId: v.string(), // Better Auth user ID (stored as string)
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
    productType: v.optional(v.string()), // e.g., "monthly", "yearly" - derived from webhook

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
    .index("by_platform_and_subscription", [
      "platform",
      "platformSubscriptionId",
    ]),

  // Orders table for tracking one-time purchases (credit purchases)
  orders: defineTable({
    userId: v.string(), // Better Auth user ID (stored as string)
    platform: v.union(v.literal("polar"), v.literal("revenuecat")),
    platformOrderId: v.string(), // Unique order ID from platform
    platformProductId: v.string(), // Product ID that was purchased
    amount: v.number(), // Credit amount purchased
    status: v.union(
      v.literal("paid"),
      v.literal("pending"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    createdAt: v.number(),
  })
    .index("by_platform_order_id", ["platformOrderId"])
    .index("by_user", ["userId"])
    .index("by_user_platform", ["userId", "platform"]),

  // ============================================================================
  // Book Generation Tables
  // ============================================================================

  // Books table - stores book metadata and generation status
  books: defineTable({
    userId: v.string(), // Better Auth user ID
    title: v.string(),
    type: v.string(), // "fiction", "non_fiction", "storybook", "coloring_book", etc.
    status: v.string(), // "draft", "generating", "awaiting_approval", "completed", "failed"
    currentStep: v.string(), // Current generation step (e.g., "outline", "chapter_3")
    threadId: v.optional(v.string()), // Convex Agent thread ID for conversation continuity
    metadata: v.object({
      genre: v.optional(v.string()),
      targetAudience: v.optional(v.string()),
      pageCount: v.optional(v.number()),
      language: v.optional(v.string()),
      tone: v.optional(v.string()),
    }),
    creditsUsed: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  // Chapters table - stores chapter content with version tracking
  chapters: defineTable({
    bookId: v.id("books"),
    chapterNumber: v.number(),
    title: v.string(),
    content: v.string(), // Current active version content (markdown)
    currentVersion: v.number(), // Version number of active content
    status: v.string(), // "pending", "generating", "approved", "needs_revision"
    wordCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_book", ["bookId"])
    .index("by_book_chapter", ["bookId", "chapterNumber"]),

  // Chapter versions table - stores all versions of chapter content for undo/redo
  chapterVersions: defineTable({
    chapterId: v.id("chapters"),
    versionNumber: v.number(),
    content: v.string(), // The content at this version (markdown)
    changedBy: v.string(), // "user" | "ai"
    changeDescription: v.string(), // Description of what changed
    createdAt: v.number(),
  })
    .index("by_chapter", ["chapterId"])
    .index("by_chapter_version", ["chapterId", "versionNumber"]),

  // Generation sessions table - supports resume/retry functionality
  generationSessions: defineTable({
    bookId: v.id("books"),
    messages: v.array(v.any()), // AI SDK message history for conversation continuity
    currentStage: v.string(), // "outline", "chapter_1", "chapter_2", etc.
    lastCheckpoint: v.object({
      step: v.string(),
      timestamp: v.number(),
      data: v.any(), // Arbitrary checkpoint data
    }),
    status: v.string(), // "in_progress", "paused", "completed", "failed"
    retryCount: v.number(),
    lastActiveAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_book", ["bookId"])
    .index("by_book_status", ["bookId", "status"]),
});
