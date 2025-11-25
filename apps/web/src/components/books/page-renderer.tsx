"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EditableChapter } from "./editable-chapter";
import { Markdown } from "@/components/ui/markdown";
import { TitlePage } from "./title-page";
import { TableOfContents } from "./table-of-contents";
import { BookPageCard } from "./book-page-card";
import { BookCover } from "./book-cover";
import { AIOptionsMenu } from "./ai-options-menu";
import { AIPreviewDialog } from "./ai-preview-dialog";
import { BlockEditor } from "@/components/block-editor";

interface PageRendererProps {
  item: {
    id: string;
    type: "page" | "chapter" | "cover";
    data: any;
    label: string;
    order: number;
  };
  book: any;
  regularChapters: any[];
  allPages?: Array<{
    id: string;
    label: string;
    order: number;
  }>;
  activeView: "view" | "edit";
  onUpdatePage?: (pageId: string, updates: any) => void;
  onTogglePageVisibility?: (pageId: string) => void;
  onSaveChapter?: (chapterId: string, content: string) => void;
  onChapterClick: (chapterId: string) => void;
  onGenerateCover?: (customPrompt?: string) => void;
  isGeneratingCover?: boolean;
  onViewChange?: (view: "view" | "edit") => void;
  onRewriteContent?: (
    bookId: string,
    contentId: string,
    type: "chapter" | "page",
    customInstruction?: string
  ) => Promise<string>;
  onEnhanceContent?: (
    bookId: string,
    contentId: string,
    type: "chapter" | "page",
    customInstruction?: string
  ) => Promise<string>;
  onExpandContent?: (
    bookId: string,
    contentId: string,
    type: "chapter" | "page",
    customInstruction?: string
  ) => Promise<string>;
}

