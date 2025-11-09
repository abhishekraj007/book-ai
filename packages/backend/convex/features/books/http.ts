import { httpAction } from "../../_generated/server";
import { streamText, tool } from "ai";
import { z } from "zod";
import { getModelWithFallback } from "../../lib/aiConfig";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";

/**
 * HTTP Action for Chat-Based Book Generation (v0.app style)
 *
 * This endpoint handles a conversational flow where:
 * 1. User sends a message (e.g., "Create a sci-fi novel")
 * 2. AI proposes an outline and asks for approval
 * 3. User approves/modifies
 * 4. AI generates chapter by chapter, asking for approval at each step
 * 5. Back-and-forth until book is complete
 *
 * Features:
 * - Streaming responses with Server-Sent Events
 * - Tool calling for database operations
 * - Message history for context
 * - Resume support
 */
export const handleBookGeneration = httpAction(async (ctx, req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  try {
    const body = await req.json();
    const { bookId, messages = [] } = body;

    console.log("=== CHAT REQUEST RECEIVED ===");
    console.log("Book ID:", bookId);
    console.log("Messages count:", messages.length);
    if (messages.length > 0) {
      console.log("Last message:", messages[messages.length - 1]);
    }

    if (!bookId) {
      return new Response(JSON.stringify({ error: "bookId is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Verify book exists and user has access
    const book = await ctx.runQuery(
      internal.features.books.queries.getBookContext,
      {
        bookId,
        includeChapters: true,
      }
    );

    if (!book) {
      return new Response(JSON.stringify({ error: "Book not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    console.log("[CONTEXT] Book:", book.book.title, book.book.type);
    console.log("[CONTEXT] Chapters:", book.chapters?.length || 0);

    // Build system prompt based on book context
    const systemPrompt = `You are an expert book writing assistant. You're helping to create a ${book.book.type} book titled "${book.book.title}".

Your role is to guide the user through the book creation process step by step:

1. First, propose a detailed outline with chapter titles and descriptions
2. Ask the user to approve or modify the outline
3. Once approved, generate chapters one at a time
4. After each chapter, ask the user to review and approve
5. Continue until all chapters are complete

Current progress:
- Chapters completed: ${book.chapters?.length || 0}
- Current step: ${book.book.currentStep}

Be conversational, professional, and ask for approval before proceeding with each major step.
Use the provided tools to save outlines, chapters, and checkpoints.

When proposing an outline, present it clearly with:
- Total number of chapters
- Chapter titles
- Brief description of each chapter
- Estimated word count per chapter

When generating a chapter, write engaging, high-quality content that:
- Fits the book's narrative and tone
- Maintains consistency with previous chapters
- Is appropriate for the target audience
- Follows the outline structure`;

    // Define tools for database operations
    const tools = {
      saveOutline: {
        description:
          "Save the book outline after user approval. Call this ONLY after the user explicitly approves the proposed outline.",
        inputSchema: z.object({
          chapterCount: z.number().min(1).max(100),
          chapterTitles: z.array(z.string()),
          synopsis: z.string(),
          estimatedWordsPerChapter: z.number(),
        }),
        execute: async (params: {
          chapterCount: number;
          chapterTitles: string[];
          synopsis: string;
          estimatedWordsPerChapter: number;
        }) => {
          console.log("[TOOL] saveOutline called:", params);
          await ctx.runMutation(internal.features.books.mutations.saveOutline, {
            bookId,
            ...params,
          });
          return {
            success: true,
            message:
              "Outline saved successfully. You can now proceed to generate the first chapter.",
          };
        },
      },

      saveChapter: {
        description:
          "Save a completed chapter after user approval. Call this ONLY after the user explicitly approves the chapter content.",
        inputSchema: z.object({
          chapterNumber: z.number().min(1),
          title: z.string(),
          content: z.string().min(100),
          wordCount: z.number(),
        }),
        execute: async (params: {
          chapterNumber: number;
          title: string;
          content: string;
          wordCount: number;
        }) => {
          console.log(
            "[TOOL] saveChapter called:",
            params.chapterNumber,
            params.title
          );
          const result = await ctx.runMutation(
            internal.features.books.mutations.saveChapter,
            {
              bookId,
              ...params,
            }
          );
          return {
            success: true,
            chapterId: result.chapterId,
            message: `Chapter ${params.chapterNumber} "${params.title}" saved successfully.`,
          };
        },
      },

      saveCheckpoint: {
        description: "Save progress checkpoint to enable resume functionality",
        inputSchema: z.object({
          step: z.string(),
          data: z.any(),
        }),
        execute: async (params: { step: string; data: any }) => {
          console.log("[TOOL] saveCheckpoint called:", params.step);
          await ctx.runMutation(
            internal.features.books.mutations.saveCheckpoint,
            {
              bookId,
              ...params,
              timestamp: Date.now(),
            }
          );
          return { success: true };
        },
      },
    };

    // Stream the chat response
    console.log("[STREAM] Starting streamText...");
    const result = streamText({
      model: getModelWithFallback("bookGeneration"),
      system: systemPrompt,
      messages,
      tools,
      onChunk: ({ chunk }) => {
        console.log("[CHUNK]", chunk.type);
      },
      onFinish: ({ text, usage }) => {
        console.log("[FINISH] Text length:", text?.length || 0);
        console.log("[FINISH] Tokens:", usage);
      },
    });

    // Convert to Response with proper headers
    const response = result.toTextStreamResponse({
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });

    console.log("[RESPONSE] Streaming started");
    return response;
  } catch (error) {
    console.error("=== CHAT ERROR ===");
    console.error(error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
});
