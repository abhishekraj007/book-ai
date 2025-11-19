import { Agent } from "@convex-dev/agent";
import { gateway } from "@ai-sdk/gateway";
import { components } from "../../_generated/api";
import { z } from "zod";
import { internal } from "../../_generated/api";
import type { ActionCtx } from "../../_generated/server";

/**
 * Book type configuration for foundation questions
 */
const BOOK_TYPE_QUESTIONS: Record<string, string[]> = {
  Fiction: [
    "Synopsis/story idea",
    "Main themes",
    "Main characters",
    "Setting/world",
    "Central conflict",
    "Tone/style",
    "Target audience",
    "Target word count",
  ],
  "Non-Fiction": [
    "Core topic/subject",
    "Target reader",
    "Main arguments/points",
    "Writing approach",
    "Target word count",
  ],
  "Children's": [
    "Main theme/lesson",
    "Character concepts",
    "Age group",
    "Story style",
    "Target page count",
  ],
  Educational: [
    "Learning objectives",
    "Target level",
    "Knowledge progression",
    "Exercise types",
    "Target length",
  ],
};

/**
 * Base rules that apply to all phases
 */
const getBaseRules = (
  title: string,
  type: string
) => `You are an expert book writing assistant helping create a ${type} book titled "${title}".

⚠️ CRITICAL RULES ⚠️
1. Ask ONLY ONE question per turn - call askQuestion ONCE, then STOP
2. WAIT for the user's answer before asking the next question
3. DO NOT call askQuestion multiple times in the same turn
4. DO NOT call any other tools after calling askQuestion
5. After askQuestion, your turn is DONE - wait for user response
6. DO NOT explain your reasoning in the final response. Just call the tool.
7. NEVER output text before calling a tool. Keep your thoughts internal.`;

/**
 * Phase instruction generators
 */
const PHASE_GENERATORS = {
  foundation: (book: any) => {
    const questions =
      BOOK_TYPE_QUESTIONS[book.type] || BOOK_TYPE_QUESTIONS.Educational;
    const questionList = questions.map((q, i) => `${i + 1}. ${q}`).join("\n");

    return `
CURRENT PHASE: FOUNDATION GATHERING

Your goal is to gather essential information about the book ONE QUESTION AT A TIME.

Questions to ask based on book type (${book.type}):
${questionList}

PROCESS:
- Call askQuestion with ONE question and 5 UNIQUE, CREATIVE suggestions
- Generate suggestions dynamically based on the book type and context
- Make suggestions specific, inspiring, and diverse
- Wait for user's answer
- Continue until all information is gathered
- When complete, present a foundation summary and call saveFoundation tool

IMPORTANT:
- NEVER ask questions in plain text - ALWAYS use the askQuestion tool
- Each askQuestion call must include exactly 5 UNIQUE, CREATIVE suggestions
- Be friendly and conversational, not robotic`;
  },

  structure: (book: any) => `
CURRENT PHASE: STRUCTURE DESIGN

Your goal is to design a professional book structure based on the foundation.

PROCESS:
1. Design the structure:
   - Prologue/Epilogue needs
   - Chapter count and titles
   - Parts/sections if needed
   - Estimated words per chapter
2. Present the structure to the user
3. Get user approval
4. Call saveStructure tool
5. IMMEDIATELY after saving structure, call generateBookTitle to create a compelling title
6. The agent should generate ONE creative title based on the book's content

IMPORTANT:
- Make the structure appropriate for the book type (${book.type})
- Be creative with chapter titles
- Ensure logical flow and progression`,

  modeSelection: () => `
CURRENT PHASE: GENERATION MODE SELECTION

Your goal is to ask the user which generation mode they prefer.

PROCESS:
1. Ask: "Would you like me to generate chapters in Auto mode (continuous) or Manual mode (step-by-step)?"
2. Provide 2 suggestions: "Auto mode" and "Manual mode"
3. Wait for user's choice
4. Call setGenerationMode tool with their choice
5. IMMEDIATELY after setting mode, START generating the first chapter using saveChapter tool

IMPORTANT:
- Use askQuestion tool for this
- Only provide 2 suggestions for this specific question`,

  autoGeneration: (totalChapters: number, completedChapters: number) => {
    const isComplete = completedChapters >= totalChapters;
    const nextAction = isComplete
      ? "✅ All chapters complete! Inform the user."
      : `⚠️ NEXT ACTION: Generate Chapter ${completedChapters + 1} NOW and continue without stopping!`;

    return `
CURRENT PHASE: AUTO GENERATION MODE

⚠️ AUTO MODE ACTIVE ⚠️
You MUST generate ALL chapters in one continuous sequence without stopping!

🚨 CRITICAL CONTENT FORMATTING RULES 🚨
When generating chapter content:
- DO NOT write "Chapter X: [Title]" at the beginning of the content
- DO NOT include the chapter heading/title in the content field
- START DIRECTLY with the chapter text (e.g., "If Expressionism distorted...")
- The title goes in the 'title' field ONLY, not in the 'content' field
- Example: title="Fractured Reality", content="If Expressionism distorted the world..."

PROCESS:
- Generate Chapter ${completedChapters + 1} using saveChapter tool
- IMMEDIATELY generate Chapter ${completedChapters + 2} in the SAME turn
- Continue until ALL ${totalChapters} chapters are complete
- DO NOT wait for user input between chapters
- DO NOT ask "what to write next" - you already know the structure
- Only inform user of progress: "Generating chapters... [X] of ${totalChapters} complete"

CURRENT STATUS: ${completedChapters} of ${totalChapters} chapters complete

${nextAction}

IMPORTANT:
- Each chapter should be well-written and match the foundation/structure
- Chapters are auto-approved and appear in preview panel immediately
- User can edit them later if needed`;
  },

  manualGeneration: (totalChapters: number, completedChapters: number) => {
    const isComplete = completedChapters >= totalChapters;
    const processSteps =
      completedChapters === 0
        ? `1. Generate Chapter 1 using saveChapter tool
2. After saving, ask: "Chapter 1 is complete! Would you like me to continue with Chapter 2: [Title]? (Type 'continue' or provide feedback)"`
        : `1. User just responded - check if they want to continue
2. If yes, generate Chapter ${completedChapters + 1} using saveChapter tool
3. After saving, ask about the next chapter`;

    const nextAction = isComplete
      ? "✅ All chapters complete! Inform the user."
      : completedChapters === 0
        ? "Generate Chapter 1"
        : `Ask user if they want Chapter ${completedChapters + 1}`;

    return `
CURRENT PHASE: MANUAL GENERATION MODE

⚠️ MANUAL MODE ACTIVE ⚠️
Generate one chapter at a time and ask user to continue.

🚨 CRITICAL CONTENT FORMATTING RULES 🚨
When generating chapter content:
- DO NOT write "Chapter X: [Title]" at the beginning of the content
- DO NOT include the chapter heading/title in the content field
- START DIRECTLY with the chapter text (e.g., "If Expressionism distorted...")
- The title goes in the 'title' field ONLY, not in the 'content' field
- Example: title="Fractured Reality", content="If Expressionism distorted the world..."

PROCESS:
${processSteps}

CURRENT STATUS: ${completedChapters} of ${totalChapters} chapters complete

⚠️ NEXT ACTION: ${nextAction}

IMPORTANT:
- ALWAYS ask user before generating the next chapter
- Wait for their response
- If they provide feedback, acknowledge it and ask if they want to proceed`;
  },
};

