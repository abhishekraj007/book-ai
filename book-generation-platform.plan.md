# Book Generation Platform - AI SDK 6 Architecture

## Architecture Overview

**Key Architectural Decisions:**

- **AI SDK 6 Beta**: Use ToolLoopAgent with tool approval for agentic workflow
- **Convex-First**: All business logic in backend (reusable for native)
- **Data Part Reconciliation**: Progressive updates with same ID reconciliation
- **v0.app-Inspired UI**: Clean streaming interface with approval checkpoints

**Stack:**

- Backend: Convex (database + HTTP streaming)
- AI: AI SDK 6 ToolLoopAgent with multi-provider support
- Frontend: Next.js + AI SDK UI hooks + shadcn-ui
- Future: Native app reuses Convex backend

## Phase 1: AI SDK 6 Setup & Configuration

### 1.1 Install AI SDK 6 Beta

```bash
pnpm add ai@beta @ai-sdk/openai@beta @ai-sdk/anthropic@beta @ai-sdk/google@beta @ai-sdk/react@beta
```

### 1.2 Multi-Provider Setup with Kimi K2 Thinking

`packages/backend/convex/lib/ai-config.ts`:

```typescript
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { wrapLanguageModel, defaultSettingsMiddleware } from "ai";

// Kimi K2 Thinking via Vercel AI Gateway
// Can execute 200-300 sequential tool calls - perfect for book generation!
// Context: 262K, optimized for writing and agentic reasoning
const kimiK2 = openai.languageModel("moonshotai/kimi-k2-thinking", {
  baseURL:
    "https://gateway.ai.cloudflare.com/v1/<ACCOUNT_ID>/<GATEWAY_ID>/openai",
  // Or use Vercel AI Gateway
});

// Provider registry optimized for book writing
export const models = {
  // For book generation - uses Kimi K2 Thinking
  bookGeneration: {
    primary: kimiK2, // 200-300 tool calls, excellent for multi-step workflows
    fallback: [
      anthropic("claude-sonnet-4-20250514"), // Strong writing abilities
      openai("gpt-4o"), // General purpose fallback
    ],
  },
  // For quick tasks (outlines, summaries)
  fast: {
    primary: openai("gpt-4o-mini"),
    fallback: [
      google("gemini-2.0-flash"),
      anthropic("claude-haiku-4-20250514"),
    ],
  },
  // For complex reasoning (if Kimi fails)
  powerful: {
    primary: anthropic("claude-opus-4-20250514"),
    fallback: [openai("o1"), google("gemini-2.5-pro")],
  },
};

// Get model with automatic fallback and retry
export function getModelWithFallback(
  tier: "bookGeneration" | "fast" | "powerful"
) {
  const config = models[tier];
  return wrapLanguageModel({
    model: config.primary,
    middleware: [
      defaultSettingsMiddleware({
        settings: {
          maxRetries: 2, // AI SDK built-in retry
          maxOutputTokens: 8000, // Longer responses for book content
        },
      }),
      // Custom fallback middleware
      {
        wrapGenerate: async ({ doGenerate, params }) => {
          try {
            return await doGenerate();
          } catch (error) {
            console.error(`Primary model failed, trying fallbacks...`);
            // Try each fallback
            for (const fallbackModel of config.fallback) {
              try {
                return await fallbackModel.doGenerate(params);
              } catch (fallbackError) {
                console.error(`Fallback failed: ${fallbackError.message}`);
              }
            }
            throw error; // All models failed
          }
        },
      },
    ],
  });
}
```

**Why Kimi K2 Thinking is Perfect:**

- **Agentic Tool Use**: Can handle 200-300 sequential tool calls → entire book workflow
- **Writing Optimized**: State-of-the-art on writing benchmarks
- **Large Context (262K)**: Holds full book for consistency checks
- **Reasoning**: Steps through outline → chapters → revisions logically
- **Cost Effective**: $0.60/M input, $2.50/M output tokens
- **Vercel AI Gateway**: Easy integration with AI SDK

### 1.3 Database Schema with Versioning

`packages/backend/convex/schema.ts`:

**books** table:

```typescript
books: defineTable({
  userId: v.string(),
  title: v.string(),
  type: v.string(), // "fiction", "non_fiction", etc.
  status: v.string(), // "draft", "generating", "completed"
  currentStep: v.string(),
  metadata: v.object({
    genre: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    tone: v.optional(v.string()),
  }),
  creditsUsed: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});
```

