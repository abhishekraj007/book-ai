"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { EditableChapter } from "./editable-chapter";
import { Markdown } from "@/components/ui/markdown";
import { TitlePage } from "./title-page";
import { TableOfContents } from "./table-of-contents";
import { BookPageCard } from "./book-page-card";

interface PageRendererProps {
  item: {
    id: string;
    type: "page" | "chapter";
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
}: PageRendererProps) {
  if (!item) return null;

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
        // TODO: Call AI to regenerate TOC
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
      return (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">{page.title || page.pageType}</h2>
          <div className="max-w-none prose prose-lg">
            <Markdown>{page.content}</Markdown>
          </div>
        </div>
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
    return (
      <div className="space-y-6">
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
    );
  }

  return null;
}
