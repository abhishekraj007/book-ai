import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";

// Query to get all pages for a book in order
export const getBookPages = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const pages = await ctx.db
      .query("bookPages")
      .withIndex("by_book_order", (q) => q.eq("bookId", args.bookId))
      .collect();

    // Sort by order to ensure correct sequence
    return pages.sort((a, b) => a.order - b.order);
  },
});

// Query to get missing pages (pages that should exist but don't)
export const getMissingPages = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");

    const existingPages = await ctx.db
      .query("bookPages")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .collect();

    const existingTypes = new Set(existingPages.map((p) => p.pageType));

    // Define required and optional pages based on book type
    const requiredPages = ["title_page", "table_of_contents"];
    const optionalPages = [
      "copyright",
      "dedication",
      "foreword",
      "preface",
      "acknowledgments",
      "about_author",
      "bibliography",
      "appendix",
    ];

    // Add prologue/epilogue based on book structure
    if (book.structure?.hasPrologue && !existingTypes.has("prologue")) {
      requiredPages.push("prologue");
    }
    if (book.structure?.hasEpilogue && !existingTypes.has("epilogue")) {
      requiredPages.push("epilogue");
    }

    const missingRequired = requiredPages.filter(
      (type) => !existingTypes.has(type as any)
    );
    const missingOptional = optionalPages.filter(
      (type) => !existingTypes.has(type as any)
    );

    return {
      required: missingRequired,
      optional: missingOptional,
    };
  },
});

// Mutation to create a new book page
export const createBookPage = mutation({
  args: {
    bookId: v.id("books"),
    pageType: v.union(
      v.literal("title_page"),
      v.literal("copyright"),
      v.literal("dedication"),
      v.literal("table_of_contents"),
      v.literal("foreword"),
      v.literal("preface"),
      v.literal("acknowledgments"),
      v.literal("prologue"),
      v.literal("chapter"),
      v.literal("epilogue"),
      v.literal("about_author"),
      v.literal("bibliography"),
      v.literal("appendix")
    ),
    order: v.optional(v.number()),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    chapterId: v.optional(v.id("chapters")),
  },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");

    // Get current max order if order not provided
    let order = args.order;
    if (order === undefined) {
      const pages = await ctx.db
        .query("bookPages")
        .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
        .collect();
      order = pages.length > 0 ? Math.max(...pages.map((p) => p.order)) + 1 : 0;
    }

    // Determine if page is optional
    const optionalPageTypes = [
      "dedication",
      "foreword",
      "preface",
      "acknowledgments",
      "bibliography",
      "appendix",
    ];
    const isOptional = optionalPageTypes.includes(args.pageType);

    const pageId = await ctx.db.insert("bookPages", {
      bookId: args.bookId,
      pageType: args.pageType,
      order,
      title: args.title,
      content: args.content,
      chapterId: args.chapterId,
      status: args.content ? "completed" : "empty",
      isOptional,
      isVisible: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return pageId;
  },
});

// Mutation to update book page content and formatting
export const updateBookPage = mutation({
  args: {
    pageId: v.id("bookPages"),
    content: v.optional(v.string()),
    title: v.optional(v.string()),
    formatting: v.optional(
      v.object({
        textAlign: v.optional(
          v.union(v.literal("left"), v.literal("center"), v.literal("right"))
        ),
        fontSize: v.optional(
          v.union(
            v.literal("small"),
            v.literal("medium"),
            v.literal("large"),
            v.literal("xlarge")
          )
        ),
        fontWeight: v.optional(v.union(v.literal("normal"), v.literal("bold"))),
        fontStyle: v.optional(
          v.union(v.literal("normal"), v.literal("italic"))
        ),
        lineHeight: v.optional(
          v.union(v.literal("tight"), v.literal("normal"), v.literal("relaxed"))
        ),
        marginTop: v.optional(
          v.union(
            v.literal("none"),
            v.literal("small"),
            v.literal("medium"),
            v.literal("large")
          )
        ),
        marginBottom: v.optional(
          v.union(
            v.literal("none"),
            v.literal("small"),
            v.literal("medium"),
            v.literal("large")
          )
        ),
        pageBreakBefore: v.optional(v.boolean()),
        pageBreakAfter: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found");

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.content !== undefined) {
      updates.content = args.content;
      updates.status = args.content ? "completed" : "empty";
    }

    if (args.title !== undefined) {
      updates.title = args.title;
    }

    if (args.formatting !== undefined) {
      updates.formatting = args.formatting;
    }

    await ctx.db.patch(args.pageId, updates);
  },
});

// Mutation to reorder book pages
export const reorderBookPages = mutation({
  args: {
    bookId: v.id("books"),
    pageOrders: v.array(
      v.object({ pageId: v.id("bookPages"), order: v.number() })
    ),
  },
  handler: async (ctx, args) => {
    for (const { pageId, order } of args.pageOrders) {
      await ctx.db.patch(pageId, { order, updatedAt: Date.now() });
    }
  },
});

// Mutation to delete a book page (only if optional)
export const deleteBookPage = mutation({
  args: { pageId: v.id("bookPages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found");

    if (!page.isOptional) {
      throw new Error("Cannot delete required page");
    }

    await ctx.db.delete(args.pageId);
  },
});

// Mutation to toggle page visibility
export const togglePageVisibility = mutation({
  args: { pageId: v.id("bookPages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found");

    await ctx.db.patch(args.pageId, {
      isVisible: !page.isVisible,
      updatedAt: Date.now(),
    });
  },
});

// Mutation to initialize default book pages when a book structure is created
export const initializeDefaultPages = mutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");

    // Check if pages already exist
    const existingPages = await ctx.db
      .query("bookPages")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .collect();

    if (existingPages.length > 0) {
      return; // Pages already initialized
    }

    let order = 0;

    // Create title page
    await ctx.db.insert("bookPages", {
      bookId: args.bookId,
      pageType: "title_page",
      order: order++,
      status: book.title ? "completed" : "empty",
      isOptional: false,
      isVisible: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create copyright page (optional)
    await ctx.db.insert("bookPages", {
      bookId: args.bookId,
      pageType: "copyright",
      order: order++,
      status: "empty",
      isOptional: true,
      isVisible: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create table of contents
    await ctx.db.insert("bookPages", {
      bookId: args.bookId,
      pageType: "table_of_contents",
      order: order++,
      status: "completed", // Auto-generated
      isOptional: false,
      isVisible: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create about author page (optional, goes at the end)
    await ctx.db.insert("bookPages", {
      bookId: args.bookId,
      pageType: "about_author",
      order: 1000, // Put at end by default
      status: book.authorBio ? "completed" : "empty",
      isOptional: true,
      isVisible: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
