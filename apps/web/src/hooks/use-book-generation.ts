"use client";

import { useAction } from "convex/react";
import { useUIMessages } from "@convex-dev/agent/react";
import { api } from "@book-ai/backend/convex/_generated/api";
import { useCallback, useEffect, useState } from "react";
import type { Id } from "@book-ai/backend/convex/_generated/dataModel";

/**
 * useBookGeneration Hook
 *
 * Uses Convex Agent Component with real-time streaming for v0.app-style UX:
 * - Word-by-word streaming as text is generated
 * - Websocket-based updates (no HTTP polling)
 * - Automatic message persistence in threads
 * - Built-in conversation history
 * - Live text smoothing for better perceived performance
 *
 * @param bookId - The ID of the book being generated
 * @param bookTitle - The title/description of the book to generate
 */
export function useBookGeneration(bookId: string, bookTitle?: string) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const startGeneration = useAction(api.features.books.actions.startGeneration);
  const continueGeneration = useAction(
    api.features.books.actions.continueGeneration
  );

  // Real-time subscription to thread messages with streaming deltas
  // This uses the specialized Agent hook for proper streaming support
  const {
    results: messages,
    status,
    loadMore,
  } = useUIMessages(
    api.features.books.queries.getThreadMessages,
    threadId ? { threadId } : "skip",
    {
      initialNumItems: 100,
      stream: true, // Enable real-time streaming
    }
  );

  // Auto-start generation on mount if book title provided
  useEffect(() => {
    if (bookTitle && !threadId && !isStarting) {
      setIsStarting(true);
      startGeneration({
        bookId: bookId as Id<"books">,
        prompt: `Please create an outline for: ${bookTitle}`,
      })
        .then(({ threadId: newThreadId }) => {
          console.log("[HOOK] Thread created:", newThreadId);
          setThreadId(newThreadId);
        })
        .catch((error) => {
          console.error("[HOOK] Failed to start generation:", error);
        })
        .finally(() => {
          setIsStarting(false);
        });
    }
  }, [bookTitle, threadId, isStarting, bookId, startGeneration]);

  // Send a custom message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!threadId) {
        console.warn("[HOOK] No threadId available, cannot send message");
        return;
      }

      try {
        await continueGeneration({
          bookId: bookId as Id<"books">,
          threadId,
          prompt: text,
        });
        setInput("");
      } catch (error) {
        console.error("[HOOK] Failed to send message:", error);
      }
    },
    [threadId, bookId, continueGeneration]
  );

  // Approve proposed content
  const approve = useCallback(() => {
    sendMessage("Yes, I approve. Please proceed.");
  }, [sendMessage]);

  // Reject proposed content
  const reject = useCallback(() => {
    sendMessage("No, please revise that.");
  }, [sendMessage]);

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim()) {
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  // Check if any message is currently streaming
  const isStreaming =
    messages?.some((msg: any) => msg.status === "streaming") || false;

  return {
    // Chat state
    messages: messages || [],
    input,
    setInput,
    handleSubmit,
    isLoading: isStarting || isStreaming || status === "LoadingFirstPage",
    error: null,

    // Control functions
    sendMessage,
    approve,
    reject,
    loadMore, // For pagination if needed

    // Streaming status
    isStreaming,
  };
}
