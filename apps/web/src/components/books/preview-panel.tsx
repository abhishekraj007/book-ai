"use client";

import { BookOpen, Plus, Check, X, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "@book-ai/backend/convex/_generated/api";
import type { Id } from "@book-ai/backend/convex/_generated/dataModel";
import { useState, useRef, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  // Fetch draft chapters
  const draftChapters = useQuery(
    api.features.books.index.getDraftChapters,
    book ? { bookId: book._id } : "skip"
  );

  // Mutations for draft approval/rejection
  const approveDraft = useMutation(api.features.books.index.approveDraft);
  const rejectDraft = useMutation(api.features.books.index.rejectDraft);

  const [processingDraftId, setProcessingDraftId] = useState<string | null>(
    null
  );

  // Refs for scroll anchors
  const chapterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Merge and sort chapters with drafts in natural order
  const allChapters = useMemo(() => {
    const approved = chapters.map((ch) => ({ ...ch, isDraft: false }));
    const drafts = (draftChapters || []).map((d) => ({ ...d, isDraft: true }));

    return [...approved, ...drafts].sort(
      (a, b) => a.chapterNumber - b.chapterNumber
    );
  }, [chapters, draftChapters]);

  // Scroll to chapter function
  const scrollToChapter = (chapterId: string) => {
    chapterRefs.current[chapterId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleApproveDraft = async (draftId: Id<"draftChapters">) => {
    setProcessingDraftId(draftId);
    try {
      await approveDraft({ draftId });
    } catch (error) {
      console.error("Failed to approve draft:", error);
    } finally {
      setProcessingDraftId(null);
    }
  };

  const handleRejectDraft = async (draftId: Id<"draftChapters">) => {
    setProcessingDraftId(draftId);
    try {
      await rejectDraft({ draftId });
    } catch (error) {
      console.error("Failed to reject draft:", error);
    } finally {
      setProcessingDraftId(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-muted/10 h-[calc(100vh-150px)] overflow-auto">
      {allChapters.length > 0 && (
        <div className="flex items-center gap-2 border-b px-6 py-2 overflow-x-auto bg-background/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex gap-1">
            {allChapters.map((item: any) => (
              <button
                key={item._id}
                onClick={() =>
                  scrollToChapter(
                    item.isDraft ? `draft-${item._id}` : `chapter-${item._id}`
                  )
                }
                className={`px-3 py-1.5 text-xs rounded hover:bg-muted transition-colors whitespace-nowrap ${
                  item.isDraft
                    ? "border-l-2 border-amber-500 text-amber-700 dark:text-amber-400"
                    : "text-foreground"
                }`}
              >
                {item.isDraft ? "Draft " : ""}Chapter {item.chapterNumber}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-white dark:bg-background">
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
              {/* All chapters (approved and drafts in natural order) */}
              {allChapters.map((item: any) => (
                <div
                  key={item._id}
                  ref={(el) => {
                    chapterRefs.current[
                      item.isDraft ? `draft-${item._id}` : `chapter-${item._id}`
                    ] = el;
                  }}
                  id={
                    item.isDraft ? `draft-${item._id}` : `chapter-${item._id}`
                  }
                  className="space-y-6"
                >
                  {item.isDraft ? (
                    // Draft chapter with approve/reject UI
                    <>
                      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-900 dark:text-amber-100">
                          This chapter is a draft and needs your review
                        </AlertDescription>
                      </Alert>

                      <div className="rounded-lg border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/10 p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <h2 className="text-3xl font-bold">
                            Chapter {item.chapterNumber}: {item.title}
                          </h2>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveDraft(item._id)}
                              disabled={processingDraftId === item._id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectDraft(item._id)}
                              disabled={processingDraftId === item._id}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </div>

                        <Markdown className="max-w-none">
                          {item.content}
                        </Markdown>

                        <div className="mt-4 text-xs text-muted-foreground">
                          {item.wordCount} words
                        </div>
                      </div>
                    </>
                  ) : (
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
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="space-y-3 opacity-50">
                  <h2 className="text-3xl font-bold">
                    Chapter {chapters.length + (draftChapters?.length || 0) + 1}
                    : Generating...
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
