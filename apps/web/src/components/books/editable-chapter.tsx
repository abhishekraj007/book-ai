"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EditableChapterProps {
  chapter: any;
  onSave: (chapterId: string, content: string) => void;
  onRewrite?: (chapterId: string, selection: string) => void;
}

export function EditableChapter({
  chapter,
  onSave,
  onRewrite,
}: EditableChapterProps) {
  const [content, setContent] = useState(chapter.content);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  const handleTextSelection = () => {
    const selection = window.getSelection()?.toString();
    if (selection) {
      setSelectedText(selection);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setHasChanges(true);
        }}
        onMouseUp={handleTextSelection}
        className="min-h-[400px] font-serif text-base leading-relaxed"
      />

      {/* Action buttons */}
      <div className="flex gap-2">
        {hasChanges && (
          <Button onClick={() => onSave(chapter._id, content)}>
            Save Changes
          </Button>
        )}
        {selectedText && onRewrite && (
          <Button
            variant="outline"
            onClick={() => onRewrite(chapter._id, selectedText)}
          >
            Rewrite Selection
          </Button>
        )}
      </div>
    </div>
  );
}

