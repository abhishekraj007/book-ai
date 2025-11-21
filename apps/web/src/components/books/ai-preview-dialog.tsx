"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Markdown } from "@/components/ui/markdown";
import { Loader2, Check, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AIPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  originalContent: string;
  generatedContent: string | null;
  isGenerating: boolean;
  onAccept: () => void;
  onReject: () => void;
  onGenerate?: (customInstruction?: string) => void; // New callback for generation
}

export function AIPreviewDialog({
  open,
  onOpenChange,
  title,
  originalContent,
  generatedContent,
  isGenerating,
  onAccept,
  onReject,
  onGenerate,
}: AIPreviewDialogProps) {
  const [activeTab, setActiveTab] = useState<"original" | "generated">(
    "generated"
  );
  const [customInstruction, setCustomInstruction] = useState("");

  const handleAccept = () => {
    onAccept();
    onOpenChange(false);
  };

  const handleReject = () => {
    onReject();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Review the AI-generated content. You can compare it with the
            original before accepting.
          </DialogDescription>
        </DialogHeader>

        {/* Custom Instruction Input - Show before generation */}
        {onGenerate && !generatedContent && !isGenerating && (
          <div className="space-y-2 pb-4">
            <Label htmlFor="custom-instruction" className="text-sm font-medium">
              Custom Instructions (Optional)
            </Label>
            <Textarea
              id="custom-instruction"
              placeholder="e.g., Make it more suspenseful, add more dialogue, use simpler language..."
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Add specific instructions to guide the AI generation
            </p>
          </div>
        )}

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              AI is working on your content...
            </p>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "original" | "generated")}
            className="flex-1 flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="original">Original</TabsTrigger>
              <TabsTrigger value="generated">AI Generated</TabsTrigger>
            </TabsList>

            <TabsContent value="original" className="flex-1 mt-4">
              <ScrollArea className="h-[400px] rounded-lg border p-6">
                <div className="prose prose-sm max-w-none">
                  <Markdown>{originalContent}</Markdown>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="generated" className="flex-1 mt-4">
              <ScrollArea className="h-[400px] rounded-lg border p-6 bg-accent/10">
                {generatedContent ? (
                  <div className="prose prose-sm max-w-none">
                    <Markdown>{generatedContent}</Markdown>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No generated content yet</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="flex items-center gap-2">
          {onGenerate && !generatedContent && !isGenerating ? (
            // Show Generate button if onGenerate is provided and no content yet
            <>
              <Button variant="outline" onClick={handleReject}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onGenerate(customInstruction || undefined);
                  setCustomInstruction(""); // Reset after generating
                }}
              >
                Generate
              </Button>
            </>
          ) : (
            // Show Accept/Reject buttons after generation
            <>
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isGenerating}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={handleAccept}
                disabled={isGenerating || !generatedContent}
              >
                <Check className="mr-2 h-4 w-4" />
                Accept & Save
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
