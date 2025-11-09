"use client";

import { BookOpen, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface PreviewPanelProps {
  book: any;
  chapters: any[];
  isLoading: boolean;
}

export function PreviewPanel({ book, chapters, isLoading }: PreviewPanelProps) {
  return (
    <div className="flex flex-1 flex-col bg-muted/10">
      {chapters.length > 0 && (
        <div className="flex items-center gap-2 border-b px-6 py-2">
          <Tabs defaultValue="0" className="w-full">
            <TabsList className="h-auto bg-transparent">
              {chapters.map((chapter: any, index: number) => (
                <TabsTrigger
                  key={chapter._id}
                  value={index.toString()}
                  className="text-xs"
                >
                  Chapter {chapter.chapterNumber}
                </TabsTrigger>
              ))}
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </TabsList>
          </Tabs>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-white dark:bg-background">
        <div className="mx-auto max-w-4xl px-16 py-12">
          <div className="mb-12 text-center">
            <h1 className="mb-2 text-5xl font-bold">
              {book?.title || "Untitled Book"}
            </h1>
          </div>

          {chapters.length === 0 ? (
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
              {chapters.map((chapter: any) => (
                <div key={chapter._id} className="space-y-6">
                  <h2 className="text-3xl font-bold">
                    Chapter {chapter.chapterNumber}: {chapter.title}
                  </h2>

                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    {chapter.content ? (
                      <div
                        className="whitespace-pre-wrap leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: chapter.content,
                        }}
                      />
                    ) : (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    )}
                  </div>
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

