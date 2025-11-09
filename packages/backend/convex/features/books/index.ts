import { v } from 'convex/values';
import { mutation, query } from '../../_generated/server';

/**
 * Public Books API
 * 
 * These are the public-facing queries and mutations that the frontend uses.
 * They handle authentication and call internal functions.
 */

// Export public actions for book generation
export { startGeneration, continueGeneration } from './actions';

// ============================================================================
// Queries
// ============================================================================

export const listMyBooks = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('books'),
      title: v.string(),
      type: v.string(),
      status: v.string(),
      currentStep: v.string(),
      metadata: v.any(),
      creditsUsed: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    // Get authenticated user
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      // Return empty array if not authenticated
      return [];
    }

    // Get all books for this user
    const books = await ctx.db
      .query('books')
      .withIndex('by_user', (q) => q.eq('userId', user.subject))
      .order('desc')
      .collect();

    return books.map((book) => ({
      _id: book._id,
      title: book.title,
      type: book.type,
      status: book.status,
      currentStep: book.currentStep,
      metadata: book.metadata,
      creditsUsed: book.creditsUsed,
      createdAt: book._creationTime,
      updatedAt: book.updatedAt,
    }));
  },
});

export const getBook = query({
  args: {
    bookId: v.id('books'),
  },
  returns: v.union(
    v.object({
      _id: v.id('books'),
      title: v.string(),
      type: v.string(),
      status: v.string(),
      currentStep: v.string(),
      metadata: v.any(),
      creditsUsed: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
      chapters: v.array(
        v.object({
          _id: v.id('chapters'),
          chapterNumber: v.number(),
          title: v.string(),
          content: v.string(),
          currentVersion: v.number(),
          status: v.string(),
          wordCount: v.number(),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, { bookId }) => {
    // Get authenticated user
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      return null; // Return null instead of throwing error
    }

    // Get book
    const book = await ctx.db.get(bookId);
    if (!book) {
      return null;
    }

    // Verify ownership
    if (book.userId !== user.subject) {
      return null; // Return null instead of throwing error
    }

    // Get chapters
    const chapters = await ctx.db
      .query('chapters')
      .withIndex('by_book', (q) => q.eq('bookId', bookId))
      .collect();

    return {
      _id: book._id,
      title: book.title,
      type: book.type,
      status: book.status,
      currentStep: book.currentStep,
      metadata: book.metadata,
      creditsUsed: book.creditsUsed,
      createdAt: book._creationTime,
      updatedAt: book.updatedAt,
      chapters: chapters.map((ch) => ({
        _id: ch._id,
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        content: ch.content,
        currentVersion: ch.currentVersion,
        status: ch.status,
        wordCount: ch.wordCount,
      })),
    };
  },
});

// ============================================================================
// Mutations
// ============================================================================

export const createBook = mutation({
  args: {
    title: v.string(),
    type: v.string(),
    genre: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    language: v.optional(v.string()),
    tone: v.optional(v.string()),
  },
  returns: v.object({
    bookId: v.id('books'),
  }),
  handler: async (ctx, args) => {
    // Get authenticated user
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Check user has credits
    const profile = await ctx.db
      .query('profile')
      .withIndex('by_auth_user_id', (q) => q.eq('authUserId', user.subject))
      .first();

    if (!profile) {
      throw new Error('User profile not found');
    }

    const credits = profile.credits ?? 0;
    if (credits < 10) {
      // Minimum 10 credits to start
      throw new Error('Insufficient credits. Minimum 10 credits required.');
    }

    // Create book
    const now = Date.now();
    const bookId = await ctx.db.insert('books', {
      userId: user.subject,
      title: args.title,
      type: args.type,
      status: 'draft',
      currentStep: 'initialization',
      metadata: {
        genre: args.genre,
        targetAudience: args.targetAudience,
        language: args.language,
        tone: args.tone,
      },
      creditsUsed: 0,
      createdAt: now,
      updatedAt: now,
    });

    return { bookId };
  },
});

export const deleteBook = mutation({
  args: {
    bookId: v.id('books'),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { bookId }) => {
    // Get authenticated user
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Get book
    const book = await ctx.db.get(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    // Verify ownership
    if (book.userId !== user.subject) {
      throw new Error('Not authorized');
    }

    // Delete chapters and versions
    const chapters = await ctx.db
      .query('chapters')
      .withIndex('by_book', (q) => q.eq('bookId', bookId))
      .collect();

    for (const chapter of chapters) {
      // Delete versions
      const versions = await ctx.db
        .query('chapterVersions')
        .withIndex('by_chapter', (q) => q.eq('chapterId', chapter._id))
        .collect();

      for (const version of versions) {
        await ctx.db.delete(version._id);
      }

      // Delete chapter
      await ctx.db.delete(chapter._id);
    }

    // Delete generation session
    const session = await ctx.db
      .query('generationSessions')
      .withIndex('by_book', (q) => q.eq('bookId', bookId))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    // Delete book
    await ctx.db.delete(bookId);

    return { success: true };
  },
});

// ============================================================================
// Resume/Retry Public Queries
// ============================================================================

export const getResumeState = query({
  args: {
    bookId: v.id('books'),
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
    // Get authenticated user
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      return null;
    }

    // Verify book ownership
    const book = await ctx.db.get(bookId);
    if (!book || book.userId !== user.subject) {
      return null;
    }

    const session = await ctx.db
      .query('generationSessions')
      .withIndex('by_book', (q) => q.eq('bookId', bookId))
      .first();

    if (!session || session.status === 'completed') {
      return null;
    }

    return {
      canResume: session.status === 'paused' || session.status === 'failed',
      lastCheckpoint: session.lastCheckpoint,
      messages: session.messages,
      retryCount: session.retryCount,
    };
  },
});

export const retryGeneration = mutation({
  args: {
    bookId: v.id('books'),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { bookId }) => {
    // Get authenticated user
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Verify book ownership
    const book = await ctx.db.get(bookId);
    if (!book || book.userId !== user.subject) {
      throw new Error('Not authorized');
    }

    // Find the session
    const session = await ctx.db
      .query('generationSessions')
      .withIndex('by_book', (q) => q.eq('bookId', bookId))
      .first();

    if (!session) {
      throw new Error('No generation session found');
    }

    // Increment retry count
    const newRetryCount = session.retryCount + 1;

    // Max 3 retries
    if (newRetryCount > 3) {
      throw new Error('Maximum retry attempts reached');
    }

    // Update session to in_progress
    await ctx.db.patch(session._id, {
      status: 'in_progress',
      retryCount: newRetryCount,
      lastActiveAt: Date.now(),
    });

    // Update book status
    await ctx.db.patch(bookId, {
      status: 'generating',
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ============================================================================
// Version History Public Queries
// ============================================================================

export const getVersionHistory = query({
  args: {
    chapterId: v.id('chapters'),
  },
  returns: v.array(
    v.object({
      _id: v.id('chapterVersions'),
      versionNumber: v.number(),
      content: v.string(),
      changedBy: v.string(),
      changeDescription: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { chapterId }) => {
    // Get authenticated user
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      return [];
    }

    // Get chapter to verify ownership
    const chapter = await ctx.db.get(chapterId);
    if (!chapter) {
      return [];
    }

    // Get book to verify ownership
    const book = await ctx.db.get(chapter.bookId);
    if (!book || book.userId !== user.subject) {
      return [];
    }

    const versions = await ctx.db
      .query('chapterVersions')
      .withIndex('by_chapter', (q) => q.eq('chapterId', chapterId))
      .order('desc') // Most recent first
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

export const revertToVersion = mutation({
  args: {
    chapterId: v.id('chapters'),
    versionNumber: v.number(),
  },
  returns: v.object({ success: v.boolean(), newVersionNumber: v.number() }),
  handler: async (ctx, { chapterId, versionNumber }) => {
    // Get authenticated user
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Get chapter
    const chapter = await ctx.db.get(chapterId);
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    // Get book to verify ownership
    const book = await ctx.db.get(chapter.bookId);
    if (!book || book.userId !== user.subject) {
      throw new Error('Not authorized');
    }

    // Get the version to revert to
    const version = await ctx.db
      .query('chapterVersions')
      .withIndex('by_chapter_version', (q) =>
        q.eq('chapterId', chapterId).eq('versionNumber', versionNumber)
      )
      .first();

    if (!version) {
      throw new Error('Version not found');
    }

    const newVersion = chapter.currentVersion + 1;
    const now = Date.now();

    // Create new version (marking as revert)
    await ctx.db.insert('chapterVersions', {
      chapterId,
      versionNumber: newVersion,
      content: version.content,
      changedBy: 'user',
      changeDescription: `Reverted to version ${versionNumber}`,
      createdAt: now,
    });

    // Update chapter
    await ctx.db.patch(chapterId, {
      content: version.content,
      currentVersion: newVersion,
      wordCount: version.content.split(/\s+/).length,
      updatedAt: now,
    });

    return { success: true, newVersionNumber: newVersion };
  },
});
