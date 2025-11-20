"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useConvexAuth, useAction } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@book-ai/backend/convex/_generated/api";
import type { Id } from "@book-ai/backend/convex/_generated/dataModel";
import { useBookGeneration } from "@/hooks/use-book-generation";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { BookHeader } from "@/components/books/book-header";
import { AddPagesSheet } from "@/components/books/add-pages-sheet";
import { AppSidebar } from "@/components/books/app-sidebar";
import { ChatPanel } from "@/components/books/chat-panel";
import {
  PreviewPanel,
  type PreviewPanelRef,
} from "@/components/books/preview-panel";
import { Loader2 } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export default function BookGenerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = React.use(params);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeView, setActiveView] = useState<"view" | "edit">("view");
  const [generationMode, setGenerationMode] = useState<"auto" | "manual">(
    "manual"
  );
  const previewPanelRef = useRef<PreviewPanelRef>(null);

  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();

  // Fetch book first to get title
  const book = useQuery(api.features.books.index.getBook, {
    bookId: id as Id<"books">,
  });
  const chapters = book?.chapters || [];

  // Redirect if book not found (could be auth issue or doesn't exist)
  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/auth");
    }
    if (book === null) {
      router.push("/dashboard");
    }
  }, [book, router, isAuthenticated, isAuthLoading]);

  // Initialize generation mode from book data
  useEffect(() => {
    if (book?.generationMode) {
      setGenerationMode(book.generationMode);
    }
  }, [book?.generationMode]);

  // Initialize chat with book context - will auto-start with book title if no existing thread
  // If book has threadId, resume the conversation instead of starting new
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
    loadMore,
    canLoadMore,
    isLoadingMore,
  } = useBookGeneration(id, book?.title, book?.threadId);

  // Mutation for updating chapter content
  const updateChapter = useMutation(
    api.features.books.index.updateChapterContent
  );

  // Mutation for setting generation mode
  const setGenerationModeMutation = useMutation(
    api.features.books.index.setGenerationMode
  );

  const handleSaveChapter = async (chapterId: string, content: string) => {
    await updateChapter({
      chapterId: chapterId as Id<"chapters">,
      content,
    });
  };

  const handleGenerationModeChange = async (mode: "auto" | "manual") => {
    setGenerationMode(mode);
    // Also save to backend
    await setGenerationModeMutation({
      bookId: id as Id<"books">,
      mode,
    });
  };

  const handleGeneratePrologue = () => {
    // Send a message to the AI to generate the prologue
    const bookContext = {
      title: book?.title,
      foundation: book?.foundation,
      structure: book?.structure,
      chapters: chapters.map((ch: any) => ({
        number: ch.chapterNumber,
        title: ch.title,
        content: ch.content,
      })),
    };

    const prologueRequest = `Please generate a prologue for this book. Here's the complete book context:

Title: ${bookContext.title}
Genre: ${bookContext.foundation?.genre}
Synopsis: ${bookContext.foundation?.synopsis}

The book has ${chapters.length} chapters. Generate a compelling prologue that sets the tone and hooks the reader.`;

    sendMessage(prologueRequest);
  };

  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const generateCoverAction = useAction(
    api.features.books.generateCover.generateCoverImage
  );

  const handleGenerateCover = async (customPrompt?: string) => {
    if (!book) return;

    try {
      setIsGeneratingCover(true);
      await generateCoverAction({
        bookId: book._id,
        customPrompt,
      });
    } catch (error) {
      console.error("Failed to generate cover:", error);
      // You might want to show a toast notification here
    } finally {
      setIsGeneratingCover(false);
    }
  };

  // Fetch book pages
  const bookPages = useQuery(
    api.features.books.pages.getBookPages,
    book ? { bookId: book._id } : "skip"
  );

  const missingPages = useQuery(
    api.features.books.pages.getMissingPages,
    book ? { bookId: book._id } : "skip"
  );

  // Book pages mutations
  const createPage = useMutation(api.features.books.pages.createBookPage);
  const updatePage = useMutation(api.features.books.pages.updateBookPage);
  const togglePageVisibility = useMutation(
    api.features.books.pages.togglePageVisibility
  );

  const handleAddPage = async (pageType: string) => {
    if (!book) return;
    try {
      await createPage({ bookId: book._id, pageType: pageType as any });
    } catch (error) {
      console.error("Failed to add page:", error);
    }
  };

  const handleUpdatePage = async (pageId: string, updates: any) => {
    try {
      await updatePage({ pageId: pageId as Id<"bookPages">, ...updates });
    } catch (error) {
      console.error("Failed to update page:", error);
    }
  };

  const handleTogglePageVisibility = async (pageId: string) => {
    try {
      await togglePageVisibility({ pageId: pageId as Id<"bookPages"> });
    } catch (error) {
      console.error("Failed to toggle page visibility:", error);
    }
  };

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
        addPagesButton={
          <AddPagesSheet
            missingPages={missingPages}
            existingPages={bookPages?.map((p) => p.pageType) || []}
            onAddPage={handleAddPage}
            isLoading={isLoading}
          />
        }
      />

      <div className="flex flex-1 overflow-hidden">
        <AppSidebar collapsed={sidebarCollapsed} />

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
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
              loadMore={() => loadMore(20)}
              canLoadMore={canLoadMore}
              isLoadingMore={isLoadingMore}
              generationMode={generationMode}
              onGenerationModeChange={handleGenerationModeChange}
              onScrollToChapter={(chapterId) =>
                previewPanelRef.current?.scrollToChapter(chapterId)
              }
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={70} minSize={50}>
            <PreviewPanel
              ref={previewPanelRef}
              book={book}
              chapters={chapters}
              bookPages={bookPages}
              isLoading={isLoading}
              activeView={activeView}
              onViewChange={setActiveView}
              onSaveChapter={handleSaveChapter}
              onGeneratePrologue={handleGeneratePrologue}
              onGenerateCover={handleGenerateCover}
              isGeneratingCover={isGeneratingCover}
              onUpdatePage={handleUpdatePage}
              onTogglePageVisibility={handleTogglePageVisibility}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
