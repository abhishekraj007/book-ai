import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";

// ============================================================================
// Book Update Mutation
// ============================================================================

export const updateBook = internalMutation({
  args: {
    bookId: v.id("books"),
    updates: v.object({
      threadId: v.optional(v.string()),
      status: v.optional(v.string()),
      currentStep: v.optional(v.string()),
      creditsUsed: v.optional(v.number()),
      metadata: v.optional(v.any()),
    }),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { bookId, updates }) => {
    await ctx.db.patch(bookId, {
      ...updates,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// ============================================================================
// Book Outline Mutations
// ============================================================================

export const saveOutline = internalMutation({
  args: {
    bookId: v.string(),
    chapterCount: v.number(),
    chapterTitles: v.array(v.string()),
    synopsis: v.string(),
    estimatedWordsPerChapter: v.number(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (
    ctx,
    { bookId, chapterCount, chapterTitles, synopsis, estimatedWordsPerChapter }
  ) => {
    // Update book with outline metadata
    await ctx.db.patch(bookId as Id<"books">, {
      currentStep: "outline_complete",
      metadata: {
        pageCount: Math.ceil((chapterCount * estimatedWordsPerChapter) / 250), // Rough estimate
      },
      updatedAt: Date.now(),
    });

    // Create placeholder chapters
    const now = Date.now();
    for (let i = 0; i < chapterCount; i++) {
      await ctx.db.insert("chapters", {
        bookId: bookId as Id<"books">,
        chapterNumber: i + 1,
        title: chapterTitles[i] || `Chapter ${i + 1}`,
        content: "", // Empty initially
        currentVersion: 0,
        status: "pending",
        wordCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// ============================================================================
// Chapter Mutations
// ============================================================================

export const saveChapter = internalMutation({
  args: {
    bookId: v.string(),
    chapterNumber: v.number(),
    title: v.string(),
    content: v.string(),
    wordCount: v.number(),
  },
  returns: v.object({ chapterId: v.string() }),
  handler: async (
    ctx,
    { bookId, chapterNumber, title, content, wordCount }
  ) => {
    // Find the chapter
    const chapter = await ctx.db
      .query("chapters")
      .withIndex("by_book_chapter", (q) =>
        q.eq("bookId", bookId as Id<"books">).eq("chapterNumber", chapterNumber)
      )
      .first();

    if (!chapter) {
      throw new Error(`Chapter ${chapterNumber} not found`);
    }

    const now = Date.now();

    // Create first version
    await ctx.db.insert("chapterVersions", {
      chapterId: chapter._id,
      versionNumber: 1,
      content,
      changedBy: "ai",
      changeDescription: "Initial generation",
      createdAt: now,
    });

    // Update chapter with content
    await ctx.db.patch(chapter._id, {
      title,
      content,
      currentVersion: 1,
      status: "approved",
      wordCount,
      updatedAt: now,
    });

    // Update book progress
    await ctx.db.patch(bookId as Id<"books">, {
      currentStep: `chapter_${chapterNumber}`,
      updatedAt: now,
    });

    return { chapterId: chapter._id };
  },
});

export const reviseChapter = internalMutation({
  args: {
    bookId: v.string(),
    chapterNumber: v.number(),
    content: v.string(),
    revisionReason: v.string(),
    wordCount: v.number(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (
    ctx,
    { bookId, chapterNumber, content, revisionReason, wordCount }
  ) => {
    // Find the chapter
    const chapter = await ctx.db
      .query("chapters")
      .withIndex("by_book_chapter", (q) =>
        q.eq("bookId", bookId as Id<"books">).eq("chapterNumber", chapterNumber)
      )
      .first();

    if (!chapter) {
      throw new Error(`Chapter ${chapterNumber} not found`);
    }

    const newVersion = chapter.currentVersion + 1;
    const now = Date.now();

    // Create new version
    await ctx.db.insert("chapterVersions", {
      chapterId: chapter._id,
      versionNumber: newVersion,
      content,
      changedBy: "ai",
      changeDescription: revisionReason,
      createdAt: now,
    });

    // Update chapter
    await ctx.db.patch(chapter._id, {
      content,
      currentVersion: newVersion,
      wordCount,
      updatedAt: now,
    });

    return { success: true };
  },
});

// ============================================================================
// Checkpoint & Session Mutations
// ============================================================================

export const saveConversationHistory = internalMutation({
  args: {
    bookId: v.string(),
    messages: v.array(v.any()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { bookId, messages }) => {
    // Find session
    const session = await ctx.db
      .query("generationSessions")
      .withIndex("by_book", (q) => q.eq("bookId", bookId as Id<"books">))
      .first();

    if (!session) {
      // Create new session with messages
      await ctx.db.insert("generationSessions", {
        bookId: bookId as Id<"books">,
        messages,
        currentStage: "in_progress",
        lastCheckpoint: {
          step: "conversation_saved",
          timestamp: Date.now(),
          data: {},
        },
        status: "in_progress",
        retryCount: 0,
        lastActiveAt: Date.now(),
        createdAt: Date.now(),
      });
    } else {
      // Update existing session
      await ctx.db.patch(session._id, {
        messages,
        lastActiveAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const saveCheckpoint = internalMutation({
  args: {
    bookId: v.string(),
    step: v.string(),
    data: v.any(),
    timestamp: v.number(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { bookId, step, data, timestamp }) => {
    // Find or create generation session
    let session = await ctx.db
      .query("generationSessions")
      .withIndex("by_book", (q) => q.eq("bookId", bookId as Id<"books">))
      .first();

    if (!session) {
      // Create new session
      const sessionId = await ctx.db.insert("generationSessions", {
        bookId: bookId as Id<"books">,
        messages: [],
        currentStage: step,
        lastCheckpoint: {
          step,
          timestamp,
          data,
        },
        status: "in_progress",
        retryCount: 0,
        lastActiveAt: timestamp,
        createdAt: timestamp,
      });
      session = await ctx.db.get(sessionId);
    } else {
      // Update existing session
      await ctx.db.patch(session._id, {
        currentStage: step,
        lastCheckpoint: {
          step,
          timestamp,
          data,
        },
        lastActiveAt: timestamp,
      });
    }

    return { success: true };
  },
});

// ============================================================================
// Credit Mutations
// ============================================================================

export const deductBookCredits = internalMutation({
  args: {
    bookId: v.string(),
    amount: v.number(),
    reason: v.string(),
  },
  returns: v.object({ remainingCredits: v.number() }),
  handler: async (ctx, { bookId, amount, reason }) => {
    // Get book to find user
    const book = await ctx.db.get(bookId as Id<"books">);
    if (!book) {
      throw new Error("Book not found");
    }

    // Get user profile
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", book.userId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    const currentCredits = profile.credits ?? 0;
    if (currentCredits < amount) {
      throw new Error("Insufficient credits");
    }

    const newCredits = currentCredits - amount;

    // Deduct credits
    await ctx.db.patch(profile._id, {
      credits: newCredits,
    });

    // Update book credits used
    await ctx.db.patch(book._id, {
      creditsUsed: book.creditsUsed + amount,
      updatedAt: Date.now(),
    });

    return { remainingCredits: newCredits };
  },
});

// ============================================================================
// Version Control Mutations
// ============================================================================

export const createChapterVersion = internalMutation({
  args: {
    chapterId: v.string(),
    content: v.string(),
    changedBy: v.string(), // "user" | "ai"
    changeDescription: v.string(),
  },
  returns: v.object({ versionNumber: v.number() }),
  handler: async (
    ctx,
    { chapterId, content, changedBy, changeDescription }
  ) => {
    // Get current chapter
    const chapter = await ctx.db.get(chapterId as Id<"chapters">);
    if (!chapter) {
      throw new Error("Chapter not found");
    }

    const newVersion = chapter.currentVersion + 1;
    const now = Date.now();

    // Create new version
    await ctx.db.insert("chapterVersions", {
      chapterId: chapterId as Id<"chapters">,
      versionNumber: newVersion,
      content,
      changedBy,
      changeDescription,
      createdAt: now,
    });

    // Update chapter
    await ctx.db.patch(chapterId as Id<"chapters">, {
      content,
      currentVersion: newVersion,
      wordCount: content.split(/\s+/).length,
      updatedAt: now,
    });

    return { versionNumber: newVersion };
  },
});

export const revertToVersion = internalMutation({
  args: {
    chapterId: v.string(),
    versionNumber: v.number(),
  },
  returns: v.object({ success: v.boolean(), newVersionNumber: v.number() }),
  handler: async (
    ctx,
    { chapterId, versionNumber }
  ): Promise<{ success: boolean; newVersionNumber: number }> => {
    // Get the version to revert to
    const version = await ctx.db
      .query("chapterVersions")
      .withIndex("by_chapter_version", (q) =>
        q
          .eq("chapterId", chapterId as Id<"chapters">)
          .eq("versionNumber", versionNumber)
      )
      .first();

    if (!version) {
      throw new Error("Version not found");
    }

    // Create a new version (marking as revert)
    const result: { versionNumber: number } = await ctx.runMutation(
      internal.features.books.mutations.createChapterVersion,
      {
        chapterId,
        content: version.content,
        changedBy: "user",
        changeDescription: `Reverted to version ${versionNumber}`,
      }
    );

    return { success: true, newVersionNumber: result.versionNumber };
  },
});

// ============================================================================
// Resume/Retry Mutations
// ============================================================================

export const retryFailedGeneration = internalMutation({
  args: {
    bookId: v.string(),
  },
  returns: v.object({ success: v.boolean(), sessionId: v.string() }),
  handler: async (ctx, { bookId }) => {
    // Find the session
    const session = await ctx.db
      .query("generationSessions")
      .withIndex("by_book", (q) => q.eq("bookId", bookId as Id<"books">))
      .first();

    if (!session) {
      throw new Error("No generation session found");
    }

    // Increment retry count
    const newRetryCount = session.retryCount + 1;

    // Max 3 retries
    if (newRetryCount > 3) {
      throw new Error("Maximum retry attempts reached");
    }

    // Update session to in_progress
    await ctx.db.patch(session._id, {
      status: "in_progress",
      retryCount: newRetryCount,
      lastActiveAt: Date.now(),
    });

    // Update book status
    await ctx.db.patch(bookId as Id<"books">, {
      status: "generating",
      updatedAt: Date.now(),
    });

    return { success: true, sessionId: session._id };
  },
});

export const pauseGeneration = internalMutation({
  args: {
    bookId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { bookId }) => {
    // Find the session
    const session = await ctx.db
      .query("generationSessions")
      .withIndex("by_book", (q) => q.eq("bookId", bookId as Id<"books">))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        status: "paused",
        lastActiveAt: Date.now(),
      });
    }

    // Update book status
    await ctx.db.patch(bookId as Id<"books">, {
      status: "draft",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const markGenerationFailed = internalMutation({
  args: {
    bookId: v.string(),
    errorMessage: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { bookId, errorMessage }) => {
    // Find the session
    const session = await ctx.db
      .query("generationSessions")
      .withIndex("by_book", (q) => q.eq("bookId", bookId as Id<"books">))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        status: "failed",
        lastActiveAt: Date.now(),
      });
    }

    // Update book status
    await ctx.db.patch(bookId as Id<"books">, {
      status: "failed",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