**chapters** table with versions:

```typescript
chapters: defineTable({
  bookId: v.id("books"),
  chapterNumber: v.number(),
  title: v.string(),
  content: v.string(), // Current version
  currentVersion: v.number(),
  status: v.string(),
  wordCount: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_book", ["bookId"]);
```

**chapterVersions** table:

```typescript
chapterVersions: defineTable({
  chapterId: v.id("chapters"),
  versionNumber: v.number(),
  content: v.string(),
  changedBy: v.string(), // "user" | "ai"
  changeDescription: v.string(),
  createdAt: v.number(),
}).index("by_chapter_version", ["chapterId", "versionNumber"]);
```

**generationSessions** table (resume support):

```typescript
generationSessions: defineTable({
  bookId: v.id("books"),
  messages: v.array(v.any()), // AI SDK message history
  currentStage: v.string(),
  lastCheckpoint: v.object({
    step: v.string(),
    timestamp: v.number(),
    data: v.any(),
  }),
  status: v.string(),
  retryCount: v.number(),
  lastActiveAt: v.number(),
}).index("by_book", ["bookId"]);
```

## Phase 2: AI SDK 6 Agent Implementation

### 2.1 ToolLoopAgent with Approval Workflow

`packages/backend/convex/features/books/agent.ts`:

```typescript
import { ToolLoopAgent, tool } from "ai";
import { z } from "zod";

export const bookAgent = new ToolLoopAgent({
  model: getModelWithFallback("balanced"),
  instructions: "You are a professional book writing assistant...",

  tools: {
    // Tool with approval required
    generateOutline: tool({
      description: "Generate book outline with chapters",
      needsApproval: true, // User must approve!
      inputSchema: z.object({
        chapterCount: z.number(),
        chapterTitles: z.array(z.string()),
        synopsis: z.string(),
      }),
      execute: async ({ chapterCount, chapterTitles }) => {
        // Save outline to DB
        return { success: true, outlineId: "..." };
      },
    }),

    // Tool with approval
    generateChapter: tool({
      description: "Generate a full chapter",
      needsApproval: true,
      inputSchema: z.object({
        chapterNumber: z.number(),
        title: z.string(),
        outline: z.string(),
      }),
      execute: async ({ chapterNumber, title, outline }) => {
        // Generate and save chapter
        return { chapterId: "...", wordCount: 2500 };
      },
    }),

    // Auto-save checkpoints (no approval)
    saveCheckpoint: tool({
      description: "Save progress checkpoint",
      inputSchema: z.object({
        step: z.string(),
        data: z.any(),
      }),
      execute: async ({ step, data }) => {
        // Save to generationSessions
        return { saved: true };
      },
    }),

    deductCredits: tool({
      description: "Deduct credits for generation",
      inputSchema: z.object({
        amount: z.number(),
        reason: z.string(),
      }),
      execute: async ({ amount, reason }) => {
        // Update user credits
        return { newBalance: 100 };
      },
    }),
  },
});
```

### 2.2 Convex HTTP Streaming with Data Part Reconciliation

`packages/backend/convex/http.ts`:

```typescript
import { createAgentUIStreamResponse } from "ai";
import { createUIMessageStream } from "ai";

http.route({
  path: "/book/generate",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const { bookId, messages } = await req.json();

    // Load session for resume
    const session = await ctx.runQuery(/* get session */);
    const initialMessages = session?.messages || messages;

    // Create stream with data part reconciliation
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // 1. Send loading state (will be updated)
        writer.write({
          type: "data-chapter-status",
          id: "chapter-1", // Same ID = reconciliation
          data: { chapterNumber: 1, status: "loading", progress: 0 },
        });

        // 2. Send transient notification
        writer.write({
          type: "data-notification",
          data: { message: "Starting chapter 1...", level: "info" },
          transient: true, // Not saved to history
        });

        // 3. Run agent
        const result = await bookAgent.generate({
          messages: initialMessages,
        });

        // 4. Update same data part (reconciliation!)
        writer.write({
          type: "data-chapter-status",
          id: "chapter-1", // Same ID updates existing
          data: { chapterNumber: 1, status: "completed", progress: 100 },
        });

        // 5. Merge agent stream
        writer.merge(result.toUIMessageStream());
      },
    });

    return createAgentUIStreamResponse({ agent: bookAgent, stream });
  }),
});
```

**Key Features:**

