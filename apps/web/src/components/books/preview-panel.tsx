"use client";

import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import { EditableChapter } from "./editable-chapter";
import { Markdown } from "@/components/ui/markdown";

interface PreviewPanelProps {
  book: any;
  chapters: any[];
  isLoading: boolean;
  activeView: "view" | "edit";
  onViewChange: (view: "view" | "edit") => void;
  onSaveChapter?: (chapterId: string, content: string) => void;
  onGeneratePrologue?: () => void;
}

export interface PreviewPanelRef {
  scrollToChapter: (chapterId: string) => void;
}

export const PreviewPanel = forwardRef<PreviewPanelRef, PreviewPanelProps>(
  (
    {
      book,
      chapters,
      isLoading,
      activeView,
      onViewChange,
      onSaveChapter,
      onGeneratePrologue,
    },
    ref
  ) => {
    // Refs for scroll anchors
    const chapterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    // Separate prologue from regular chapters
    const { prologueChapter, regularChapters } = useMemo(() => {
      const prologue = chapters.find((ch: any) => ch.chapterNumber === 0);
      const regular = chapters
        .filter((ch: any) => ch.chapterNumber > 0)
        .sort((a: any, b: any) => a.chapterNumber - b.chapterNumber);
      return { prologueChapter: prologue, regularChapters: regular };
    }, [chapters]);

    const hasPrologueInStructure = book?.structure?.hasPrologue;
    const showPrologueSection = hasPrologueInStructure || prologueChapter;

    // Scroll to chapter function
    const scrollToChapter = (chapterId: string) => {
      chapterRefs.current[`chapter-${chapterId}`]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };

    // Expose scrollToChapter via ref
    useImperativeHandle(ref, () => ({
      scrollToChapter,
    }));

    return (
      <div className="flex flex-1 flex-col bg-muted/10 h-[calc(100vh-150px)] overflow-auto">
        {(showPrologueSection || regularChapters.length > 0) && (
          <div className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10 overflow-hidden">
            <div className="flex gap-1 px-6 py-2 overflow-x-auto overflow-y-hidden scrollbar-hide">
              {showPrologueSection && (
                <button
                  onClick={() =>
                    prologueChapter && scrollToChapter(prologueChapter._id)
                  }
                  className="px-3 py-1.5 text-xs rounded hover:bg-muted transition-colors whitespace-nowrap flex-shrink-0 text-foreground"
                >
                  Prologue
                </button>
              )}
              {regularChapters.map((item: any) => (
                <button
                  key={item._id}
                  onClick={() => scrollToChapter(item._id)}
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

            {!showPrologueSection && regularChapters.length === 0 ? (
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
                {/* Prologue Section */}
                {showPrologueSection && (
                  <div
                    ref={(el) => {
                      if (prologueChapter) {
                        chapterRefs.current[`chapter-${prologueChapter._id}`] =
                          el;
                      }
                    }}
                    id={
                      prologueChapter
                        ? `chapter-${prologueChapter._id}`
                        : "prologue"
                    }
                    className="space-y-6"
                  >
                    <h2 className="text-3xl font-bold">Prologue</h2>

                    {prologueChapter ? (
                      activeView === "edit" && onSaveChapter ? (
                        <EditableChapter
                          chapter={prologueChapter}
                          onSave={onSaveChapter}
                        />
                      ) : (
                        <div className="max-w-none">
                          <Markdown>{prologueChapter.content}</Markdown>
                        </div>
                      )
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-8">
                          <p className="text-center text-sm text-muted-foreground mb-4">
                            No prologue generated yet
                          </p>
                          <Button
                            onClick={onGeneratePrologue}
                            disabled={!onGeneratePrologue}
                            size="sm"
                            variant="outline"
                          >
                            Generate Prologue
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Regular chapters */}
                {regularChapters.map((item: any) => (
                  <div
                    key={item._id}
                    ref={(el) => {
                      chapterRefs.current[`chapter-${item._id}`] = el;
                    }}
                    id={`chapter-${item._id}`}
                    className="space-y-6"
                  >
                    <>
                      <h2 className="text-3xl font-bold">
                        Chapter {item.chapterNumber}: {item.title}
                      </h2>

                      {activeView === "edit" && onSaveChapter ? (
                        <EditableChapter
                          chapter={item}
                          onSave={onSaveChapter}
                        />
                      ) : (
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
