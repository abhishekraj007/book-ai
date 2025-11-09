import { v } from "convex/values";
import { internalQuery, query } from "../../_generated/server";
import { paginationOptsValidator } from "convex/server";
import { Id } from "../../_generated/dataModel";
import { listUIMessages, syncStreams, vStreamArgs } from "@convex-dev/agent";
import { components } from "../../_generated/api";

// ============================================================================
// Generation Session Queries
// ============================================================================

export const getGenerationSession = internalQuery({
  args: {
    bookId: v.string(),
  },
  returns: v.union(
    v.object({
      messages: v.array(v.any()),
      currentStage: v.string(),
      status: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, { bookId }) => {
    const session = await ctx.db
      .query("generationSessions")
      .withIndex("by_book", (q) => q.eq("bookId", bookId as Id<"books">))
      .first();

    if (!session) {
      return null;
    }

    return {
      messages: session.messages,
      currentStage: session.currentStage,
      status: session.status,
    };
  },
});

// ============================================================================
// Book Context Query (for Agent)
// ============================================================================

export const getBookContext = internalQuery({
  args: {
    bookId: v.string(),
    includeChapters: v.boolean(),
    upToChapter: v.optional(v.number()),
  },
  returns: v.object({
    book: v.object({
      title: v.string(),
      type: v.string(),
      status: v.string(),
      currentStep: v.string(),
      metadata: v.any(),
    }),
    chapters: v.array(
      v.object({
        chapterNumber: v.number(),
        title: v.string(),
        content: v.string(),
        wordCount: v.number(),
        status: v.string(),
      })
    ),
  }),
  handler: async (ctx, { bookId, includeChapters, upToChapter }) => {
    // Get book
    const book = await ctx.db.get(bookId as Id<"books">);
    if (!book) {
      throw new Error("Book not found");
    }

    // Get chapters if requested
    const chapters: Array<{
      chapterNumber: number;
      title: string;
      content: string;
      wordCount: number;
      status: string;
    }> = [];

    if (includeChapters) {
      const allChapters = await ctx.db
        .query("chapters")
        .withIndex("by_book", (q) => q.eq("bookId", bookId as Id<"books">))
        .collect();

      // Filter and format chapters
      for (const chapter of allChapters) {
        // Skip chapters beyond upToChapter if specified
        if (upToChapter && chapter.chapterNumber > upToChapter) {
          continue;
        }

        chapters.push({
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          content: chapter.content,
          wordCount: chapter.wordCount,
          status: chapter.status,
        });
      }

      // Sort by chapter number
      chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
    }

    return {
      book: {
        title: book.title,
        type: book.type,
        status: book.status,
        currentStep: book.currentStep,
        metadata: book.metadata,
      },
      chapters,
    };
  },
});

// ============================================================================
// Version History Queries
// ============================================================================

export const getVersionHistory = internalQuery({
  args: {
    chapterId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.string(),
      versionNumber: v.number(),
      content: v.string(),
      changedBy: v.string(),
      changeDescription: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { chapterId }) => {
    const versions = await ctx.db
      .query("chapterVersions")
      .withIndex("by_chapter", (q) =>
        q.eq("chapterId", chapterId as Id<"chapters">)
      )
      .order("desc") // Most recent first
      .collect();

    return versions.map((v) => ({
      _id: v._id,
      versionNumber: v.versionNumber,
      content: v.content,
      changedBy: v.changedBy,
      changeDescription: v.changeDescription,
      createdAt: v.createdAt,
    }));
  },
});

// ============================================================================
// Resume/Retry Queries
// ============================================================================

export const getResumeState = internalQuery({
  args: {
    bookId: v.string(),
  },
  returns: v.union(
    v.object({
      canResume: v.boolean(),
      lastCheckpoint: v.object({
        step: v.string(),
        timestamp: v.number(),
        data: v.any(),
      }),
      messages: v.array(v.any()),
      retryCount: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, { bookId }) => {
    const session = await ctx.db
      .query("generationSessions")
      .withIndex("by_book", (q) => q.eq("bookId", bookId as Id<"books">))
      .first();

    if (!session || session.status === "completed") {
      return null;
    }

    return {
      canResume: session.status === "paused" || session.status === "failed",
      lastCheckpoint: session.lastCheckpoint,
      messages: session.messages,
      retryCount: session.retryCount,
    };
  },
});

// ============================================================================
// Thread Messages Query (for Convex Agent)
// ============================================================================

/**
 * Get messages from a Convex Agent thread with real-time streaming support
 *
 * Returns both regular messages AND streaming deltas for real-time updates.
 * This enables v0.app-style streaming where text appears as it's generated.
 *
 * @see https://docs.convex.dev/agents/streaming#retrieving-streamed-deltas
 */
export const getThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  returns: v.object({
    // Regular messages
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.string(),
    // Streaming deltas for real-time updates (optional when no streams are active)
    streams: v.optional(v.any()),
  }),
  handler: async (ctx, args) => {
    // Fetch regular non-streaming messages
    const paginated = await listUIMessages(ctx, components.agent, args);

    // Fetch streaming deltas for real-time updates
    // This returns messages that are currently being streamed (or undefined if none)
    const streams = await syncStreams(ctx, components.agent, {
      ...args,
      // Include all streaming statuses for smooth UI transitions
      includeStatuses: ["streaming", "aborted", "finished"],
    });

    return {
      ...paginated,
      streams: streams ?? undefined, // Explicitly handle null/undefined for optional field
    };
  },
});