- Data part reconciliation: Same `id` updates existing parts
- Transient notifications: Status updates not saved to history
- Resume support: Load initial messages from session
- Agent integration: Automatic tool loop execution

### 2.3 Version Control System

`packages/backend/convex/features/books/versions.ts`:

```typescript
export const createVersion = mutation({
  args: {
    chapterId: v.id("chapters"),
    content: v.string(),
    changedBy: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.chapterId);
    const newVersion = chapter.currentVersion + 1;

    // Save version
    await ctx.db.insert("chapterVersions", {
      chapterId: args.chapterId,
      versionNumber: newVersion,
      content: args.content,
      changedBy: args.changedBy,
      changeDescription: args.description,
      createdAt: Date.now(),
    });

    // Update chapter
    await ctx.db.patch(args.chapterId, {
      content: args.content,
      currentVersion: newVersion,
      updatedAt: Date.now(),
    });

    return { versionNumber: newVersion };
  },
});

export const revertToVersion = mutation({
  args: {
    chapterId: v.id("chapters"),
    versionNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const version = await ctx.db
      .query("chapterVersions")
      .withIndex("by_chapter_version", (q) =>
        q
          .eq("chapterId", args.chapterId)
          .eq("versionNumber", args.versionNumber)
      )
      .first();

    if (!version) throw new Error("Version not found");

    // Create new version (marking as revert)
    return await ctx.runMutation(internal.books.versions.createVersion, {
      chapterId: args.chapterId,
      content: version.content,
      changedBy: "user",
      description: `Reverted to version ${args.versionNumber}`,
    });
  },
});
```

## Phase 3: Frontend with AI SDK UI Hooks

### 3.1 Type-Safe Message Types

`apps/web/src/types/messages.ts`:

```typescript
import { UIMessage } from "ai";

// Define custom message type with data parts
export type BookUIMessage = UIMessage<
  never, // no metadata
  {
    // Data part types
    "chapter-status": {
      chapterNumber: number;
      status: "loading" | "completed" | "error";
      progress: number;
    };
    outline: {
      chapters: Array<{ number: number; title: string }>;
      approved: boolean;
    };
    notification: {
      message: string;
      level: "info" | "warning" | "error";
    };
  }
>;
```

### 3.2 Generation Hook with Approval

`apps/web/src/hooks/use-book-generation.ts`:

```typescript
import { useChat } from "@ai-sdk/react";
import { BookUIMessage } from "@/types/messages";
import { useState } from "react";

export function useBookGeneration(bookId: string) {
  const [pendingApproval, setPendingApproval] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const { messages, sendMessage, isLoading } = useChat<BookUIMessage>({
    api: "/api/book/generate",
    id: bookId,

    // Handle data parts as they arrive
    onData: (dataPart) => {
      // Handle transient notifications (only here, not in messages)
      if (dataPart.type === "data-notification") {
        setNotifications((prev) => [...prev, dataPart.data]);
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n !== dataPart.data));
        }, 3000);
      }

      // Handle approval requests
      if (dataPart.type === "tool-approval-request") {
        setPendingApproval(dataPart.data);
      }
    },

    onError: (error) => {
      console.error("Generation error:", error);
      // Automatic retry handled by AI SDK maxRetries
    },
  });

  const approve = async (toolCallId: string) => {
    await sendMessage({
      toolApproval: { toolCallId, approved: true },
    });
    setPendingApproval(null);
  };

  const reject = async (toolCallId: string) => {
    await sendMessage({
      toolApproval: { toolCallId, approved: false },
    });
    setPendingApproval(null);
  };

  return {
    messages,
    sendMessage,
    isLoading,
    pendingApproval,
    approve,
    reject,
    notifications,
  };
}
```

### 3.3 v0.app-Inspired Generation UI

`apps/web/src/app/books/[id]/page.tsx`:

