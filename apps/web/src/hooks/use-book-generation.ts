"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * useBookGeneration Hook
 *
 * Chat-based book generation hook for streaming responses from Convex.
 * Provides a conversational interface where the AI proposes content
 * and waits for user approval at each step.
 *
 * @param bookId - The ID of the book being generated
 */
export function useBookGeneration(bookId: string) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Send a message to the AI
  const send = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        role: "user",
        content,
        parts: [{ type: "text", text: content }],
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setError(null);

      try {
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
        if (!convexUrl) {
          throw new Error("NEXT_PUBLIC_CONVEX_SITE_URL is not configured");
        }

        const response = await fetch(`${convexUrl}/book/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookId,
            messages: [...messages, userMessage],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
          parts: [],
        };

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;

            // Handle different streaming formats
            if (line.startsWith("0:")) {
              // Text content
              const content = line.slice(3, -1); // Remove prefix and trailing quote
              assistantMessage.content += content;
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg?.role === "assistant") {
                  lastMsg.content = assistantMessage.content;
                } else {
                  updated.push({ ...assistantMessage });
                }
                return updated;
              });
            }
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Book generation error:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setIsLoading(false);
      }
    },
    [bookId, messages, isLoading]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      send(input);
    },
    [send, input]
  );

  // Approve proposed content
  const approve = useCallback(() => {
    send("Yes, I approve. Please proceed.");
  }, [send]);

  // Reject proposed content
  const reject = useCallback(
    (reason?: string) => {
      const message = reason
        ? `No, please revise: ${reason}`
        : "No, please try again with a different approach.";
      send(message);
    },
    [send]
  );

  // Request modifications
  const modify = useCallback(
    (instructions: string) => {
      send(`Please modify: ${instructions}`);
    },
    [send]
  );

  // Auto-start with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hi! I'm here to help you create your book. What kind of book would you like to write today?",
          parts: [],
        },
      ]);
    }
  }, [messages.length]);

  return {
    // Chat state
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,

    // Control functions
    sendMessage: send,
    approve,
    reject,
    modify,
    reload: () => setMessages([]),
    stop: () => setIsLoading(false),
  };
}
