"use client";

import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import { PageRenderer } from "./page-renderer";
import { CarouselNavigation } from "./carousel-navigation";
import { cn } from "@/lib/utils";

interface PreviewPanelProps {
  book: any;
  chapters: any[];
  bookPages?: any[];
  isLoading: boolean;
  activeView: "view" | "edit";
  onViewChange: (view: "view" | "edit") => void;
  onSaveChapter?: (chapterId: string, content: string) => void;
  onGeneratePrologue?: () => void;
  onGenerateCover?: (customPrompt?: string) => void;
  isGeneratingCover?: boolean;
  onUpdatePage?: (pageId: string, updates: any) => void;
  onTogglePageVisibility?: (pageId: string) => void;
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

export interface PreviewPanelRef {
  scrollToChapter: (chapterId: string) => void;
}

export const PreviewPanel = forwardRef<PreviewPanelRef, PreviewPanelProps>(
  (
    {
      book,
      chapters,
      bookPages = [],
      isLoading,
      activeView,
      onViewChange,
      onSaveChapter,
      onGeneratePrologue,
      onGenerateCover,
      isGeneratingCover,
      onUpdatePage,
      onTogglePageVisibility,
      onRewriteContent,
      onEnhanceContent,
      onExpandContent,
    },
    ref
  ) => {
    // Refs for scroll anchors
    const chapterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    // Build complete ordered page structure
    const orderedContent = useMemo(() => {
      const content: Array<{
        id: string;
        type: "page" | "chapter" | "cover";
        data: any;
        label: string;
        order: number;
      }> = [];

      // Add cover page as first item
      content.push({
        id: "cover",
        type: "cover",
        data: book,
        label: "Cover",
        order: 0,
      });

      // Add book pages (sorted by order)
      const visiblePages = bookPages
        .filter((p) => p.isVisible)
        .sort((a, b) => a.order - b.order);

      visiblePages.forEach((page) => {
        // Skip chapter-type pages as they're handled separately
        if (["prologue", "chapter", "epilogue"].includes(page.pageType)) return;

        let label = "";
        if (page.pageType === "title_page") label = "Title";
        else if (page.pageType === "table_of_contents") label = "Contents";
        else if (page.pageType === "dedication") label = "Dedication";
        else if (page.pageType === "foreword") label = "Foreword";
        else if (page.pageType === "preface") label = "Preface";
        else if (page.pageType === "acknowledgments") label = "Acknowledgments";
        else if (page.pageType === "about_author") label = "About Author";
        else if (page.pageType === "bibliography") label = "Bibliography";
        else if (page.pageType === "appendix") label = "Appendix";
        else if (page.pageType === "copyright") label = "Copyright";

        content.push({
          id: page._id,
          type: "page",
          data: page,
          label,
          order: page.order,
        });
      });

      // Add chapters at appropriate order (after TOC, around order 100+)
      const prologue = chapters.find((ch: any) => ch.chapterNumber === 0);
      const regularChapters = chapters
        .filter((ch: any) => ch.chapterNumber > 0)
        .sort((a: any, b: any) => a.chapterNumber - b.chapterNumber);

      // Prologue goes after front matter (order ~100)
      if (prologue) {
        content.push({
          id: prologue._id,
          type: "chapter",
          data: prologue,
          label: "Prologue",
          order: 100,
        });
      }

      // Regular chapters (order 101+)
      regularChapters.forEach((ch, idx) => {
        content.push({
          id: ch._id,
          type: "chapter",
          data: ch,
          label: `Chapter ${ch.chapterNumber}`,
          order: 101 + idx,
        });
      });

      // Sort by order to get final sequence
      return content.sort((a, b) => a.order - b.order);
    }, [bookPages, chapters]);

    const hasPrologueInStructure = book?.structure?.hasPrologue;
    const prologueChapter = chapters.find((ch: any) => ch.chapterNumber === 0);
    const regularChapters = chapters
      .filter((ch: any) => ch.chapterNumber > 0)
      .sort((a: any, b: any) => a.chapterNumber - b.chapterNumber);
    const showPrologueSection = hasPrologueInStructure || prologueChapter;

    // Navigation functions
    const scrollToChapter = (chapterId: string) => {
      if (activeView === "view") {
        // In view mode, find the index and set it
        const index = orderedContent.findIndex((item) => item.id === chapterId);
        if (index !== -1) {
          setCurrentPageIndex(index);
        }
      } else {
        // In edit mode, scroll to it
        chapterRefs.current[`chapter-${chapterId}`]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    };

    const goToPrevious = () => {
      if (currentPageIndex > 0) {
        setCurrentPageIndex(currentPageIndex - 1);
      }
    };

    const goToNext = () => {
      if (currentPageIndex < orderedContent.length - 1) {
        setCurrentPageIndex(currentPageIndex + 1);
      }
    };

    const currentContent = orderedContent[currentPageIndex];

    // Expose scrollToChapter via ref
    useImperativeHandle(ref, () => ({
      scrollToChapter,
    }));

    // Keyboard navigation (arrow keys) in view mode
    useEffect(() => {
      if (activeView !== "view") return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") {
          goToPrevious();
        } else if (e.key === "ArrowRight") {
          goToNext();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeView, currentPageIndex, orderedContent.length]);

    return (
      <div className="flex flex-1 flex-col bg-muted/10 h-[calc(100vh-150px)] overflow-auto relative">
        {/* Navigation tabs for all pages */}
        {orderedContent.length > 0 && (
          <div className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10 overflow-hidden">
            <div className="flex flex-wrap scrollbar-hide">
              {orderedContent.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (activeView === "view") {
                      setCurrentPageIndex(index);
                    } else {
                      scrollToChapter(item.id);
                    }
                  }}
                  className={cn(
                    "px-3 py-2 text-xs rounded hover:bg-muted transition-colors whitespace-nowrap flex-shrink-0",
                    activeView === "view" && currentPageIndex === index
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Carousel Navigation - Only in View Mode, positioned relative to entire panel */}
        {activeView === "view" && orderedContent.length > 0 && (
          <CarouselNavigation
            currentIndex={currentPageIndex}
            totalPages={orderedContent.length}
            onPrevious={goToPrevious}
            onNext={goToNext}
          />
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-16 py-12">
            {orderedContent.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 font-semibold">No chapters yet</h3>
                  <p className="text-center text-sm text-muted-foreground">
                    Start chatting with AI to generate your book content
                  </p>
                </CardContent>
              </Card>
            ) : activeView === "view" ? (
              /* VIEW MODE: Single page with carousel navigation */
              <div className="min-h-[600px]">
                {/* Current page content */}
                {currentContent && (
                  <div className="space-y-8">
                    <PageRenderer
                      item={currentContent}
                      book={book}
                      regularChapters={regularChapters}
                      allPages={orderedContent}
                      activeView={activeView}
                      onUpdatePage={onUpdatePage}
                      onTogglePageVisibility={onTogglePageVisibility}
                      onSaveChapter={onSaveChapter}
                      onChapterClick={scrollToChapter}
                      onGenerateCover={onGenerateCover}
                      isGeneratingCover={isGeneratingCover}
                      onViewChange={onViewChange}
                      onRewriteContent={onRewriteContent}
                      onEnhanceContent={onEnhanceContent}
                      onExpandContent={onExpandContent}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* EDIT MODE: Scrollable all pages */
              <div className="space-y-12">
                {/* Render all pages in order (including cover) */}
                {orderedContent.map((item) => (
                  <div
                    key={item.id}
                    ref={(el) => {
                      chapterRefs.current[item.id] = el;
                    }}
                    id={item.id}
                  >
                    <PageRenderer
                      item={item}
                      book={book}
                      regularChapters={regularChapters}
                      allPages={orderedContent}
                      activeView={activeView}
                      onUpdatePage={onUpdatePage}
                      onTogglePageVisibility={onTogglePageVisibility}
                      onSaveChapter={onSaveChapter}
                      onChapterClick={scrollToChapter}
                      onGenerateCover={onGenerateCover}
                      isGeneratingCover={isGeneratingCover}
                      onViewChange={onViewChange}
                      onRewriteContent={onRewriteContent}
                      onEnhanceContent={onEnhanceContent}
                      onExpandContent={onExpandContent}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

PreviewPanel.displayName = "PreviewPanel";
