"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@book-ai/backend/convex/_generated/api";
import type { Id } from "@book-ai/backend/convex/_generated/dataModel";
import { useBookGeneration } from "@/hooks/use-book-generation";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { BookHeader } from "@/components/books/book-header";
import { AppSidebar } from "@/components/books/app-sidebar";
import { ChatPanel } from "@/components/books/chat-panel";
import { PreviewPanel } from "@/components/books/preview-panel";
import { Loader2 } from "lucide-react";

export default function BookGenerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = React.use(params);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeView, setActiveView] = useState<"view" | "edit">("view");

  // Fetch book first to get title
  const book = useQuery(api.features.books.index.getBook, {
    bookId: id as Id<"books">,
  });
  const chapters = book?.chapters || [];

  // Redirect if book not found (could be auth issue or doesn't exist)
  useEffect(() => {
    if (book === null) {
      router.push("/dashboard");
    }
  }, [book, router]);

  // Initialize chat with book context - will auto-start with book title
  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
    approve,
    reject,
    sendMessage,
  } = useBookGeneration(id, book?.title);

  // Show loading state while fetching book
  if (book === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading book...</p>
        </div>
      </div>
    );
  }

  // Book not found or unauthorized (will redirect via useEffect)
  if (book === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  const handlePromptSubmit = (message: PromptInputMessage) => {
    if (message.text) {
      sendMessage(message.text);
    }
  };

  return (
    <div className="flex flex-col bg-background">
      <BookHeader
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView}
        onViewChange={setActiveView}
        isGenerating={isLoading}
      />

      <div className="flex flex-1 overflow-hidden">
        <AppSidebar collapsed={sidebarCollapsed} />

        <ChatPanel
          messages={messages}
          input={input}
          setInput={setInput}
          onSubmit={handlePromptSubmit}
          isLoading={isLoading}
          error={error}
          onApprove={approve}
          onReject={reject}
          onSendMessage={sendMessage}
        />

        <PreviewPanel book={book} chapters={chapters} isLoading={isLoading} />
      </div>
    </div>
  );
}
