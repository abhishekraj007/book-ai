"use client";

import { useState } from "react";
import { BookOpen, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BookCoverProps {
  book: any;
  onGenerateCover: (customPrompt?: string) => void;
  isGeneratingCover?: boolean;
}

export function BookCover({
  book,
  onGenerateCover,
  isGeneratingCover,
}: BookCoverProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const handleGenerate = () => {
    const prompt = customPrompt.trim();
    onGenerateCover(prompt || undefined);
    setCustomPrompt("");
    setIsDialogOpen(false);
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center space-y-6">
        {book.coverImage ? (
          <div className="space-y-4">
            <div className="relative aspect-[2/3] w-64 overflow-hidden rounded-lg shadow-lg transition-transform hover:scale-105">
              <img
                src={book.coverImage}
                alt={`Cover for ${book.title}`}
                className="h-full w-full object-cover"
              />
            </div>

            <Button
              onClick={handleOpenDialog}
              disabled={isGeneratingCover}
              size="sm"
              variant="outline"
              className="w-full"
            >
              {isGeneratingCover ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate Cover
                </>
              )}
            </Button>
          </div>
        ) : (
          <Card className="border-dashed w-64 aspect-[2/3] flex items-center justify-center bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="mb-2 rounded-full bg-muted p-3">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-sm">No Cover Yet</h3>

              <Button
                onClick={handleOpenDialog}
                disabled={isGeneratingCover}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {isGeneratingCover ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Cover
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {book.coverImage ? "Regenerate" : "Generate"} Book Cover
            </DialogTitle>
            <DialogDescription>
              Add a custom prompt to describe your ideal cover, or leave it
              empty to use the book context automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-prompt">Custom Prompt (Optional)</Label>
              <Textarea
                id="dialog-prompt"
                placeholder="E.g., 'A mystical forest with glowing trees and a moonlit path...'"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-generate from book title, genre, and
                synopsis
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setCustomPrompt("");
              }}
              disabled={isGeneratingCover}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={isGeneratingCover}>
              {isGeneratingCover ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {book.coverImage ? "Regenerate" : "Generate"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