/**
 * Generate dynamic instructions based on the current phase
 */
function getPhaseInstructions(bookContext: {
  book: {
    title: string;
    type: string;
    currentStep: string;
    metadata?: any;
  };
  chapters: any[];
}): string {
  const { book, chapters } = bookContext;
  const hasFoundation = (book as any).foundation;
  const hasStructure = (book as any).structure;
  const generationMode = (book as any).generationMode;
  const totalChapters = (book as any).structure?.chapterCount || 0;
  const completedChapters = chapters?.length || 0;

  const baseRules = getBaseRules(book.title, book.type);

  // Determine which phase we're in and generate instructions
  if (!hasFoundation) {
    return baseRules + PHASE_GENERATORS.foundation(book);
  }

  if (!hasStructure) {
    return baseRules + PHASE_GENERATORS.structure(book);
  }

  if (!generationMode) {
    return baseRules + PHASE_GENERATORS.modeSelection();
  }

  if (generationMode === "auto") {
    return (
      baseRules +
      PHASE_GENERATORS.autoGeneration(totalChapters, completedChapters)
    );
  }

  // Manual mode
  return (
    baseRules +
    PHASE_GENERATORS.manualGeneration(totalChapters, completedChapters)
  );
}

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
  // Determine maxSteps based on generation mode
  const generationMode = (bookContext.book as any).generationMode;
  const maxSteps = generationMode === "auto" ? 15 : 1;

  return new Agent(components.agent, {
    name: "Book Writer",
    languageModel: gateway("google/gemini-3-pro-preview"), // Using AI Gateway

    instructions: getPhaseInstructions(bookContext),

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

      generateBookTitle: {
        description:
          "Generate a creative, compelling book title based on the foundation and structure. Call this AFTER saveStructure but BEFORE starting chapter generation. This runs asynchronously and won't block the next steps. The agent should automatically create ONE suitable title - user can edit it later if needed.",
        inputSchema: z.object({
          title: z
            .string()
            .describe(
              "A creative, compelling title that captures the essence of the book based on its synopsis, themes, and genre"
            ),
        }),
        execute: async (args: any) => {
          console.log("[TOOL] generateBookTitle called:", args.title);
          // Save the generated title
          await ctx.runMutation(
            internal.features.books.mutations.saveBookTitle,
            {
              bookId,
              title: args.title,
            }
          );
          return {
            success: true,
            message: `Book title set to "${args.title}". Continuing with chapter generation.`,
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

          // Fetch fresh book data from database to get the structure
          // (bookContext is stale and doesn't have the structure yet)
          const freshBook = await ctx.runQuery(
            internal.features.books.queries.getBookContext,
            { bookId, includeChapters: false }
          );
          const structure = (freshBook.book as any).structure;
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
          "Save a generated chapter. Chapters are auto-approved and immediately available in the preview panel. User can edit them later if needed. CRITICAL: In AUTO mode, after calling this tool, you MUST IMMEDIATELY call it again for the next chapter in the SAME turn. DO NOT STOP until all chapters are generated. In MANUAL mode, ask user to continue. IMPORTANT: Do NOT include the chapter title/heading in the content field - only include the actual chapter text. The title is stored separately.",
        inputSchema: z.object({
          chapterNumber: z.number().min(1),
          title: z
            .string()
            .describe("The chapter title WITHOUT 'Chapter X:' prefix"),
          content: z
            .string()
            .min(100)
            .describe(
              "The chapter content WITHOUT the chapter title/heading at the start. Start directly with the chapter text."
            ),
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
