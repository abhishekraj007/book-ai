import { ToolLoopAgent, tool } from "ai";
import { z } from "zod";
import { getModelWithFallback } from "../../lib/aiConfig";
import { internal } from "../../_generated/api";
import { ActionCtx } from "../../_generated/server";

/**
 * Book Generation Agent using Kimi K2 Thinking
 *
 * This agent can execute 200-300 sequential tool calls, making it perfect
 * for the entire book generation workflow from outline to final chapters.
 */
export function createBookAgent(ctx: ActionCtx, bookId: string) {
  return new ToolLoopAgent({
    model: getModelWithFallback("bookGeneration"), // Uses Kimi K2 Thinking
    instructions: `You are an expert book writing assistant powered by Kimi K2 Thinking.

Your role is to help users create high-quality books through a collaborative, step-by-step process.

Key capabilities:
- Generate well-structured book outlines with compelling chapter arcs
- Write engaging, coherent chapters that maintain consistency
- Adapt to user feedback and preferences
- Maintain narrative consistency across all chapters
- Follow genre-specific conventions and reader expectations

Process:
1. First, propose a detailed book outline (chapter count, titles, synopsis)
2. Wait for user approval before proceeding
3. Generate chapters one at a time, maintaining quality and consistency
4. After each chapter, wait for user review and approval
5. Incorporate user feedback for revisions when requested

Important guidelines:
- Always seek approval before generating outlines or chapters
- Write in a style appropriate to the book type and target audience
- Maintain character consistency and plot coherence
- Use descriptive, engaging language
- Respect word count targets and pacing
- Save progress checkpoints regularly`,

    tools: {
      // ========================================================================
      // APPROVAL-REQUIRED TOOLS
      // ========================================================================

      generateOutline: tool({
        description: `Generate a comprehensive book outline including chapter count, 
          chapter titles, and a brief synopsis for each chapter. This outline will 
          guide the entire book generation process.`,
        needsApproval: true, // User must approve the outline!
        inputSchema: z.object({
          chapterCount: z
            .number()
            .min(1)
            .max(100)
            .describe("Number of chapters in the book"),
          chapterTitles: z
            .array(z.string())
            .describe("Array of chapter titles"),
          synopsis: z
            .string()
            .describe("Overall book synopsis and structure plan"),
          estimatedWordsPerChapter: z
            .number()
            .describe("Estimated word count per chapter"),
        }),
        execute: async ({
          chapterCount,
          chapterTitles,
          synopsis,
          estimatedWordsPerChapter,
        }) => {
          console.log("[TOOL EXECUTE] generateOutline", {
            chapterCount,
            chapterTitles,
            synopsis: synopsis.substring(0, 100),
          });

          // Save outline to database via mutation
          await ctx.runMutation(internal.features.books.mutations.saveOutline, {
            bookId,
            chapterCount,
            chapterTitles,
            synopsis,
            estimatedWordsPerChapter,
          });

          console.log("[TOOL SUCCESS] generateOutline saved");

          return {
            success: true,
            message: `Outline with ${chapterCount} chapters created successfully`,
          };
        },
      }),

      generateChapter: tool({
        description: `Generate a complete chapter with engaging content that 
          fits the book's narrative and maintains consistency with previous chapters.`,
        needsApproval: true, // User must approve each chapter!
        inputSchema: z.object({
          chapterNumber: z.number().min(1).describe("Chapter number"),
          title: z.string().describe("Chapter title"),
          content: z
            .string()
            .min(500)
            .describe("Full chapter content in markdown format"),
          wordCount: z.number().describe("Actual word count of the chapter"),
        }),
        execute: async ({ chapterNumber, title, content, wordCount }) => {
          console.log("[TOOL EXECUTE] generateChapter", {
            chapterNumber,
            title,
            wordCount,
            contentLength: content.length,
          });

          // Save chapter to database via mutation
          const result = await ctx.runMutation(
            internal.features.books.mutations.saveChapter,
            {
              bookId,
              chapterNumber,
              title,
              content,
              wordCount,
            }
          );

          console.log("[TOOL SUCCESS] generateChapter saved", result.chapterId);

          return {
            success: true,
            chapterId: result.chapterId,
            wordCount,
            message: `Chapter ${chapterNumber}: "${title}" generated successfully`,
          };
        },
      }),

      reviseChapter: tool({
        description: `Revise an existing chapter based on user feedback. 
          Generate improved content while maintaining narrative consistency.`,
        needsApproval: true, // User must approve revisions!
        inputSchema: z.object({
          chapterNumber: z.number().describe("Chapter number to revise"),
          revisedContent: z
            .string()
            .min(500)
            .describe("Revised chapter content in markdown"),
          revisionReason: z
            .string()
            .describe("Reason for revision (user feedback)"),
          wordCount: z.number().describe("Word count of revised content"),
        }),
        execute: async ({
          chapterNumber,
          revisedContent,
          revisionReason,
          wordCount,
        }) => {
          // Update chapter with new version
          await ctx.runMutation(
            internal.features.books.mutations.reviseChapter,
            {
              bookId,
              chapterNumber,
              content: revisedContent,
              revisionReason,
              wordCount,
            }
          );

          return {
            success: true,
            message: `Chapter ${chapterNumber} revised successfully`,
            reason: revisionReason,
          };
        },
      }),

      // ========================================================================
      // AUTO-EXECUTE TOOLS (No approval required)
      // ========================================================================

      saveCheckpoint: tool({
        description: `Save a progress checkpoint. This happens automatically 
          at key stages to enable resume functionality if generation is interrupted.`,
        inputSchema: z.object({
          step: z
            .string()
            .describe(
              'Current step identifier (e.g., "outline_complete", "chapter_3")'
            ),
          data: z.any().describe("Checkpoint data to save"),
        }),
        execute: async ({ step, data }) => {
          console.log("[TOOL EXECUTE] saveCheckpoint", { step });

          // Save checkpoint to generationSessions table
          await ctx.runMutation(
            internal.features.books.mutations.saveCheckpoint,
            {
              bookId,
              step,
              data,
              timestamp: Date.now(),
            }
          );

          console.log("[TOOL SUCCESS] saveCheckpoint saved");

          return {
            success: true,
            step,
            message: `Checkpoint saved at step: ${step}`,
          };
        },
      }),

      deductCredits: tool({
        description: `Deduct credits from user's account for generation operations. 
          Called automatically for each major generation step.`,
        inputSchema: z.object({
          amount: z.number().min(1).describe("Number of credits to deduct"),
          reason: z
            .string()
            .describe(
              'Reason for credit deduction (e.g., "Chapter 3 generation")'
            ),
        }),
        execute: async ({ amount, reason }) => {
          // Deduct credits via mutation
          const result = await ctx.runMutation(
            internal.features.books.mutations.deductBookCredits,
            {
              bookId,
              amount,
              reason,
            }
          );

          return {
            success: true,
            remainingCredits: result.remainingCredits,
            amountDeducted: amount,
            reason,
          };
        },
      }),

      getBookContext: tool({
        description: `Retrieve context about the book including outline, 
          completed chapters, and user preferences. Use this to maintain 
          consistency and coherence across chapters.`,
        inputSchema: z.object({
          includeChapters: z
            .boolean()
            .default(true)
            .describe("Whether to include chapter content in context"),
          upToChapter: z
            .number()
            .optional()
            .describe("Include chapters up to this number (optional)"),
        }),
        execute: async ({ includeChapters, upToChapter }) => {
          // Get book context via query
          const context = await ctx.runQuery(
            internal.features.books.queries.getBookContext,
            {
              bookId,
              includeChapters,
              upToChapter,
            }
          );

          return context;
        },
      }),
    },
  });
}
