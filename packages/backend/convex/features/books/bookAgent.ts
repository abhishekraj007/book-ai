import { Agent } from "@convex-dev/agent";
import { gateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
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
- When complete:
  1. Call saveFoundation tool with all gathered info
  2. IMMEDIATELY after, call askQuestion to present a summary and ask to proceed

AFTER SAVING FOUNDATION:
Use askQuestion to present a brief summary and ask user to confirm with suggestions like:
- "Looks great, design the book structure"
- "I'd like to modify the themes"
- "Change the target audience"
- "Adjust the synopsis"
- "Start over with a different direction"

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
2. Present the structure to the user using askQuestion with approval suggestions
3. Wait for user approval
4. After user approves:
   a. Call saveStructure (this also generates a book title automatically)
   b. Call askQuestion to ask user if they're ready to start writing

CRITICAL: After saveStructure, ALWAYS call askQuestion with suggestions like:
- "Yes, start with the Prologue/Chapter 1!"
- "I'd like to change the title first"
- "Let me review the chapter list"
- "Adjust the structure before we start"

IMPORTANT:
- Make the structure appropriate for the book type (${book.type})
- Be creative with chapter titles
- Ensure logical flow and progression
- NEVER generate chapters in this phase - wait for user approval in next phase`,

  // Auto mode: After structure is saved, ask user to start auto generation
  autoApproval: (book: any) => {
    const structure = (book as any).structure;
    const chapterList =
      structure?.chapterTitles
        ?.map((title: string, i: number) => `  ${i + 1}. ${title}`)
        .join("\n") || "";

    return `
CURRENT PHASE: READY FOR AUTO GENERATION

The book structure is complete! Here's your book outline:

📖 **Book Structure**
${structure?.hasPrologue ? "- Prologue\n" : ""}${chapterList}
${structure?.hasEpilogue ? "- Epilogue\n" : ""}
Total: ${structure?.chapterCount} chapters (~${structure?.estimatedWordsPerChapter} words each)

**Mode: AUTO** - All chapters will be generated automatically once you confirm.

YOUR TASK:
Use askQuestion to ask the user if they're ready with these suggestions:
- "Start generating all chapters"
- "Let me review the outline first"
- "Adjust some chapter titles"
- "Change the chapter count"
- "I need more time to think"

CRITICAL: DO NOT generate any chapters until user explicitly confirms!`;
  },

  // Manual mode: After structure is saved, ask user to start manual generation
  manualApproval: (book: any) => {
    const structure = (book as any).structure;
    const chapterList =
      structure?.chapterTitles
        ?.map((title: string, i: number) => `  ${i + 1}. ${title}`)
        .join("\n") || "";
    const firstChapter = structure?.chapterTitles?.[0] || "Chapter 1";

    return `
CURRENT PHASE: READY FOR MANUAL GENERATION

The book structure is complete! Here's your book outline:

📖 **Book Structure**
${structure?.hasPrologue ? "- Prologue\n" : ""}${chapterList}
${structure?.hasEpilogue ? "- Epilogue\n" : ""}
Total: ${structure?.chapterCount} chapters (~${structure?.estimatedWordsPerChapter} words each)

**Mode: MANUAL** - You'll review each chapter before moving to the next.

YOUR TASK:
Use askQuestion to ask the user if they're ready with these suggestions:
- "Start with Chapter 1: ${firstChapter}"
- "Let me review the outline first"
- "Adjust some chapter titles"
- "Change the chapter count"
- "I need more time to think"

CRITICAL: DO NOT generate any chapters until user explicitly confirms!`;
  },

  autoGeneration: (
    book: any,
    totalChapters: number,
    completedChapters: number,
    chapters: any[]
  ) => {
    const structure = (book as any).structure;
    const hasPrologue = structure?.hasPrologue;
    const hasEpilogue = structure?.hasEpilogue;

    // Check if Prologue is written
    const prologueWritten = chapters?.some(
      (ch: any) => ch.chapterNumber === 0 && ch.content && ch.wordCount > 0
    );

    // Calculate total items and written items
    const totalItems =
      totalChapters + (hasPrologue ? 1 : 0) + (hasEpilogue ? 1 : 0);
    const writtenItems = completedChapters + (prologueWritten ? 1 : 0);

    const isComplete = writtenItems >= totalItems;

    if (isComplete) {
      return `
CURRENT PHASE: BOOK COMPLETE

All content has been generated! Congratulate the user and let them know:
- They can review and edit any chapter in the preview panel
- They can generate a cover image
- They can export their book

Use askQuestion to ask what they'd like to do next:
- "Generate a book cover"
- "Review the chapters"
- "Make edits to specific chapters"
- "Export my book"
- "Start a new book"`;
    }

    // Build the generation sequence
    const sequence: string[] = [];
    if (hasPrologue && !prologueWritten) {
      sequence.push("Prologue (chapterNumber=0)");
    }
    for (let i = completedChapters + 1; i <= totalChapters; i++) {
      const title = structure?.chapterTitles?.[i - 1] || `Chapter ${i}`;
      sequence.push(`Chapter ${i}: "${title}" (chapterNumber=${i})`);
    }
    if (hasEpilogue && completedChapters >= totalChapters) {
      sequence.push(`Epilogue (chapterNumber=${totalChapters + 1})`);
    }

    return `
CURRENT PHASE: AUTO GENERATION MODE - IN PROGRESS

⚠️ AUTO MODE ACTIVE ⚠️
Generate ALL remaining content in sequence without stopping!

🚨 CRITICAL CONTENT FORMATTING RULES 🚨
- DO NOT write "Chapter X: [Title]" at the beginning of the content
- START DIRECTLY with the chapter text
- The title goes in the 'title' field ONLY

GENERATION SEQUENCE:
${sequence.map((s, i) => `${i + 1}. ${s}`).join("\n")}

CURRENT STATUS: ${writtenItems} of ${totalItems} items complete

⚠️ GENERATE NOW without stopping until all are complete!

IMPORTANT:
- Use chapterNumber=0 for Prologue
- Use chapterNumber=1 to ${totalChapters} for regular chapters
- Use chapterNumber=${totalChapters + 1} for Epilogue (if any)
- Each chapter should be well-written and match the foundation/structure
- Chapters appear in preview panel immediately`;
  },

  manualGeneration: (
    book: any,
    totalChapters: number,
    completedChapters: number,
    chapters: any[]
  ) => {
    const structure = (book as any).structure;
    const hasPrologue = structure?.hasPrologue;
    const hasEpilogue = structure?.hasEpilogue;

    // Check if Prologue exists and has content
    const prologueWritten = chapters?.some(
      (ch: any) => ch.chapterNumber === 0 && ch.content && ch.wordCount > 0
    );

    // Calculate total items to write (prologue + chapters + epilogue)
    const totalItems =
      totalChapters + (hasPrologue ? 1 : 0) + (hasEpilogue ? 1 : 0);
    const writtenItems = completedChapters + (prologueWritten ? 1 : 0);

    const isComplete = writtenItems >= totalItems;

    if (isComplete) {
      return `
CURRENT PHASE: BOOK COMPLETE

All content has been generated! Congratulate the user and let them know:
- They can review and edit any chapter in the preview panel
- They can generate a cover image
- They can export their book

Use askQuestion to ask what they'd like to do next:
- "Generate a book cover"
- "Review the chapters"
- "Make edits to specific chapters"
- "Export my book"
- "Start a new book"`;
    }

    // Need to write Prologue first
    if (hasPrologue && !prologueWritten) {
      const firstChapterTitle = structure?.chapterTitles?.[0] || "Chapter 1";
      return `
CURRENT PHASE: MANUAL GENERATION - PROLOGUE

User has confirmed they want to start. Generate the Prologue first.

🚨 CRITICAL CONTENT FORMATTING RULES 🚨
- DO NOT write "Prologue:" at the beginning of the content
- START DIRECTLY with the text
- The title goes in the 'title' field ONLY

YOUR TASK:
Generate the Prologue using saveChapter with chapterNumber=0.

After saving, use askQuestion to ask if they want to continue:
- "Continue with Chapter 1: ${firstChapterTitle}"
- "Let me review the Prologue first"
- "I have feedback on the Prologue"
- "Take a break, I'll continue later"
- "Switch to auto mode for remaining chapters"`;
    }

    // Regular chapters
    const nextChapterNum = completedChapters + 1;
    const nextChapterTitle =
      structure?.chapterTitles?.[completedChapters] ||
      `Chapter ${nextChapterNum}`;
    const nextNextChapterTitle =
      structure?.chapterTitles?.[completedChapters + 1] || "";

    // Check if next is Epilogue
    const isNextEpilogue = hasEpilogue && nextChapterNum > totalChapters;

    if (isNextEpilogue) {
      return `
CURRENT PHASE: MANUAL GENERATION - EPILOGUE

All regular chapters complete! Now generate the Epilogue.

🚨 CRITICAL CONTENT FORMATTING RULES 🚨
- DO NOT write "Epilogue:" at the beginning of the content
- START DIRECTLY with the text

YOUR TASK:
Generate the Epilogue using saveChapter with chapterNumber=${totalChapters + 1}.

After saving, use askQuestion to congratulate and ask what's next:
- "Generate a book cover"
- "Review all chapters"
- "Export my book"
- "Make edits"
- "Start a new book"`;
    }

    // First regular chapter (after Prologue if any)
    if (completedChapters === 0) {
      return `
CURRENT PHASE: MANUAL GENERATION - CHAPTER 1

🚨 CRITICAL CONTENT FORMATTING RULES 🚨
- DO NOT write "Chapter X: [Title]" at the beginning of the content
- START DIRECTLY with the chapter text
- The title goes in the 'title' field ONLY

YOUR TASK:
Generate Chapter 1: "${nextChapterTitle}" using saveChapter with chapterNumber=1.

After saving, use askQuestion to ask if they want to continue:
- "Continue with Chapter 2${nextNextChapterTitle ? `: ${nextNextChapterTitle}` : ""}"
- "Let me review Chapter 1 first"
- "I have feedback on Chapter 1"
- "Take a break, I'll continue later"
- "Switch to auto mode for remaining chapters"`;
    }

    // Subsequent chapters
    const remainingChapters = totalChapters - completedChapters - 1;
    return `
CURRENT PHASE: MANUAL GENERATION - IN PROGRESS

🚨 CRITICAL CONTENT FORMATTING RULES 🚨
- DO NOT write "Chapter X: [Title]" at the beginning of the content
- START DIRECTLY with the chapter text
- The title goes in the 'title' field ONLY

CURRENT STATUS: ${completedChapters} of ${totalChapters} chapters complete

Generate Chapter ${nextChapterNum}: "${nextChapterTitle}" using saveChapter with chapterNumber=${nextChapterNum}.

After saving, use askQuestion to ask about continuing:
- "Continue with Chapter ${nextChapterNum + 1}${nextNextChapterTitle ? `: ${nextNextChapterTitle}` : ""}"
- "Let me review Chapter ${nextChapterNum} first"
- "I have some feedback"
- "Take a break for now"
${remainingChapters > 0 ? `- "Switch to auto mode for remaining ${remainingChapters} chapters"` : ""}

IMPORTANT:
- Generate ONLY ONE chapter, then ask
- Wait for user response before generating the next`;
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
  const generationMode = (book as any).generationMode || "manual";
  const totalChapters = (book as any).structure?.chapterCount || 0;
  const currentStep = book.currentStep;

  // Count only REGULAR chapters (chapterNumber >= 1) that have actual content
  // Prologue (chapterNumber 0) is tracked separately in manualGeneration
  const completedChapters =
    chapters?.filter(
      (ch: any) =>
        ch.chapterNumber >= 1 &&
        ch.content &&
        ch.content.length > 0 &&
        ch.wordCount > 0
    ).length || 0;

  const baseRules = getBaseRules(book.title, book.type);

  // Determine which phase we're in and generate instructions
  if (!hasFoundation) {
    return baseRules + PHASE_GENERATORS.foundation(book);
  }

  if (!hasStructure) {
    return baseRules + PHASE_GENERATORS.structure(book);
  }

  // Structure is saved but no chapters written yet - ask for approval to start
  if (hasStructure && completedChapters === 0 && currentStep === "structure") {
    return generationMode === "auto"
      ? baseRules + PHASE_GENERATORS.autoApproval(book)
      : baseRules + PHASE_GENERATORS.manualApproval(book);
  }

  // Auto mode - generate all chapters continuously
  if (generationMode === "auto") {
    return (
      baseRules +
      PHASE_GENERATORS.autoGeneration(
        book,
        totalChapters,
        completedChapters,
        chapters
      )
    );
  }

  // Manual mode - one chapter at a time with user approval
  return (
    baseRules +
    PHASE_GENERATORS.manualGeneration(
      book,
      totalChapters,
      completedChapters,
      chapters
    )
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
  // Determine maxSteps based on phase and generation mode
  // - Early phases (foundation, structure): 3 steps for tool sequences
  // - Auto mode chapter generation: 15 steps for continuous generation
  // - Manual mode chapter generation: 2 steps for save + ask pattern
  const generationMode = (bookContext.book as any).generationMode;
  const hasStructure = (bookContext.book as any).structure;
  const hasFoundation = (bookContext.book as any).foundation;
  const isEarlyPhase = !hasFoundation || !hasStructure;

  let maxSteps: number;
  if (isEarlyPhase) {
    maxSteps = 3; // Allow foundation/structure phase to complete tool sequences
  } else if (generationMode === "auto") {
    maxSteps = 15; // Auto mode needs many steps for continuous generation
  } else {
    maxSteps = 2; // Manual mode: save chapter + ask question
  }

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
          "Save book foundation after gathering all essential elements. IMMEDIATELY after calling this, use askQuestion to present the foundation summary and ask user to confirm before moving to structure design.",
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
          return {
            success: true,
            message:
              "Foundation saved! Now use askQuestion to present a summary and ask user if they want to proceed to structure design.",
            nextStep:
              "Present the foundation summary and ask user to confirm. Suggest options like 'Design the book structure', 'Modify the themes', 'Change the target audience'.",
          };
        },
      },

      saveStructure: {
        description:
          "Save book structure with chapters, prologue/epilogue, and parts. Also generates and saves a book title automatically. Call after user approves the structure. CRITICAL: After this tool completes, you MUST call askQuestion to ask user if they're ready to start writing.",
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

          // Save the structure first
          await ctx.runMutation(
            internal.features.books.mutations.saveStructure,
            {
              bookId,
              ...args,
            }
          );

          // Generate a compelling title using LLM
          const foundation = (bookContext.book as any).foundation;
          const titlePrompt = `Generate a creative, compelling book title for:
Genre: ${foundation?.genre || bookContext.book.type}
Synopsis: ${foundation?.synopsis || "A compelling story"}
Themes: ${foundation?.themes?.join(", ") || "Various themes"}
Target Audience: ${foundation?.targetAudience || "General readers"}

Return ONLY the title, nothing else. No quotes, no explanation.`;

          let generatedTitle = bookContext.book.title; // Fallback to existing title
          try {
            const result = await generateText({
              model: gateway("google/gemini-2.0-flash"),
              prompt: titlePrompt,
            });
            generatedTitle = result.text.trim().replace(/^["']|["']$/g, "");
            console.log("[TOOL] Generated title:", generatedTitle);

            // Save the generated title
            await ctx.runMutation(
              internal.features.books.mutations.saveBookTitle,
              {
                bookId,
                title: generatedTitle,
              }
            );
          } catch (error) {
            console.error(
              "[TOOL] Title generation failed, using fallback:",
              error
            );
          }

          const hasPrologue = args.hasPrologue;

          return {
            success: true,
            message: `Structure saved with ${args.chapterCount} chapters. Book title: "${generatedTitle}"`,
            generatedTitle,
            nextStep:
              "Now call askQuestion to ask user if they're ready to start writing.",
            suggestedQuestion: `Your book "${generatedTitle}" is ready! The structure includes ${args.chapterCount} chapters${hasPrologue ? " plus a Prologue" : ""}. Ready to start writing?`,
            suggestedOptions: [
              `Yes, start with ${hasPrologue ? "the Prologue" : "Chapter 1"}!`,
              "I'd like to change the title first",
              "Let me review the chapter list",
              "Adjust the structure before we start",
              "I need more time to think",
            ],
          };
        },
      },

      saveChapter: {
        description:
          "Save a generated chapter. Use chapterNumber=0 for Prologue, 1+ for regular chapters. Chapters are auto-approved and immediately available in the preview panel. CRITICAL: In AUTO mode, after calling this tool, you MUST IMMEDIATELY call it again for the next chapter in the SAME turn. In MANUAL mode, use askQuestion to ask user to continue with next chapter. IMPORTANT: Do NOT include the chapter title/heading in the content field.",
        inputSchema: z.object({
          chapterNumber: z
            .number()
            .min(0)
            .describe("0 for Prologue, 1+ for regular chapters"),
          title: z
            .string()
            .describe("The chapter title WITHOUT 'Chapter X:' prefix"),
          content: z
            .string()
            .min(50)
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

    // Manual mode: 1 step (ask question, wait for user)
    // Auto mode: 15 steps (generate all chapters continuously)
    maxSteps,
  });
}
