"use node";

import { action } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { marked } from "marked";

/**
 * Book Export Actions
 *
 * Supports exporting books to:
 * - Markdown (.md)
 * - HTML (.html)
 * - Plain Text (.txt)
 * - PDF (.pdf) - via HTML conversion
 * - EPUB (.epub) - via structured content
 */

// ============================================================================
// Export to Markdown
// ============================================================================

export const exportToMarkdown = action({
  args: {
    bookId: v.string(),
  },
  returns: v.object({
    content: v.string(),
    filename: v.string(),
  }),
  handler: async (
    ctx,
    { bookId }
  ): Promise<{ content: string; filename: string }> => {
    // Get book and chapters
    const book = await ctx.runQuery(
      internal.features.books.queries.getBookContext,
      {
        bookId,
        includeChapters: true,
      }
    );

    let markdown: string = `# ${book.book.title}\n\n`;
    markdown += `**Type:** ${book.book.type}\n\n`;

    if (book.book.metadata.genre) {
      markdown += `**Genre:** ${book.book.metadata.genre}\n\n`;
    }

    markdown += `---\n\n`;

    // Add chapters
    for (const chapter of book.chapters) {
      markdown += `## Chapter ${chapter.chapterNumber}: ${chapter.title}\n\n`;
      markdown += `${chapter.content}\n\n`;
      markdown += `---\n\n`;
    }

    return {
      content: markdown,
      filename: `${book.book.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`,
    };
  },
});

// ============================================================================
// Export to HTML
// ============================================================================

export const exportToHTML = action({
  args: {
    bookId: v.string(),
  },
  returns: v.object({
    content: v.string(),
    filename: v.string(),
  }),
  handler: async (
    ctx,
    { bookId }
  ): Promise<{ content: string; filename: string }> => {
    // Get book and chapters
    const book = await ctx.runQuery(
      internal.features.books.queries.getBookContext,
      {
        bookId,
        includeChapters: true,
      }
    );

    // Convert markdown to HTML using marked
    let html: string = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${book.book.title}</title>
  <style>
    body {
      font-family: 'Georgia', serif;
      line-height: 1.8;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      color: #000;
    }
    h2 {
      font-size: 1.8rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
      color: #000;
      page-break-before: always;
    }
    .metadata {
      font-style: italic;
      color: #666;
      margin-bottom: 2rem;
    }
    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 2rem 0;
    }
    @media print {
      body {
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <h1>${book.book.title}</h1>
  <div class="metadata">
    <p><strong>Type:</strong> ${book.book.type}</p>
    ${book.book.metadata.genre ? `<p><strong>Genre:</strong> ${book.book.metadata.genre}</p>` : ""}
  </div>
  <hr>
`;

    // Add chapters with markdown to HTML conversion
    for (const chapter of book.chapters) {
      html += `  <h2>Chapter ${chapter.chapterNumber}: ${chapter.title}</h2>\n`;
      const chapterHtml = await marked(chapter.content);
      html += `  <div class="chapter-content">\n${chapterHtml}\n  </div>\n`;
      html += `  <hr>\n`;
    }

    html += `</body>
</html>`;

    return {
      content: html,
      filename: `${book.book.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.html`,
    };
  },
});

// ============================================================================
// Export to Plain Text
// ============================================================================

export const exportToText = action({
  args: {
    bookId: v.string(),
  },
  returns: v.object({
    content: v.string(),
    filename: v.string(),
  }),
  handler: async (
    ctx,
    { bookId }
  ): Promise<{ content: string; filename: string }> => {
    // Get book and chapters
    const book = await ctx.runQuery(
      internal.features.books.queries.getBookContext,
      {
        bookId,
        includeChapters: true,
      }
    );

    let text: string = `${book.book.title.toUpperCase()}\n`;
    text += `${"=".repeat(book.book.title.length)}\n\n`;
    text += `Type: ${book.book.type}\n`;

    if (book.book.metadata.genre) {
      text += `Genre: ${book.book.metadata.genre}\n`;
    }

    text += `\n${"=".repeat(50)}\n\n`;

    // Add chapters (strip markdown formatting)
    for (const chapter of book.chapters) {
      text += `CHAPTER ${chapter.chapterNumber}: ${chapter.title.toUpperCase()}\n`;
      text += `${"-".repeat(50)}\n\n`;

      // Simple markdown removal (basic)
      let plainContent = chapter.content
        .replace(/#{1,6}\s+/g, "") // Remove headers
        .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold
        .replace(/\*(.+?)\*/g, "$1") // Remove italic
        .replace(/\[(.+?)\]\(.+?\)/g, "$1") // Remove links
        .replace(/`(.+?)`/g, "$1"); // Remove code

      text += `${plainContent}\n\n`;
      text += `${"=".repeat(50)}\n\n`;
    }

    return {
      content: text,
      filename: `${book.book.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`,
    };
  },
});

// ============================================================================
// Export Metadata (for EPUB/PDF generation on frontend)
// ============================================================================

export const getExportData = action({
  args: {
    bookId: v.string(),
  },
  returns: v.object({
    title: v.string(),
    author: v.string(),
    chapters: v.array(
      v.object({
        chapterNumber: v.number(),
        title: v.string(),
        content: v.string(),
        htmlContent: v.string(),
      })
    ),
    metadata: v.any(),
  }),
  handler: async (
    ctx,
    { bookId }
  ): Promise<{
    title: string;
    author: string;
    chapters: Array<{
      chapterNumber: number;
      title: string;
      content: string;
      htmlContent: string;
    }>;
    metadata: any;
  }> => {
    // Get book and chapters
    const book = await ctx.runQuery(
      internal.features.books.queries.getBookContext,
      {
        bookId,
        includeChapters: true,
      }
    );

    // Convert each chapter's markdown to HTML
    const chaptersWithHtml = await Promise.all(
      book.chapters.map(async (chapter: any) => ({
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        content: chapter.content,
        htmlContent: await marked(chapter.content),
      }))
    );

    return {
      title: book.book.title,
      author: "Generated by Book AI", // TODO: Get actual user name
      chapters: chaptersWithHtml,
      metadata: book.book.metadata,
    };
  },
});