export function PageRenderer({
  item,
  book,
  regularChapters,
  allPages,
  activeView,
  onUpdatePage,
  onTogglePageVisibility,
  onSaveChapter,
  onChapterClick,
  onGenerateCover,
  isGeneratingCover,
  onViewChange,
  onRewriteContent,
  onEnhanceContent,
  onExpandContent,
}: PageRendererProps) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    title: string;
    originalContent: string;
    generatedContent: string | null;
    isGenerating: boolean;
    onAccept: () => void;
  }>({
    open: false,
    title: "",
    originalContent: "",
    generatedContent: null,
    isGenerating: false,
    onAccept: () => {},
  });

  if (!item) return null;

  // Render cover page
  if (item.type === "cover") {
    return (
      <BookCover
        book={item.data}
        onGenerateCover={onGenerateCover || (() => {})}
        isGeneratingCover={isGeneratingCover}
      />
    );
  }

  // Render book page
  if (item.type === "page") {
    const page = item.data;

    // Title Page
    if (page.pageType === "title_page") {
      return (
        <TitlePage
          title={book.title}
          subtitle={book.subtitle}
          authorName={book.authorName}
          publisherName={book.publisherName}
        />
      );
    }

    // Table of Contents
    if (page.pageType === "table_of_contents") {
      const handleEdit = () => {
        // TODO: Open edit dialog for TOC
        console.log("Edit TOC");
      };

      const handleRegenerate = () => {
        // TODO:  Call AI to regenerate TOC
        console.log("Regenerate TOC");
      };

      return (
        <TableOfContents
          chapters={regularChapters}
          allPages={allPages}
          hasPrologue={book.structure?.hasPrologue}
          hasEpilogue={book.structure?.hasEpilogue}
          onChapterClick={onChapterClick}
          onEdit={activeView === "edit" ? handleEdit : undefined}
          onRegenerate={activeView === "edit" ? handleRegenerate : undefined}
          readOnly={activeView === "view"}
        />
      );
    }

    // Other pages (dedication, about author, etc.)
    // In view mode, render as simple text without card styling
    if (activeView === "view" && page.content) {
      const handleEdit = () => {
        // Switch to edit mode and scroll to this page
        onViewChange?.("edit");
        setTimeout(() => {
          const element = document.getElementById(page._id);
          element?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      };

      const handleRewrite = async () => {
        if (!onRewriteContent) return;

        // Open dialog first to collect custom instruction
        setDialogState({
          open: true,
          title: `Rewrite ${page.title || page.pageType}`,
          originalContent: page.content || "",
          generatedContent: null,
          isGenerating: false,
          onAccept: () => {},
        });
      };

      const handleGenerate = async (customInstruction?: string) => {
        setDialogState((prev) => ({
          ...prev,
          isGenerating: true,
        }));

        try {
          let newContent: string;

          // Determine which action to call based on dialog title
          if (dialogState.title.includes("Rewrite") && onRewriteContent) {
            newContent = await onRewriteContent(
              book._id,
              page._id,
              "page",
              customInstruction
            );
          } else if (
            dialogState.title.includes("Enhance") &&
            onEnhanceContent
          ) {
            newContent = await onEnhanceContent(
              book._id,
              page._id,
              "page",
              customInstruction
            );
          } else {
            throw new Error("Unknown action type");
          }

          setDialogState((prev) => ({
            ...prev,
            generatedContent: newContent,
            isGenerating: false,
            onAccept: () => {
              onUpdatePage?.(page._id, { content: newContent });
            },
          }));
        } catch (error) {
          console.error("Failed to generate content:", error);
          setDialogState((prev) => ({
            ...prev,
            open: false,
            isGenerating: false,
          }));
        }
      };

      const handleEnhance = async () => {
        if (!onEnhanceContent) return;

        // Open dialog first to collect custom instruction
        setDialogState({
          open: true,
          title: `Enhance ${page.title || page.pageType}`,
          originalContent: page.content || "",
          generatedContent: null,
          isGenerating: false,
          onAccept: () => {},
        });
      };

      // Note: handleGenerate defined above handles both rewrite and enhance
      // It will use whichever dialog is currently open

      return (
        <>
          <div className="space-y-6 relative">
            {/* AI Options Menu */}
            <AIOptionsMenu
              onEdit={handleEdit}
              onRewrite={handleRewrite}
              onEnhance={handleEnhance}
              className="absolute top-0 right-0"
            />

            <h2 className="text-3xl font-bold">
              {page.title || page.pageType}
            </h2>
            <div className="max-w-none prose prose-lg">
              {/* Render based on editor mode */}
              {page.editorMode === "blocks" ? (
                <BlockEditor pageId={page._id} editable={false} />
              ) : (
                <Markdown>{page.content}</Markdown>
              )}
            </div>
          </div>

          {/* AI Preview Dialog */}
          <AIPreviewDialog
            open={dialogState.open}
            onOpenChange={(open) =>
              setDialogState((prev) => ({ ...prev, open }))
            }
            title={dialogState.title}
            originalContent={dialogState.originalContent}
            generatedContent={dialogState.generatedContent}
            isGenerating={dialogState.isGenerating}
            onAccept={dialogState.onAccept}
            onReject={() =>
              setDialogState((prev) => ({ ...prev, open: false }))
            }
            onGenerate={handleGenerate}
          />
        </>
      );
    }

    // In edit mode, use BookPageCard with all controls
    if (onUpdatePage && onTogglePageVisibility) {
      return (
        <BookPageCard
          page={page}
          onUpdate={onUpdatePage}
          onToggleVisibility={onTogglePageVisibility}
          readOnly={false}
        />
      );
    }
  }

  // Render chapter
  if (item.type === "chapter") {
    const chapter = item.data;

    const handleEdit = () => {
      // Switch to edit mode and scroll to this chapter
      onViewChange?.("edit");
      setTimeout(() => {
        onChapterClick(chapter._id);
      }, 100);
    };

    const handleRewrite = async () => {
      if (!onRewriteContent) return;

      // Open dialog first to collect custom instruction
      setDialogState({
        open: true,
        title: "Rewrite Chapter",
        originalContent: chapter.content || "",
        generatedContent: null,
        isGenerating: false,
        onAccept: () => {},
      });
    };

    const handleEnhance = async () => {
      if (!onEnhanceContent) return;

      // Open dialog first to collect custom instruction
      setDialogState({
        open: true,
        title: "Enhance Chapter",
        originalContent: chapter.content || "",
        generatedContent: null,
        isGenerating: false,
        onAccept: () => {},
      });
    };

    const handleExpand = async () => {
      if (!onExpandContent) return;

      // Open dialog first to collect custom instruction
      setDialogState({
        open: true,
        title: "Expand Chapter",
        originalContent: chapter.content || "",
        generatedContent: null,
        isGenerating: false,
        onAccept: () => {},
      });
    };

    // Unified generate handler for chapters (rewrite/enhance/expand)
    const handleGenerateForChapter = async (customInstruction?: string) => {
      setDialogState((prev) => ({
        ...prev,
        isGenerating: true,
      }));

      try {
        let newContent: string;

        // Determine which action based on dialog title
        if (dialogState.title.includes("Rewrite") && onRewriteContent) {
          newContent = await onRewriteContent(
            book._id,
            chapter._id,
            "chapter",
            customInstruction
          );
        } else if (dialogState.title.includes("Enhance") && onEnhanceContent) {
          newContent = await onEnhanceContent(
            book._id,
            chapter._id,
            "chapter",
            customInstruction
          );
        } else if (dialogState.title.includes("Expand") && onExpandContent) {
          newContent = await onExpandContent(
            book._id,
            chapter._id,
            "chapter",
            customInstruction
          );
        } else {
          throw new Error("Unknown action type");
        }

        setDialogState((prev) => ({
          ...prev,
          generatedContent: newContent,
          isGenerating: false,
          onAccept: () => {
            onSaveChapter?.(chapter._id, newContent);
          },
        }));
      } catch (error) {
        console.error("Failed to generate content:", error);
        setDialogState((prev) => ({
          ...prev,
          open: false,
          isGenerating: false,
        }));
      }
    };

    return (
      <>
        <div className="space-y-6 relative">
          {/* AI Options Menu - Only in View Mode */}
          {activeView === "view" && (
            <AIOptionsMenu
              onEdit={handleEdit}
              onRewrite={handleRewrite}
              onEnhance={handleEnhance}
              onExpand={handleExpand}
              className="absolute top-0 right-0"
            />
          )}

          <h2 className="text-3xl font-bold">
            {chapter.chapterNumber === 0
              ? "Prologue"
              : `Chapter ${chapter.chapterNumber}: ${chapter.title}`}
          </h2>

          {activeView === "edit" && onSaveChapter ? (
            <EditableChapter chapter={chapter} onSave={onSaveChapter} />
          ) : (
            <div className="max-w-none">
              {chapter.content ? (
                <Markdown>{chapter.content}</Markdown>
              ) : (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Preview Dialog */}
        <AIPreviewDialog
          open={dialogState.open}
          onOpenChange={(open) => setDialogState((prev) => ({ ...prev, open }))}
          title={dialogState.title}
          originalContent={dialogState.originalContent}
          generatedContent={dialogState.generatedContent}
          isGenerating={dialogState.isGenerating}
          onAccept={dialogState.onAccept}
          onReject={() => setDialogState((prev) => ({ ...prev, open: false }))}
          onGenerate={handleGenerateForChapter}
        />
      </>
    );
  }

  return null;
}
