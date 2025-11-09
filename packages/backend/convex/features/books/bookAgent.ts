import { Agent } from "@convex-dev/agent";
import { gateway } from "@ai-sdk/gateway";
import { components } from "../../_generated/api";
import { z } from "zod";
import { internal } from "../../_generated/api";
import type { ActionCtx } from "../../_generated/server";

/**
 * Book Generation Agent using Convex Agent Component
 *
 * This agent manages the entire book generation process with:
 * - Automatic message persistence in threads
 * - Real-time streaming via websockets
 * - Built-in conversation history
 * - Tool calling for database operations
 */
export function createBookAgent(
  ctx: ActionCtx,
  bookId: string,
  bookContext: {
    book: {
      title: string;
      type: string;
      currentStep: string;
      metadata?: any;
    };
    chapters: any[];
  }
) {
  return new Agent(components.agent, {
    name: "Book Writer",
    languageModel: gateway("openai/gpt-4o"), // Using AI Gateway

    instructions: `You are an expert book writing assistant. You're helping to create a ${bookContext.book.type} book titled "${bookContext.book.title}".

Your role is to guide the user through the book creation process step by step:

1. First, propose a detailed outline with chapter titles and descriptions
2. Ask the user to approve or modify the outline
3. Once approved, generate chapters one at a time
4. After each chapter, ask the user to review and approve
5. Continue until all chapters are complete

Current progress:
- Chapters completed: ${bookContext.chapters?.length || 0}
- Current step: ${bookContext.book.currentStep}

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
- Follows the outline structure`,

    tools: {
      saveOutline: {
        description:
          "Save the book outline after user approval. Call this ONLY after the user explicitly approves the proposed outline.",
        inputSchema: z.object({
          chapterCount: z.number().min(1).max(100),
          chapterTitles: z.array(z.string()),
          synopsis: z.string(),
          estimatedWordsPerChapter: z.number(),
        }),
        execute: async (args, options) => {
          console.log("[TOOL] saveOutline called:", args);
          await ctx.runMutation(internal.features.books.mutations.saveOutline, {
            bookId,
            ...args,
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
        execute: async (args, options) => {
          console.log(
            "[TOOL] saveChapter called:",
            args.chapterNumber,
            args.title
          );
          const result = await ctx.runMutation(
            internal.features.books.mutations.saveChapter,
            {
              bookId,
              ...args,
            }
          );
          return {
            success: true,
            chapterId: result.chapterId,
            message: `Chapter ${args.chapterNumber} "${args.title}" saved successfully.`,
          };
        },
      },

      saveCheckpoint: {
        description: "Save progress checkpoint to enable resume functionality",
        inputSchema: z.object({
          step: z.string(),
          data: z.any(),
        }),
        execute: async (args, options) => {
          console.log("[TOOL] saveCheckpoint called:", args);
          await ctx.runMutation(
            internal.features.books.mutations.saveCheckpoint,
            {
              bookId,
              ...args,
              timestamp: Date.now(),
            }
          );
          return { success: true, message: "Checkpoint saved" };
        },
      },
    },

    maxSteps: 10,
  });
}

