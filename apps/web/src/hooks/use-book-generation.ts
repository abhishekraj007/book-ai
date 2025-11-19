"use client";

import { useAction } from "convex/react";
import { useUIMessages } from "@convex-dev/agent/react";
import { api } from "@book-ai/backend/convex/_generated/api";
import { useCallback, useEffect, useState, useRef } from "react";
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
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Use ref to track if we've already started generation
  const hasStartedRef = useRef(false);

  const startGeneration = useAction(api.features.books.actions.startGeneration);
  const continueGeneration = useAction(
    api.features.books.actions.continueGeneration
  );

  // Real-time subscription to thread messages with streaming deltas
  const {
    results: messages,
    status,
    loadMore,
  } = useUIMessages(
    api.features.books.queries.getThreadMessages,
    threadId ? { threadId } : "skip",
    {
      initialNumItems: 20,
      stream: true,
    }
  );

  // Sync existingThreadId with local threadId state
  useEffect(() => {
    if (existingThreadId && !threadId) {
      setThreadId(existingThreadId);
    }
  }, [existingThreadId, threadId]);

  // Detect stuck loading state
  useEffect(() => {
    if (status === "LoadingFirstPage" && threadId) {
      const timeout = setTimeout(() => {
        console.error(
          "[HOOK] Loading timeout - stuck at LoadingFirstPage for 10 seconds"
        );
        setLoadingError(
          "Failed to load conversation. The thread may not exist or there was an error."
        );
      }, 10000);

      return () => clearTimeout(timeout);
    } else {
      setLoadingError(null);
    }
  }, [status, threadId]);

  // Auto-start generation on mount if needed
  useEffect(() => {
    // Only auto-start if:
    // 1. Book title is provided (new book)
    // 2. No existing thread ID (not resuming)
    // 3. Haven't already started (prevent double-start)
    if (bookTitle && !existingThreadId && !hasStartedRef.current) {
      hasStartedRef.current = true;

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
          hasStartedRef.current = false; // Allow retry
        });
    }
  }, [bookTitle, existingThreadId, bookId, startGeneration]);

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

  // Determine if we're in a loading state
  const isLoading =
    (hasStartedRef.current && !threadId) || // Starting generation
    isStreaming || // Message streaming
    (status === "LoadingFirstPage" && !loadingError); // Loading messages

  return {
    // Chat state
    messages: messages || [],
    input,
    setInput,
    handleSubmit,
    isLoading,
    error: loadingError ? new Error(loadingError) : null,

    // Control functions
    sendMessage,
    approve,
    reject,

    // Pagination
    loadMore,
    canLoadMore: status !== "Exhausted",
    isLoadingMore: status === "LoadingMore",

    // Streaming status
    isStreaming,
  };
}
