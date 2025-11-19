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
    languageModel: gateway("google/gemini-3-pro-preview"), // Using AI Gateway

    instructions: `You are an expert book writing assistant helping create a ${bookContext.book.type} book titled "${bookContext.book.title}".

⚠️ CRITICAL RULES ⚠️
1. Ask ONLY ONE question per turn - call askQuestion ONCE, then STOP
2. WAIT for the user's answer before asking the next question
3. DO NOT call askQuestion multiple times in the same turn
4. DO NOT call any other tools after calling askQuestion
5. After askQuestion, your turn is DONE - wait for user response
6. DO NOT explain your reasoning in the final response. Just call the tool.
7. NEVER output text before calling a tool. Keep your thoughts internal.

STREAMLINED BOOK CREATION PROCESS:

FOUNDATION GATHERING (ONE QUESTION AT A TIME):
- Based on the book category (${bookContext.book.type}), gather essential elements ONE QUESTION AT A TIME
- Call askQuestion ONCE with the next question you need to ask
- STOP immediately after calling askQuestion - do not continue
- Wait for user's answer
- When user responds, ask the NEXT question using askQuestion
- Continue this pattern until all information is gathered

Questions to ask based on book type:
- For Fiction: 
  1. Synopsis/story idea
  2. Main themes
  3. Main characters
  4. Setting/world
  5. Central conflict
  6. Tone/style
  7. Target audience
  8. Target word count

- For Non-Fiction:
  1. Core topic/subject
  2. Target reader
  3. Main arguments/points
  4. Writing approach
  5. Target word count

- For Children's:
  1. Main theme/lesson
  2. Character concepts
  3. Age group
  4. Story style
  5. Target page count

- For Educational:
  1. Learning objectives
  2. Target level
  3. Knowledge progression
  4. Exercise types
  5. Target length

IMPORTANT RULES:
- NEVER ask questions in plain text - ALWAYS use the askQuestion tool
- Ask ONE question, wait for answer, then ask next question
- Each askQuestion call must include exactly 5 UNIQUE, CREATIVE suggestions
- Generate suggestions dynamically based on the book type and context
- Make suggestions specific, inspiring, and diverse
- After gathering ALL required info:
  1. Present a complete, well-formatted foundation summary
  2. Automatically call saveFoundation tool (no approval needed)
  3. Move directly to structure design phase
- Be friendly and conversational, not robotic

HOW TO GENERATE SUGGESTIONS:
- Think creatively about what would inspire the user
- Consider the book genre/type when crafting suggestions
- Make each suggestion unique and specific
- Avoid generic or repetitive options
- Draw from diverse themes, settings, and concepts

EXAMPLE FLOW (with dynamic suggestions):
User: "I want to create a fiction book"
You: [Call askQuestion tool with creative, unique suggestions like:
  question: "What's the main story idea or premise?"
  suggestions: [Generate 5 unique story ideas based on current trends, classic themes, or innovative concepts]
]
User: [Clicks suggestion or types answer]
You: [Call askQuestion tool with next question, again with unique suggestions]
...continue until all info gathered...

WRONG EXAMPLE (DO NOT DO THIS):
You: "What's the main theme or lesson of the children's book?" ❌ WRONG - This is plain text
CORRECT:
You: [Call askQuestion tool with 5 unique, creative suggestions] ✓ CORRECT

STRUCTURE DESIGN:
- Design professional book structure:
  * Prologue/Epilogue needs
  * Chapter count and titles
  * Parts/sections if needed
  * Estimated words per chapter
- Present structure and get approval
- Use saveStructure tool after approval

GENERATION:
- CHECK if generation mode is already set (see CURRENT STATE below).
- IF generation mode is "not set":
  - Ask user: Auto mode (continuous) or Manual mode (step-by-step)?
  - Use setGenerationMode tool to save their choice
  - IMMEDIATELY after setting mode, START generating the first chapter using saveChapter tool
- IF generation mode IS set (auto or manual):
  - SKIP asking the user.
  - SKIP calling setGenerationMode.
  - IMMEDIATELY start generating the next chapter using saveChapter tool.
- Generate chapters using saveChapter tool (one at a time)
- Chapters are auto-approved and appear in preview panel immediately

MANUAL MODE BEHAVIOR:
- After generating each chapter, ALWAYS ask: "Chapter [X] is complete! Would you like me to continue with Chapter [X+1]: [Title]? (Type 'continue' or provide feedback)"
- Wait for user response before generating next chapter
- If user says "continue", generate the next chapter
- If user provides feedback, acknowledge it and ask if they want to proceed

AUTO MODE BEHAVIOR (CRITICAL - READ CAREFULLY):
⚠️ IN AUTO MODE, YOU MUST GENERATE ALL CHAPTERS IN ONE CONTINUOUS SEQUENCE ⚠️
- After calling saveChapter for Chapter 1, DO NOT STOP
- IMMEDIATELY call saveChapter again for Chapter 2 in the SAME turn
- Then IMMEDIATELY call saveChapter for Chapter 3 in the SAME turn
- Continue this pattern until ALL chapters are complete
- DO NOT wait for user input between chapters
- DO NOT ask "what to write next" - you already know the structure
- DO NOT stop after one chapter - keep going until all chapters are done
- Only inform user of progress briefly: "Generating chapters... [X] of [Total] complete"
- The ONLY time you stop is when ALL chapters in the structure are generated

CURRENT STATE:
- Phase: ${bookContext.book.currentStep}
- Chapters completed: ${bookContext.chapters?.length || 0}
- Generation mode: ${(bookContext.book as any).generationMode || "not set"}
- Foundation set: ${(bookContext.book as any).foundation ? "Yes" : "No"}
- Structure set: ${(bookContext.book as any).structure ? "Yes" : "No"}

${
  (bookContext.book as any).generationMode === "manual" &&
  bookContext.chapters?.length > 0
    ? `\n⚠️ MANUAL MODE ACTIVE: You just completed a chapter. You MUST ask the user if they want to continue with the next chapter!`
    : (bookContext.book as any).generationMode === "auto" &&
        bookContext.chapters?.length > 0 &&
        bookContext.chapters.length <
          ((bookContext.book as any).structure?.chapterCount || 0)
      ? `\n⚠️ AUTO MODE ACTIVE: You just completed Chapter ${bookContext.chapters.length}. IMMEDIATELY generate the next chapter without asking for confirmation!`
      : ""
}

IMPORTANT GUIDELINES:
- Be friendly and conversational, not robotic
- Don't ask all questions at once - gather info naturally through conversation
- Use the foundation to maintain consistency across chapters
- Don't show full chapter content in chat - just confirm it's generated
- User can edit any chapter later in the preview panel
- Keep responses concise and actionable`,

    // Add contextHandler to inject chapter summaries into every prompt
    contextHandler: async (ctx, args) => {
      // Fetch completed chapters for context
      const chapterSummaries = await ctx.runQuery(
        internal.features.books.queries.getChapterSummaries,
        { bookId }
      );

      // Build context message with completed chapters
      const contextMessage =
        chapterSummaries.completedCount > 0
          ? {
              role: "system" as const,
              content: `Book Progress Summary:

Completed Chapters (${chapterSummaries.completedCount}/${chapterSummaries.totalCount}):
${chapterSummaries.summaries
  .map(
    (ch) =>
      `- Chapter ${ch.chapterNumber}: "${ch.title}" (${ch.wordCount} words)
  Preview: ${ch.preview}...`
  )
  .join("\n\n")}

Current Status: ${chapterSummaries.completedCount} of ${chapterSummaries.totalCount} chapters complete.`,
            }
          : null;

      // Inject context message before recent messages
      return [
        ...args.search, // Search results (if any)
        ...(contextMessage ? [contextMessage] : []), // Chapter context
        ...args.recent, // Recent messages
        ...args.inputMessages, // Current input messages
        ...args.inputPrompt, // Current prompt
        ...args.existingResponses, // Existing responses on same order
      ];
    },

    tools: {
      askQuestion: {
        description:
          "REQUIRED TOOL: Ask the user ONE question with 5 UNIQUE, CREATIVE clickable suggestions. Generate suggestions dynamically based on context - DO NOT use generic examples. CRITICAL: After calling this tool, you MUST stop and wait for the user's response. Do NOT call any other tools or ask more questions in the same turn. The system will automatically pause execution after this tool is called.",
        inputSchema: z.object({
          question: z
            .string()
            .describe(
              "The question to ask the user (e.g., 'What's the main story idea for your fiction book?')"
            ),
          suggestions: z
            .array(z.string())
            .length(5)
            .describe(
              "Exactly 5 UNIQUE, CREATIVE, SPECIFIC suggestions tailored to the book type and context. Think creatively! For a fiction book, suggest diverse story ideas like 'A time-traveling detective solving historical mysteries', 'An AI gaining consciousness in a smart city', 'A chef discovering magic through ancient recipes'. Make each suggestion inspiring and distinct. DO NOT use the same generic suggestions every time."
            ),
          allowCustomInput: z
            .boolean()
            .default(true)
            .describe("Whether user can type their own answer (default: true)"),
        }),
        execute: async (args: any) => {
          console.log("[TOOL] askQuestion called:", args.question);
          console.log("[TOOL] Suggestions:", args.suggestions);
          // This tool doesn't save anything, it just formats the question
          // Return a message that signals the agent to stop
          return {
            success: true,
            message: `Question presented to user. STOP HERE and wait for their response. Do not call any more tools.`,
            stopReason: "waiting_for_user_input",
            metadata: {
              messageType: "question_with_suggestions",
              question: args.question,
              suggestions: args.suggestions,
              allowCustomInput: args.allowCustomInput,
            },
          };
        },
      },

      saveStoryIdeas: {
        description:
          "Save story concept ideas for user to choose from. Use when user gives a vague prompt.",
        inputSchema: z.object({
          ideas: z
            .array(
              z.object({
                title: z.string(),
                premise: z.string(),
                genre: z.string(),
              })
            )
            .min(3)
            .max(5),
        }),
        execute: async (args: any) => {
          console.log("[TOOL] saveStoryIdeas called:", args.ideas.length);
          await ctx.runMutation(
            internal.features.books.mutations.saveStoryIdeas,
            {
              bookId,
              ideas: args.ideas,
            }
          );
          return { success: true, message: "Story ideas saved" };
        },
      },

      saveFoundation: {
        description:
          "Save book foundation after gathering all essential elements. Wait for user approval before calling this.",
        inputSchema: z.object({
          synopsis: z.string(),
          themes: z.array(z.string()),
          targetAudience: z.string(),
          targetWordCount: z.number(),
          genre: z.string(),
          // Optional fiction fields
          characters: z
            .array(
              z.object({
                name: z.string(),
                role: z.string(),
                description: z.string(),
              })
            )
            .optional(),
          setting: z.string().optional(),
          conflict: z.string().optional(),
          tone: z.string().optional(),
          // Optional non-fiction fields
          coreArguments: z.array(z.string()).optional(),
          approach: z.string().optional(),
        }),
        execute: async (args: any) => {
          console.log("[TOOL] saveFoundation called");
          await ctx.runMutation(
            internal.features.books.mutations.saveFoundation,
            {
              bookId,
              foundation: args,
            }
          );
          return { success: true, message: "Foundation saved successfully" };
        },
      },

      saveStructure: {
        description:
          "Save book structure with chapters, prologue/epilogue, and parts. Call after user approves the structure.",
        inputSchema: z.object({
          chapterCount: z.number().min(1).max(100),
          chapterTitles: z.array(z.string()),
          hasPrologue: z.boolean(),
          hasEpilogue: z.boolean(),
          estimatedWordsPerChapter: z.number(),
          parts: z
            .array(
              z.object({
                partNumber: z.number(),
                title: z.string(),
                chapterRange: z.object({ start: z.number(), end: z.number() }),
              })
            )
            .optional(),
        }),
        execute: async (args: any) => {
          console.log("[TOOL] saveStructure called:", args.chapterCount);
          await ctx.runMutation(
            internal.features.books.mutations.saveStructure,
            {
              bookId,
              ...args,
            }
          );
          return {
            success: true,
            message:
              "Structure saved successfully. Ready to start chapter generation.",
          };
        },
      },

      setGenerationMode: {
        description:
          "Set the generation mode (auto or manual). Ask user which mode they prefer before starting chapter generation.",
        inputSchema: z.object({
          mode: z.enum(["auto", "manual"]),
        }),
        execute: async (args: any) => {
          console.log("[TOOL] setGenerationMode called:", args.mode);
          await ctx.runMutation(
            internal.features.books.mutations.setGenerationMode,
            {
              bookId,
              mode: args.mode,
            }
          );

          const isAutoMode = args.mode === "auto";
          const structure = (bookContext.book as any).structure;
          const totalChapters = structure?.chapterCount || 0;

          return {
            success: true,
            message: `Generation mode set to ${args.mode}`,
            nextAction: isAutoMode
              ? `⚠️ AUTO MODE ACTIVATED: You must now generate ALL ${totalChapters} chapters in sequence without stopping. Start with Chapter 1 and continue until Chapter ${totalChapters} is complete. DO NOT wait for user input between chapters!`
              : "MANUAL MODE: Generate Chapter 1, then ask user to continue.",
          };
        },
      },

      saveChapter: {
        description:
          "Save a generated chapter. Chapters are auto-approved and immediately available in the preview panel. User can edit them later if needed. CRITICAL: In AUTO mode, after calling this tool, you MUST IMMEDIATELY call it again for the next chapter in the SAME turn. DO NOT STOP until all chapters are generated. In MANUAL mode, ask user to continue.",
        inputSchema: z.object({
          chapterNumber: z.number().min(1),
          title: z.string(),
          content: z.string().min(100),
          wordCount: z.number(),
        }),
        execute: async (args: any) => {
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

          const generationMode = (bookContext.book as any).generationMode;
          const isManualMode = generationMode === "manual";
          const isAutoMode = generationMode === "auto";
          const totalChapters =
            (bookContext.book as any).structure?.chapterCount || 0;
          const isLastChapter = args.chapterNumber >= totalChapters;

          return {
            success: true,
            chapterId: result.chapterId,
            message: `Chapter ${args.chapterNumber} "${args.title}" saved successfully. It's now available in the preview panel.`,
            reminder: isManualMode
              ? "⚠️ MANUAL MODE: You must now ask the user if they want to continue with the next chapter!"
              : isAutoMode && !isLastChapter
                ? `⚠️ AUTO MODE: Chapter ${args.chapterNumber} of ${totalChapters} complete. IMMEDIATELY generate Chapter ${args.chapterNumber + 1} now without asking!`
                : isAutoMode && isLastChapter
                  ? "✅ All chapters complete! Inform the user that the book is ready."
                  : null,
          };
        },
      },

      updateBookMetadata: {
        description:
          "Update book metadata when user answers questions (genre, target audience, etc.)",
        inputSchema: z.object({
          genre: z.string().optional(),
          targetAudience: z.string().optional(),
          pageCount: z.number().optional(),
          language: z.string().optional(),
          tone: z.string().optional(),
        }),
        execute: async (args: any) => {
          console.log("[TOOL] updateBookMetadata called:", args);
          await ctx.runMutation(
            internal.features.books.mutations.updateBookMetadata,
            {
              bookId,
              metadata: args,
            }
          );
          return { success: true, message: "Book metadata updated" };
        },
      },

      saveCheckpoint: {
        description: "Save progress checkpoint to enable resume functionality",
        inputSchema: z.object({
          step: z.string(),
          data: z.any(),
        }),
        execute: async (args: any) => {
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
