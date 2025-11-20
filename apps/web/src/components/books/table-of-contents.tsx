"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableOfContentsProps {
  chapters: Array<{
    _id: string;
    chapterNumber: number;
    title: string;
  }>;
  allPages?: Array<{
    id: string;
    label: string;
    order: number;
  }>;
  hasPrologue?: boolean;
  hasEpilogue?: boolean;
  onChapterClick?: (chapterId: string) => void;
  onEdit?: () => void;
  onRegenerate?: () => void;
  readOnly?: boolean;
  className?: string;
}

export function TableOfContents({
  chapters,
  allPages = [],
  hasPrologue,
  hasEpilogue,
  onChapterClick,
  onEdit,
  onRegenerate,
  readOnly = false,
  className,
}: TableOfContentsProps) {
  const prologue = chapters.find((ch) => ch.chapterNumber === 0);
  const regularChapters = chapters
    .filter((ch) => ch.chapterNumber > 0)
    .sort((a, b) => a.chapterNumber - b.chapterNumber);

  return (
    <Card className={cn("border-none shadow-none bg-transparent", className)}>
      <CardContent className="flex flex-col min-h-[600px] p-12 relative">
        {/* Edit/Regenerate Controls */}
        {!readOnly && (onEdit || onRegenerate) && (
          <div className="absolute top-4 right-4 flex gap-2">
            {onEdit && (
              <Button
                onClick={onEdit}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
            {onRegenerate && (
              <Button
                onClick={onRegenerate}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </Button>
            )}
          </div>
        )}

        <div className="space-y-8 max-w-2xl mx-auto w-full">
          {/* Copyright Notice */}
          <p className="text-xs text-muted-foreground text-center uppercase tracking-wide">
            Copyrighted Material
          </p>

          {/* Contents Heading */}
          <h2 className="text-2xl font-normal text-center tracking-wide">
            contents
          </h2>

          {/* Contents List */}
          <div className="space-y-4 mt-12">
            {/* Render all pages in order */}
            {allPages.length > 0 ? (
              allPages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => onChapterClick?.(page.id)}
                  className="flex items-center justify-between w-full group hover:opacity-70 transition-opacity"
                >
                  <span className="text-base lowercase tracking-wide">
                    {page.label}
                  </span>
                  <div className="flex-1 mx-4 border-b border-dotted border-muted-foreground/30" />
                  <span className="text-base tabular-nums">{index + 1}</span>
                </button>
              ))
            ) : (
              <>
                {/* Fallback: Prologue */}
                {hasPrologue && prologue && (
                  <button
                    onClick={() => onChapterClick?.(prologue._id)}
                    className="flex items-center justify-between w-full group hover:opacity-70 transition-opacity"
                  >
                    <span className="text-base lowercase tracking-wide">
                      prologue
                    </span>
                    <div className="flex-1 mx-4 border-b border-dotted border-muted-foreground/30" />
                    <span className="text-base tabular-nums">1</span>
                  </button>
                )}

                {/* Fallback: Regular Chapters with numbers */}
                {regularChapters.map((chapter, index) => {
                  const pageNumber = (hasPrologue ? 2 : 1) + index;

                  return (
                    <button
                      key={chapter._id}
                      onClick={() => onChapterClick?.(chapter._id)}
                      className="flex items-center justify-between w-full group hover:opacity-70 transition-opacity"
                    >
                      <span className="text-base lowercase tracking-wide">
                        chapter {chapter.chapterNumber}: {chapter.title}
                      </span>
                      <div className="flex-1 mx-4 border-b border-dotted border-muted-foreground/30" />
                      <span className="text-base tabular-nums">
                        {pageNumber}
                      </span>
                    </button>
                  );
                })}

                {/* Fallback: Epilogue */}
                {hasEpilogue && (
                  <button
                    onClick={() => onChapterClick?.("epilogue")}
                    className="flex items-center justify-between w-full group hover:opacity-70 transition-opacity"
                  >
                    <span className="text-base lowercase tracking-wide">
                      epilogue
                    </span>
                    <div className="flex-1 mx-4 border-b border-dotted border-muted-foreground/30" />
                    <span className="text-base tabular-nums">
                      {(hasPrologue ? 2 : 1) + regularChapters.length}
                    </span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Copyright Notice */}
          <p className="text-xs text-muted-foreground text-center uppercase tracking-wide mt-auto">
            Copyrighted Material
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
