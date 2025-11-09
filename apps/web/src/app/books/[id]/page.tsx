"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@book-ai/backend/convex/_generated/api";
import type { Id } from "@book-ai/backend/convex/_generated/dataModel";
import { useBookGeneration } from "@/hooks/use-book-generation";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { BookHeader } from "@/components/books/book-header";
import { AppSidebar } from "@/components/books/app-sidebar";
import { ChatPanel } from "@/components/books/chat-panel";
import { PreviewPanel } from "@/components/books/preview-panel";

export default function BookGenerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeView, setActiveView] = useState<"view" | "edit">("view");

  const {
    messages,
    input,
    setInput,
    isLoading,
    error,
    approve,
    reject,
    sendMessage,
  } = useBookGeneration(id);

  const book = useQuery(api.features.books.index.getBook, {
    bookId: id as Id<"books">,
  });
  const chapters = book?.chapters || [];

  const handleSubmit = (message: PromptInputMessage) => {
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
          onSubmit={handleSubmit}
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
