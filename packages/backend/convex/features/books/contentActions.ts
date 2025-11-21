import { action, ActionCtx } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";
import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { Id } from "../../_generated/dataModel";

/**
 * AI Content Enhancement Actions
 *
 * These actions provide AI-powered content improvements with full book context:
 * - Rewrite: Improve clarity and style while maintaining meaning
 * - Enhance: Add vivid details, better vocabulary, emotional depth
 * - Expand: Add more context, scenes, dialogue, character development
 */

/**
 * Rewrite content with improved clarity and style
 */
export const rewriteContent = action({
  args: {
    bookId: v.id("books"),
    contentId: v.string(),
    contentType: v.union(v.literal("chapter"), v.literal("page")),
    customInstruction: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (
    ctx: ActionCtx,
    args: {
      bookId: Id<"books">;
      contentId: string;
      contentType: "chapter" | "page";
      customInstruction?: string;
    }
  ): Promise<string> => {
    console.log(`[REWRITE] ${args.contentType} ${args.contentId}`);

    // Get book context with all chapters for consistency
    const bookContext: any = await ctx.runQuery(
      internal.features.books.queries.getBookContext,
      {
        bookId: args.bookId,
        includeChapters: true,
      }
    );

    if (!bookContext) {
      throw new Error("Book not found");
    }

    // Get the specific content to rewrite
    let originalContent: string = "";
    let title: string = "";

    if (args.contentType === "chapter") {
      const chapter = await ctx.runQuery(
        internal.features.books.queries.getChapterById,
        { chapterId: args.contentId }
      );
      if (!chapter) throw new Error("Chapter not found");
      originalContent = chapter.content;
      title = chapter.title;
    } else {
      const page = await ctx.runQuery(
        internal.features.books.pages.getPageById,
        { pageId: args.contentId }
      );
      if (!page) throw new Error("Page not found");
      originalContent = page.content || "";
      title = page.title || page.pageType;
    }

    if (!originalContent) {
      throw new Error("No content to rewrite");
    }

    // Construct detailed prompt with book context
    const customInstructionSection = args.customInstruction
      ? `\n\nCustom Instructions from User:\n${args.customInstruction}\n`
      : "";

    const prompt: string = `You are a professional editor helping to rewrite content for a ${bookContext.book.type} book.

Book Context:
- Title: ${bookContext.book.title}
- Genre: ${bookContext.book.metadata?.foundation?.genre || "General"}
- Themes: ${bookContext.book.metadata?.foundation?.themes?.join(", ") || "N/A"}
- Synopsis: ${bookContext.book.metadata?.foundation?.synopsis || ""}

${args.contentType === "chapter" ? `Chapter: ${title}` : `Page: ${title}`}

Task: Rewrite the following content to improve clarity and style while maintaining the EXACT SAME meaning and story events.

Guidelines:
- Keep all plot points, character actions, and story events identical
- Improve sentence structure and flow
- Enhance readability
- Maintain the original tone and voice
- Keep the same approximate length${args.customInstruction ? "\n- IMPORTANT: Follow the custom instructions provided above" : ""}
- Return ONLY the rewritten content in markdown format

Original Content:
${originalContent}

Rewritten Content:`;

    try {
      const result: any = await generateText({
        model: gateway("google/gemini-3-pro-preview"),
        prompt,
      });

      const rewrittenContent: string = result.text.trim();
      console.log(`[REWRITE] Generated ${rewrittenContent.length} characters`);

      return rewrittenContent;
    } catch (error) {
      console.error("[REWRITE] Failed:", error);
      throw new Error(
        `Failed to rewrite content: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});

/**
 * Enhance content with more vivid details and emotional depth
 */
export const enhanceContent = action({
  args: {
    bookId: v.id("books"),
    contentId: v.string(),
    contentType: v.union(v.literal("chapter"), v.literal("page")),
    customInstruction: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (
    ctx: ActionCtx,
    args: {
      bookId: Id<"books">;
      contentId: string;
      contentType: "chapter" | "page";
      customInstruction?: string;
    }
  ): Promise<string> => {
    console.log(`[ENHANCE] ${args.contentType} ${args.contentId}`);

    // Get book context
    const bookContext: any = await ctx.runQuery(
      internal.features.books.queries.getBookContext,
      {
        bookId: args.bookId,
        includeChapters: true,
      }
    );

    if (!bookContext) {
      throw new Error("Book not found");
    }

    // Get the specific content to enhance
    let originalContent: string = "";
    let title: string = "";

    if (args.contentType === "chapter") {
      const chapter = await ctx.runQuery(
        internal.features.books.queries.getChapterById,
        { chapterId: args.contentId }
      );
      if (!chapter) throw new Error("Chapter not found");
      originalContent = chapter.content;
      title = chapter.title;
    } else {
      const page = await ctx.runQuery(
        internal.features.books.pages.getPageById,
        { pageId: args.contentId }
      );
      if (!page) throw new Error("Page not found");
      originalContent = page.content || "";
      title = page.title || page.pageType;
    }

    if (!originalContent) {
      throw new Error("No content to enhance");
    }

    // Construct detailed prompt with book context
    const customInstructionSection = args.customInstruction
      ? `\n\nCustom Instructions from User:\n${args.customInstruction}\n`
      : "";

    const prompt: string = `You are a professional editor enhancing content for a ${bookContext.book.type} book.

Book Context:
- Title: ${bookContext.book.title}
- Genre: ${bookContext.book.metadata?.foundation?.genre || "General"}
- Themes: ${bookContext.book.metadata?.foundation?.themes?.join(", ") || "N/A"}
- Synopsis: ${bookContext.book.metadata?.foundation?.synopsis || ""}

${args.contentType === "chapter" ? `Chapter: ${title}` : `Page: ${title}`}

Task: Enhance the following content to make it more vivid, engaging, and emotionally impactful.

Guidelines:
- Improve vocabulary and word choice with more descriptive language
- Add sensory details (sight, sound, smell, touch, taste)
- Enhance emotional impact and character depth
- Refine sentence structure for better rhythm
- Maintain all plot points and story events
- The enhanced version should be roughly 20-30% longer${args.customInstruction ? "\n- IMPORTANT: Follow the custom instructions provided above" : ""}
- Return ONLY the enhanced content in markdown format

Original Content:
${originalContent}

Enhanced Content:`;

    try {
      const result: any = await generateText({
        model: gateway("google/gemini-3-pro-preview"),
        prompt,
      });

      const enhancedContent: string = result.text.trim();
      console.log(`[ENHANCE] Generated ${enhancedContent.length} characters`);

      return enhancedContent;
    } catch (error) {
      console.error("[ENHANCE] Failed:", error);
      throw new Error(
        `Failed to enhance content: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});

/**
 * Expand content with additional scenes, dialogue, and character development
 */
export const expandContent = action({
  args: {
    bookId: v.id("books"),
    contentId: v.string(),
    contentType: v.union(v.literal("chapter"), v.literal("page")),
    customInstruction: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (
    ctx: ActionCtx,
    args: {
      bookId: Id<"books">;
      contentId: string;
      contentType: "chapter" | "page";
      customInstruction?: string;
    }
  ): Promise<string> => {
    console.log(`[EXPAND] ${args.contentType} ${args.contentId}`);

    // Get book context
    const bookContext: any = await ctx.runQuery(
      internal.features.books.queries.getBookContext,
      {
        bookId: args.bookId,
        includeChapters: true,
      }
    );

    if (!bookContext) {
      throw new Error("Book not found");
    }

    // Get the specific content to expand
    let originalContent: string = "";
    let title: string = "";

    if (args.contentType === "chapter") {
      const chapter = await ctx.runQuery(
        internal.features.books.queries.getChapterById,
        { chapterId: args.contentId }
      );
      if (!chapter) throw new Error("Chapter not found");
      originalContent = chapter.content;
      title = chapter.title;
    } else {
      const page = await ctx.runQuery(
        internal.features.books.pages.getPageById,
        { pageId: args.contentId }
      );
      if (!page) throw new Error("Page not found");
      originalContent = page.content || "";
      title = page.title || page.pageType;
    }

    if (!originalContent) {
      throw new Error("No content to expand");
    }

    // Construct detailed prompt with book context
    const customInstructionSection = args.customInstruction
      ? `\n\nCustom Instructions from User:\n${args.customInstruction}\n`
      : "";

    const prompt: string = `You are a professional editor expanding content for a ${bookContext.book.type} book.

Book Context:
- Title: ${bookContext.book.title}
- Genre: ${bookContext.book.metadata?.foundation?.genre || "General"}
- Themes: ${bookContext.book.metadata?.foundation?.themes?.join(", ") || "N/A"}
- Synopsis: ${bookContext.book.metadata?.foundation?.synopsis || ""}

${args.contentType === "chapter" ? `Chapter: ${title}` : `Page: ${title}`}

Task: Expand the following content with additional depth, scenes, and character development.

Guidelines:
- Add more context and background details
- Develop characters more fully with internal thoughts and motivations
- Include additional scenes and dialogue that enhance the story
- Expand on themes and subplots
- Maintain consistency with the book's overall narrative
- The expanded version should be roughly 50-80% longer${args.customInstruction ? "\n- IMPORTANT: Follow the custom instructions provided above" : ""}
- Return ONLY the expanded content in markdown format

Original Content:
${originalContent}

Expanded Content:`;

    try {
      const result: any = await generateText({
        model: gateway("google/gemini-3-pro-preview"),
        prompt,
      });

      const expandedContent: string = result.text.trim();
      console.log(`[EXPAND] Generated ${expandedContent.length} characters`);

      return expandedContent;
    } catch (error) {
      console.error("[EXPAND] Failed:", error);
      throw new Error(
        `Failed to expand content: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});
