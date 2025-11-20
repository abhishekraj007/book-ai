import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { components } from "../../_generated/api";
import { v } from "convex/values";
import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { R2 } from "@convex-dev/r2";

// Initialize R2 component
const r2 = new R2(components.r2);

export const generateCoverImage = action({
  args: {
    bookId: v.id("books"),
    customPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const book = await ctx.runQuery(
      internal.features.books.queries.getBookContext,
      {
        bookId: args.bookId,
        includeChapters: false,
      }
    );

    if (!book || !book.book) {
      throw new Error("Book not found");
    }

    const { title, type, foundation } = book.book as any;

    // Construct a detailed prompt for the image generation
    let prompt: string;

    if (args.customPrompt) {
      // Use custom prompt with basic requirements
      prompt = `Generate a professional book cover image with the following specifications:
${args.customPrompt}

Requirements:
- High quality, professional, visually striking design
- NO TEXT on the image (the title will be added separately)
- Artistic and eye-catching`;
    } else {
      // Use book context for generation
      prompt = `Generate a professional book cover image for a ${type} book titled "${title}".
Genre: ${foundation?.genre || "General"}
Theme: ${foundation?.themes?.join(", ") || "General"}
Synopsis: ${foundation?.synopsis || title}

Requirements:
- High quality, professional, visually striking design
- Suitable for a bestseller
- Artistic and eye-catching
- NO TEXT on the image (the title will be added separately)
- Focus on visual metaphors and mood that capture the essence of the book`;
    }

    try {
      // Use AI Gateway with Gemini 2.5 Flash Image for image generation
      const result = await generateText({
        model: gateway("google/gemini-2.5-flash-image-preview"),
        providerOptions: {
          google: {
            responseModalities: ["IMAGE"],
          },
        },
        prompt,
      });

      // Extract generated images from the result
      const imageFiles = result.files?.filter((f) =>
        f.mediaType?.startsWith("image/")
      );

      if (!imageFiles || imageFiles.length === 0) {
        throw new Error("No image was generated");
      }

      // Get the first generated image
      const imageFile = imageFiles[0];

      // Create a blob from the image data
      const blob = new Blob([imageFile.uint8Array as any], {
        type: imageFile.mediaType || "image/png",
      });

      // Generate a custom key for the image: covers/{bookId}/{timestamp}.{ext}
      const extension = (imageFile.mediaType || "image/png").split("/")[1];
      const customKey = `covers/${args.bookId}/${Date.now()}.${extension}`;

      // Upload to Cloudflare R2 using the Convex R2 component
      // The store method uploads the blob, syncs metadata, and returns the key
      const storageKey = await r2.store(ctx, blob, {
        key: customKey,
        type: imageFile.mediaType || "image/png",
      });

      // Get the public URL for the stored image
      const imageUrl = await r2.getUrl(storageKey);

      // Save the image URL and storage key to the book
      await ctx.runMutation(internal.features.books.mutations.saveCoverImage, {
        bookId: args.bookId,
        imageUrl: imageUrl,
        storageId: storageKey,
      });

      return { success: true, imageUrl, storageKey };
    } catch (error) {
      console.error("Failed to generate cover image:", error);
      throw new Error(
        `Failed to generate cover image: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});
