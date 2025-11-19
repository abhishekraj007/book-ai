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
 * @param existingThreadId - Optional existing thread ID to resume conversation
 */
export function useBookGeneration(
  bookId: string,
  bookTitle?: string,
  existingThreadId?: string | null
) {
  const [threadId, setThreadId] = useState<string | null>(
    existingThreadId || null
  );
  const [input, setInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

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
      initialNumItems: 20, // Start with 20 messages for performance
      stream: true, // Enable real-time streaming
    }
  );

  // Debug: log messages whenever they change
  // useEffect(() => {
  //   if (messages && messages.length > 0) {
  //     console.log("[HOOK] Messages updated:", messages.length, "messages");
  //     const lastMsg = messages[messages.length - 1];
  //     console.log("[HOOK] Last message full object:", JSON.stringify(lastMsg, null, 2));
  //     console.log("[HOOK] Last message keys:", Object.keys(lastMsg));
  //   }
  // }, [messages]);

  // Sync existingThreadId with local threadId state
  useEffect(() => {
    if (existingThreadId && !threadId) {
      console.log("[HOOK] Syncing existingThreadId:", existingThreadId);
      setThreadId(existingThreadId);
    }
  }, [existingThreadId, threadId]);

  // Detect stuck loading state
  useEffect(() => {
    if (status === "LoadingFirstPage" && threadId) {
      // Set a timeout to detect if we're stuck
      const timeout = setTimeout(() => {
        console.error(
          "[HOOK] Loading timeout - stuck at LoadingFirstPage for 10 seconds"
        );
        setLoadingError(
          "Failed to load conversation. The thread may not exist or there was an error."
        );
      }, 10000); // 10 seconds

      return () => clearTimeout(timeout);
    } else {
      // Clear error when status changes
      setLoadingError(null);
    }
  }, [status, threadId]);

  // Auto-start generation on mount if book title provided AND no existing thread
  useEffect(() => {
    // Only auto-start if:
    // 1. Book title is provided (new book)
    // 2. No existing thread ID (not resuming)
    // 3. No thread currently set (not already started)
    // 4. Not already starting
    if (bookTitle && !existingThreadId && !threadId && !isStarting) {
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
  }, [
    bookTitle,
    existingThreadId,
    threadId,
    isStarting,
    bookId,
    startGeneration,
  ]);

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
    isLoading:
      (isStarting || isStreaming || status === "LoadingFirstPage") &&
      !loadingError,
    error: loadingError ? new Error(loadingError) : null,

    // Control functions
    sendMessage,
    approve,
    reject,

    // Pagination
    loadMore, // Load older messages
    canLoadMore: status !== "Exhausted", // Can load more messages
    isLoadingMore: status === "LoadingMore", // Loading older messages

    // Streaming status
    isStreaming,
  };
}
