import { action } from "../../_generated/server";
import { v } from "convex/values";
import { createBookAgent } from "./bookAgent";
import { internal } from "../../_generated/api";

/**
 * Start new book generation
 * Creates a new thread and generates the first response with real-time streaming
 */
export const startGeneration = action({
  args: {
    bookId: v.id("books"),
    prompt: v.string(),
  },
  returns: v.object({
    threadId: v.string(),
  }),
  handler: async (ctx, { bookId, prompt }): Promise<{ threadId: string }> => {
    console.log("[START] Book generation for:", bookId);

    // Get book context (includes generationMode, foundation, structure for phase detection)
    const bookContext: {
      book: {
        title: string;
        type: string;
        status: string;
        currentStep: string;
        metadata: any;
        generationMode?: string;
        foundation?: any;
        structure?: any;
      };
      chapters: any[];
    } = await ctx.runQuery(internal.features.books.queries.getBookContext, {
      bookId,
      includeChapters: true,
    });

    if (!bookContext) {
      throw new Error("Book not found");
    }

    // Create agent with book context
    const agent = createBookAgent(ctx, bookId, bookContext);

    // Create thread with metadata for better debugging
    const { threadId }: { threadId: string } = await agent.createThread(ctx, {
      title: bookContext.book.title,
      summary: `${bookContext.book.type} book generation`,
    });
    console.log("[THREAD] Created:", threadId);

    // Create initial prompt based on whether this is a new book (genre selection) or custom prompt
    const isGenreSelection = bookContext.book.title.endsWith(" Book");
    const initialPrompt = isGenreSelection
      ? `I want to create a ${bookContext.book.type} book.`
      : prompt;

    // Generate initial response with real-time streaming
    // Note: maxSteps is now handled internally by the agent based on generation mode
    await (agent as any).streamText(
      ctx,
      { threadId },
      { prompt: initialPrompt },
      {
        saveStreamDeltas: {
          chunking: "word", // Stream word by word for smooth UX
          throttleMs: 100, // Debounce writes every 100ms
        },
      }
    );

    // Save threadId to book
    await ctx.runMutation(internal.features.books.mutations.updateBook, {
      bookId,
      updates: { threadId },
    });

    console.log("[COMPLETE] Initial generation started (streaming)");
    return { threadId };
  },
});

/**
 * Continue existing conversation
 * Adds user message to thread and generates AI response with real-time streaming
 */
export const continueGeneration = action({
  args: {
    bookId: v.id("books"),
    threadId: v.string(),
    prompt: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (
    ctx,
    { bookId, threadId, prompt }
  ): Promise<{ success: boolean }> => {
    console.log("[CONTINUE] Thread:", threadId, "Prompt:", prompt);

    // Get book context (includes generationMode, foundation, structure for phase detection)
    const bookContext: {
      book: {
        title: string;
        type: string;
        status: string;
        currentStep: string;
        metadata: any;
        generationMode?: string;
        foundation?: any;
        structure?: any;
      };
      chapters: any[];
    } = await ctx.runQuery(internal.features.books.queries.getBookContext, {
      bookId,
      includeChapters: true,
    });

    if (!bookContext) {
      throw new Error("Book not found");
    }

    // Create agent with updated context
    const agent = createBookAgent(ctx, bookId, bookContext);

    // Generate response with real-time streaming
    // Note: maxSteps is now handled internally by the agent based on generation mode
    await (agent as any).streamText(
      ctx,
      { threadId },
      { prompt },
      {
        saveStreamDeltas: {
          chunking: "word",
          throttleMs: 100,
        },
      }
    );

    console.log("[COMPLETE] Response streaming started");
    return { success: true };
  },
});
