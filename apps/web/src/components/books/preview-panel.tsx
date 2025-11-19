"use client";

import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef, useMemo } from "react";
import { EditableChapter } from "./editable-chapter";
import { Markdown } from "@/components/ui/markdown";

interface PreviewPanelProps {
  book: any;
  chapters: any[];
  isLoading: boolean;
  activeView: "view" | "edit";
  onViewChange: (view: "view" | "edit") => void;
  onSaveChapter?: (chapterId: string, content: string) => void;
}

export function PreviewPanel({
  book,
  chapters,
  isLoading,
  activeView,
  onViewChange,
  onSaveChapter,
}: PreviewPanelProps) {
  // Refs for scroll anchors
  const chapterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // All chapters are auto-approved, no draft system
  const allChapters = useMemo(() => {
    return chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
  }, [chapters]);

  // Scroll to chapter function
  const scrollToChapter = (chapterId: string) => {
    chapterRefs.current[chapterId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="flex flex-1 flex-col bg-muted/10 h-[calc(100vh-150px)] overflow-auto">
      {allChapters.length > 0 && (
        <div className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10 overflow-hidden">
          <div className="flex gap-1 px-6 py-2 overflow-x-auto overflow-y-hidden scrollbar-hide">
            {allChapters.map((item: any) => (
              <button
                key={item._id}
                onClick={() => scrollToChapter(`chapter-${item._id}`)}
                className="px-3 py-1.5 text-xs rounded hover:bg-muted transition-colors whitespace-nowrap flex-shrink-0 text-foreground"
              >
                Chapter {item.chapterNumber}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-16 py-12">
          <div className="mb-12 text-center">
            <h1 className="mb-2 text-5xl font-bold">
              {book?.title || "Untitled Book"}
            </h1>
          </div>

          {allChapters.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold">No chapters yet</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Start chatting with AI to generate your book content
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-12">
              {/* All chapters (auto-approved) */}
              {allChapters.map((item: any) => (
                <div
                  key={item._id}
                  ref={(el) => {
                    chapterRefs.current[`chapter-${item._id}`] = el;
                  }}
                  id={`chapter-${item._id}`}
                  className="space-y-6"
                >
                  {/* Approved chapter */}
                  {
                    // Approved chapter
                    <>
                      <h2 className="text-3xl font-bold">
                        Chapter {item.chapterNumber}: {item.title}
                      </h2>

                      {activeView === "edit" && onSaveChapter ? (
                        // Edit mode - show editable textarea
                        <EditableChapter
                          chapter={item}
                          onSave={onSaveChapter}
                        />
                      ) : (
                        // View mode - show formatted content
                        <div className="max-w-none">
                          {item.content ? (
                            <Markdown>{item.content}</Markdown>
                          ) : (
                            <div className="space-y-3">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-3/4" />
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  }
                </div>
              ))}

              {isLoading && (
                <div className="space-y-3 opacity-50">
                  <h2 className="text-3xl font-bold">
                    Chapter {chapters.length + 1}: Generating...
                  </h2>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
