<!-- 99ce85ed-679f-45c2-abc7-57dd19e0d5ed 69dc70ab-ac59-44bd-a30b-4b942fe300d0 -->
# Migrate to Convex Agent Component

## Why This Migration?

**Current Issue:** Backend streams successfully but frontend can't parse the text stream format from `toTextStreamResponse()`.

**Better Solution:** Use [Convex Agent Component](https://docs.convex.dev/agents) which provides:

- Websocket-based real-time streaming (faster than HTTP)
- Automatic message persistence in threads
- Built-in conversation history and context
- Native Convex integration with live queries
- Perfect for multi-step approval workflows

## Architecture Changes

**Before (HTTP Streaming):**

```
Frontend → HTTP POST → Convex HTTP Action → streamText → SSE Response
                      ↓
                  Manual message persistence
```

**After (Convex Agent):**

```
Frontend → Convex Mutation → Create/Continue Thread → Agent generates
                      ↓
              Automatic message persistence
                      ↓
         Frontend useQuery (real-time updates via websockets)
```

## Implementation Steps

### 1. Install and Configure Convex Agent Component

**File:** `packages/backend/convex/convex.config.ts` (create new)

```typescript
import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";

const app = defineApp();
app.use(agent);

export default app;
```

**Install package:**

```bash
cd packages/backend
pnpm install @convex-dev/agent
npx convex dev  # Generate component code
```

### 2. Create Book Generation Agent

**File:** `packages/backend/convex/features/books/bookAgent.ts` (new)

Define agent with tools:

```typescript
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { components } from "../../_generated/api";
import { z } from "zod";
import { internal } from "../../_generated/api";

export const createBookAgent = (bookId: string, bookContext: any) => {
  return new Agent(components.agent, {
    name: "Book Writer",
    languageModel: openai.chat("gpt-4o"),  // Using AI Gateway model
    instructions: `You are an expert book writing assistant...
      Book: "${bookContext.book.title}" (${bookContext.book.type})
      Chapters completed: ${bookContext.chapters?.length || 0}
      
      Guide the user step-by-step with approval at each stage.`,
    
    tools: {
      saveOutline: {
        description: "Save book outline after user approval",
        parameters: z.object({
          chapterCount: z.number().min(1).max(100),
          chapterTitles: z.array(z.string()),
          synopsis: z.string(),
          estimatedWordsPerChapter: z.number(),
        }),
        execute: async (ctx, args) => {
          await ctx.runMutation(internal.features.books.mutations.saveOutline, {
            bookId,
            ...args,
          });
          return "Outline saved successfully!";
        },
      },
      
      saveChapter: {
        description: "Save chapter after user approval",
        parameters: z.object({
          chapterNumber: z.number(),
          title: z.string(),
          content: z.string(),
          wordCount: z.number(),
        }),
        execute: async (ctx, args) => {
          const result = await ctx.runMutation(
            internal.features.books.mutations.saveChapter,
            { bookId, ...args }
          );
          return `Chapter ${args.chapterNumber} saved!`;
        },
      },
      
      saveCheckpoint: {
        description: "Save progress checkpoint",
        parameters: z.object({
          step: z.string(),
          data: z.any(),
        }),
        execute: async (ctx, args) => {
          await ctx.runMutation(
            internal.features.books.mutations.saveCheckpoint,
            { bookId, ...args, timestamp: Date.now() }
          );
          return "Checkpoint saved";
        },
      },
    },
    
    maxSteps: 10,
  });
};
```

### 3. Create Convex Actions for Thread Management

**File:** `packages/backend/convex/features/books/actions.ts` (new)

Replace HTTP endpoint with Convex actions:

```typescript
import { action } from "../../_generated/server";
import { v } from "convex/values";
import { createBookAgent } from "./bookAgent";
import { internal } from "../../_generated/api";

// Start new book generation (creates thread)
export const startGeneration = action({
  args: {
    bookId: v.id("books"),
    prompt: v.string(),
  },
  handler: async (ctx, { bookId, prompt }) => {
    // Get book context
    const bookContext = await ctx.runQuery(
      internal.features.books.queries.getBookContext,
      { bookId, includeChapters: true }
    );
    
    // Create agent
    const agent = createBookAgent(bookId, bookContext);
    
    // Create thread and generate first response
    const { threadId, thread } = await agent.createThread(ctx);
    await thread.generateText({ prompt });
    
    // Save threadId to book for resuming
    await ctx.runMutation(internal.features.books.mutations.updateBook, {
      bookId,
      updates: { threadId },
    });
    
    return { threadId };
  },
});

// Continue existing conversation
export const continueGeneration = action({
  args: {
    bookId: v.id("books"),
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, { bookId, threadId, prompt }) => {
    const bookContext = await ctx.runQuery(
      internal.features.books.queries.getBookContext,
      { bookId, includeChapters: true }
    );
    
    const agent = createBookAgent(bookId, bookContext);
    const { thread } = await agent.continueThread(ctx, { threadId });
    await thread.generateText({ prompt });
    
    return { success: true };
  },
});
```

### 4. Add Thread Messages Query

**File:** `packages/backend/convex/features/books/queries.ts` (update)

Add query to fetch thread messages:

```typescript
import { query } from "../../_generated/server";
import { listUIMessages } from "@convex-dev/agent";
import { components } from "../../_generated/api";

export const getThreadMessages = query({
  args: {
    threadId: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, { threadId }) => {
    const messages = await listUIMessages(ctx, components.agent, {
      threadId,
      paginationOpts: { cursor: null, numItems: 100 },
    });
    return messages.page;
  },
});
```

### 5. Update Frontend Hook

**File:** `apps/web/src/hooks/use-book-generation.ts` (replace)

Switch from HTTP fetch to Convex mutations/queries:

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "@book-ai/backend/convex/_generated/api";
import { useCallback, useEffect, useState } from "react";
import type { Id } from "@book-ai/backend/convex/_generated/dataModel";

export function useBookGeneration(bookId: string, bookTitle?: string) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  
  const startGeneration = useMutation(api.features.books.actions.startGeneration);
  const continueGeneration = useMutation(api.features.books.actions.continueGeneration);
  
  // Real-time subscription to thread messages
  const messages = useQuery(
    api.features.books.queries.getThreadMessages,
    threadId ? { threadId } : "skip"
  );
  
  // Auto-start on mount if book title provided
  useEffect(() => {
    if (bookTitle && !threadId) {
      startGeneration({
        bookId: bookId as Id<"books">,
        prompt: `Please create an outline for: ${bookTitle}`,
      }).then(({ threadId: newThreadId }) => {
        setThreadId(newThreadId);
      });
    }
  }, [bookTitle, threadId, bookId, startGeneration]);
  
  const sendMessage = useCallback(
    async (text: string) => {
      if (!threadId) return;
      await continueGeneration({
        bookId: bookId as Id<"books">,
        threadId,
        prompt: text,
      });
      setInput("");
    },
    [threadId, bookId, continueGeneration]
  );
  
  const approve = useCallback(() => {
    sendMessage("Yes, I approve. Please proceed.");
  }, [sendMessage]);
  
  const reject = useCallback(() => {
    sendMessage("No, please revise that.");
  }, [sendMessage]);
  
  return {
    messages: messages || [],
    input,
    setInput,
    sendMessage,
    approve,
    reject,
    isLoading: messages === undefined,
    error: null,
  };
}
```

### 6. Update Database Schema

**File:** `packages/backend/convex/schema.ts` (update)

Add threadId to books table:

```typescript
books: defineTable({
  // ... existing fields
  threadId: v.optional(v.string()),  // Add this
}),
```

### 7. Remove Old HTTP Endpoint

**File:** `packages/backend/convex/http.ts` (update)

Remove the `/book/generate` route:

```typescript
// Remove these lines:
// http.route({
//   path: "/book/generate",
//   method: "POST",
//   handler: handleBookGeneration,
// });
```

**File:** `packages/backend/convex/features/books/http.ts` (delete)

Delete the entire file - no longer needed!

### 8. Keep AI Gateway Integration

**File:** `packages/backend/convex/lib/aiConfig.ts` (keep as-is)

The agent will use the same `gateway()` models we already configured. The `getModelWithFallback("bookGeneration")` returns `gateway("openai/gpt-4o")` which works directly with Agent's `languageModel` parameter.

## Benefits After Migration

1. **Real-time Updates**: Messages appear instantly via websockets
2. **Automatic Persistence**: All messages saved to Convex automatically
3. **Resume Support**: Built-in thread management
4. **Better Performance**: Websockets > HTTP streaming
5. **Simpler Code**: No manual SSE parsing or message management
6. **Agent Playground**: Debug conversations in Convex dashboard
7. **Vector Search**: Built-in semantic search over conversation history
8. **Multi-user**: Threads can be shared across users

## Testing Checklist

- [ ] Install @convex-dev/agent package
- [ ] Run `npx convex dev` to generate component code
- [ ] Create book and see thread created
- [ ] Messages appear in real-time in UI
- [ ] Tools (saveOutline, saveChapter) execute correctly
- [ ] Approve/Reject buttons work
- [ ] Refresh page - messages persist and reload
- [ ] Multiple users can view same book thread

## Migration is One-Way

Once migrated, the HTTP endpoint can be deleted. Convex Agent Component provides all functionality plus more.

### To-dos

- [ ] Install AI SDK 6 beta packages (@ai-sdk/openai@beta, @ai-sdk/anthropic@beta, @ai-sdk/google@beta, @ai-sdk/react@beta)
- [ ] Create multi-provider configuration with fallback middleware in convex/lib/ai-config.ts
- [ ] Implement Convex schema (books, chapters, chapterVersions, generationSessions tables)
- [ ] Create ToolLoopAgent with approval-required tools (generateOutline, generateChapter)
- [ ] Setup Convex HTTP streaming with data part reconciliation and transient notifications
- [ ] Build useBookGeneration hook with onData callback for approval handling
- [ ] Create v0.app-inspired generation UI with approval cards and transient notifications
- [ ] Implement version control mutations and VersionHistory component
- [ ] Add resume/retry mechanisms using session persistence and initialMessages
- [ ] Implement export functionality for PDF, EPUB, Markdown, HTML, TXT
- [ ] Install @convex-dev/agent package and configure convex.config.ts
- [ ] Create bookAgent.ts with Agent definition and tools
- [ ] Create actions.ts with startGeneration and continueGeneration actions
- [ ] Add getThreadMessages query to queries.ts
- [ ] Add threadId field to books table in schema.ts
- [ ] Refactor use-book-generation.ts to use Convex mutations/queries
- [ ] Delete features/books/http.ts and remove route from http.ts
- [ ] Test end-to-end: create book, generate outline, approve, generate chapter