```tsx
"use client";

import { useBookGeneration } from "@/hooks/use-book-generation";

export default function BookGenerationPage({
  params,
}: {
  params: { id: string };
}) {
  const {
    messages,
    sendMessage,
    pendingApproval,
    approve,
    reject,
    notifications,
  } = useBookGeneration(params.id);

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <aside className="w-80 border-r p-4">
        <h2 className="font-semibold mb-4">Chapters</h2>
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.parts
              .filter((p) => p.type === "data-chapter-status")
              .map((part, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span>Chapter {part.data.chapterNumber}</span>
                  {part.data.status === "loading" && <Spinner />}
                  {part.data.status === "completed" && <Check />}
                </div>
              ))}
          </div>
        ))}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Transient Notifications */}
        <div className="fixed top-4 right-4 space-y-2">
          {notifications.map((notif, i) => (
            <div key={i} className="bg-blue-100 p-3 rounded">
              {notif.message}
            </div>
          ))}
        </div>

        {/* Streaming Messages */}
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.parts
              .filter((p) => p.type === "text")
              .map((part, i) => (
                <p key={i}>{part.text}</p>
              ))}
          </div>
        ))}

        {/* Approval Card */}
        {pendingApproval && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-2xl">
              <h3 className="font-semibold mb-4">Approval Required</h3>
              <pre className="bg-gray-50 p-4 rounded mb-4">
                {JSON.stringify(pendingApproval.args, null, 2)}
              </pre>
              <div className="flex gap-2">
                <button
                  onClick={() => approve(pendingApproval.toolCallId)}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => reject(pendingApproval.toolCallId)}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

### 3.4 Version History UI

`apps/web/src/components/version-history.tsx`:

```tsx
export function VersionHistory({ chapterId }: { chapterId: string }) {
  const versions = useQuery(api.books.versions.getHistory, { chapterId });
  const revert = useMutation(api.books.versions.revertToVersion);

  return (
    <div className="space-y-2">
      {versions?.map((v) => (
        <div key={v._id} className="border p-3 rounded">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-semibold">v{v.versionNumber}</span>
              <span className="text-sm text-gray-500 ml-2">
                by {v.changedBy}
              </span>
            </div>
            <button
              onClick={() =>
                revert({ chapterId, versionNumber: v.versionNumber })
              }
              className="text-blue-500 text-sm"
            >
              Restore
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{v.changeDescription}</p>
        </div>
      ))}
    </div>
  );
}
```

## Phase 4: Export System

`packages/backend/convex/features/books/export.ts`:

Standard export to PDF, EPUB, Markdown, HTML, TXT

## Phase 5: Advanced Features

### 5.1 Embeddings & RAG (Future)

`packages/backend/convex/lib/embeddings.ts`:

```typescript
import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

const embeddingModel = openai.textEmbeddingModel("text-embedding-3-small");

export async function generateEmbeddings(chunks: string[]) {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
    maxParallelCalls: 2, // AI SDK built-in parallelization
  });
  return embeddings;
}
```

### 5.2 Provider Middleware for Fallback

```typescript
import { wrapLanguageModel } from "ai";

export function createRobustModel(primary: any, fallbacks: any[]) {
  return wrapLanguageModel({
    model: primary,
    middleware: {
      wrapGenerate: async ({ doGenerate, params }) => {
        try {
          return await doGenerate();
        } catch (error) {
          // Try fallback models
          for (const fallback of fallbacks) {
            try {
              return await fallback.doGenerate(params);
            } catch {}
          }
          throw error;
        }
      },
    },
  });
}
```

## Implementation Order

1. Install AI SDK 6 beta packages
2. Setup multi-provider config with fallback middleware
3. Create database schema (books, chapters, versions, sessions)
4. Implement ToolLoopAgent with approval tools
5. Setup Convex HTTP streaming with data part reconciliation
6. Build frontend with useChat and approval UI
7. Implement version control and undo/redo
8. Add resume/retry mechanisms
9. Create v0.app-inspired UI components
10. Add export functionality
11. Test approval workflow end-to-end

## Key AI SDK 6 Features Used

1. **ToolLoopAgent** - Automatic tool loop execution
2. **needsApproval** on tools - Built-in approval workflow
3. **Data Part Reconciliation** - Progressive updates with same ID
4. **Transient Data Parts** - Ephemeral notifications
5. **maxRetries** - Built-in retry logic (defaults to 2)
6. **wrapLanguageModel** - Provider fallback middleware
7. **embed/embedMany** - Future RAG support
8. **createAgentUIStreamResponse** - Streaming with type safety
9. **onData callback** - Handle data parts including transient
10. **Message persistence** - Resume conversations via initialMessages

## Technical Advantages

- **Type-Safe Messages**: UIMessage with custom data part types
- **Automatic Reconciliation**: Same ID updates existing UI parts
- **Built-in Retry**: No custom retry logic needed
- **Tool Approval UX**: Native approval flow
- **Provider Agnostic**: Easy switching between OpenAI/Anthropic/Google
- **Convex-First**: Backend reusable for native app
- **v0.app UX**: Modern streaming interface
- **Version Control**: Full history with undo/redo
