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
    subtitle: v.optional(v.string()),
    type: v.string(), // "fiction", "non_fiction", "storybook", "coloring_book", etc.
    status: v.string(), // "draft", "generating", "awaiting_approval", "completed", "failed"
    currentStep: v.string(), // Current generation step (e.g., "ideation", "foundation", "structure", "chapter_3")
    threadId: v.optional(v.string()), // Convex Agent thread ID for conversation continuity

    // Generation mode
    generationMode: v.optional(v.union(v.literal("auto"), v.literal("manual"))),

    // Author information
    authorName: v.optional(v.string()),
    authorBio: v.optional(v.string()),
    publisherName: v.optional(v.string()),

    // Book cover image URL and storage ID
    coverImage: v.optional(v.string()),
    coverImageStorageId: v.optional(v.string()),

    // Book foundation (gathered in phase 2)
    foundation: v.optional(
      v.object({
        synopsis: v.string(),
        themes: v.array(v.string()),
        targetAudience: v.string(),
        targetWordCount: v.number(),
        genre: v.string(),
        // Fiction-specific fields
        characters: v.optional(
          v.array(
            v.object({
              name: v.string(),
              role: v.string(),
              description: v.string(),
            })
          )
        ),
        setting: v.optional(v.string()),
        conflict: v.optional(v.string()),
        tone: v.optional(v.string()),
        // Non-fiction specific fields
        coreArguments: v.optional(v.array(v.string())),
        approach: v.optional(v.string()),
      })
    ),

    // Book structure (designed in phase 3)
    structure: v.optional(
      v.object({
        chapterCount: v.number(),
        chapterTitles: v.array(v.string()),
        hasPrologue: v.boolean(),
        hasEpilogue: v.boolean(),
        estimatedWordsPerChapter: v.number(),
        parts: v.optional(
          v.array(
            v.object({
              partNumber: v.number(),
              title: v.string(),
              chapterRange: v.object({ start: v.number(), end: v.number() }),
            })
          )
        ),
      })
    ),

    // Story ideas (for ideation phase)
    storyIdeas: v.optional(
      v.array(
        v.object({
          title: v.string(),
          premise: v.string(),
          genre: v.string(),
        })
      )
    ),

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

  // Book pages table - manages all book sections (front matter, main content, back matter)
  bookPages: defineTable({
    bookId: v.id("books"),
    pageType: v.union(
      // Front Matter
      v.literal("title_page"),
      v.literal("copyright"),
      v.literal("dedication"),
      v.literal("table_of_contents"),
      v.literal("foreword"),
      v.literal("preface"),
      v.literal("acknowledgments"),
      // Main Content (references to chapters)
      v.literal("prologue"),
      v.literal("chapter"),
      v.literal("epilogue"),
      // Back Matter
      v.literal("about_author"),
      v.literal("bibliography"),
      v.literal("appendix")
    ),
    order: v.number(), // Determines the sequence of pages in the book
    title: v.optional(v.string()), // Page title (if applicable)

    // Content - either direct content or reference to chapter
    content: v.optional(v.string()), // Markdown content for non-chapter pages
    chapterId: v.optional(v.id("chapters")), // Reference to chapter for chapter-type pages

    // Formatting options
    formatting: v.optional(
      v.object({
        textAlign: v.optional(
          v.union(v.literal("left"), v.literal("center"), v.literal("right"))
        ),
        fontSize: v.optional(
          v.union(
            v.literal("small"),
            v.literal("medium"),
            v.literal("large"),
            v.literal("xlarge")
          )
        ),
        fontWeight: v.optional(v.union(v.literal("normal"), v.literal("bold"))),
        fontStyle: v.optional(
          v.union(v.literal("normal"), v.literal("italic"))
        ),
        lineHeight: v.optional(
          v.union(v.literal("tight"), v.literal("normal"), v.literal("relaxed"))
        ),
        marginTop: v.optional(
          v.union(
            v.literal("none"),
            v.literal("small"),
            v.literal("medium"),
            v.literal("large")
          )
        ),
        marginBottom: v.optional(
          v.union(
            v.literal("none"),
            v.literal("small"),
            v.literal("medium"),
            v.literal("large")
          )
        ),
        pageBreakBefore: v.optional(v.boolean()),
        pageBreakAfter: v.optional(v.boolean()),
      })
    ),

    status: v.string(), // "empty", "draft", "completed"
    isOptional: v.boolean(), // Can this page be removed?
    isVisible: v.boolean(), // Should this page be shown in the book?

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_book", ["bookId"])
    .index("by_book_order", ["bookId", "order"])
    .index("by_book_type", ["bookId", "pageType"]),
});
