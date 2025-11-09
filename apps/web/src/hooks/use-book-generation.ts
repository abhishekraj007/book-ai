"use client";

import { useState, useCallback } from "react";
import type {
  BookUIMessage,
  ToolApprovalRequest,
  BookGenerationState,
} from "@/types/messages";

/**
 * useBookGeneration Hook
 *
 * Manages book generation state and provides methods for controlling the generation process.
 * This is a simplified version that will be enhanced with AI SDK integration once the backend is ready.
 *
 * @param bookId - The ID of the book being generated
 * @param initialMessages - Optional messages to resume from
 */
export function useBookGeneration(
  bookId: string,
  initialMessages?: BookUIMessage[]
) {
  // State for approval workflow
  const [pendingApproval, setPendingApproval] =
    useState<ToolApprovalRequest | null>(null);

  // State for transient notifications (not in message history)
  const [notifications, setNotifications] = useState<
    Array<{
      message: string;
      level: "info" | "warning" | "error" | "success";
      id: string;
    }>
  >([]);

  // State for generation progress
  const [generationState, setGenerationState] = useState<BookGenerationState>({
    isGenerating: false,
    currentStep: "idle",
    progress: 0,
  });

  // Messages state
  const [messages] = useState<BookUIMessage[]>(initialMessages || []);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);

  // ============================================================================
  // Approval Functions
  // ============================================================================

  const approve = useCallback(
    async (toolCallId: string) => {
      if (!pendingApproval) return;
      console.log("Approved tool call:", toolCallId);
      setPendingApproval(null);
    },
    [pendingApproval]
  );

  const reject = useCallback(
    async (toolCallId: string, reason?: string) => {
      if (!pendingApproval) return;
      console.log("Rejected tool call:", toolCallId, reason);
      setPendingApproval(null);
    },
    [pendingApproval]
  );

  // ============================================================================
  // Notification Management
  // ============================================================================

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // ============================================================================
  // Reload function
  // ============================================================================

  const reload = useCallback(async () => {
    console.log("Reload requested for book:", bookId);
  }, [bookId]);

  // ============================================================================
  // Stop function
  // ============================================================================

  const stop = useCallback(() => {
    console.log("Stop requested for book:", bookId);
  }, [bookId]);

  return {
    // Messages and state
    messages,
    isLoading,
    error,
    generationState,

    // Approval workflow
    pendingApproval,
    approve,
    reject,

    // Notifications (transient data parts)
    notifications,
    dismissNotification,

    // Control functions
    reload, // Retry from last message
    stop, // Cancel generation
  };
}
