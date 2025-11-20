"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Bold,
  Italic,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BookPageCardProps {
  page: any;
  onUpdate: (pageId: string, updates: any) => void;
  onToggleVisibility?: (pageId: string) => void;
  readOnly?: boolean;
}

const PAGE_TYPE_LABELS: Record<string, string> = {
  title_page: "Title Page",
  copyright: "Copyright Page",
  dedication: "Dedication",
  table_of_contents: "Table of Contents",
  foreword: "Foreword",
  preface: "Preface",
  acknowledgments: "Acknowledgments",
  about_author: "About the Author",
  bibliography: "Bibliography",
  appendix: "Appendix",
  prologue: "Prologue",
  epilogue: "Epilogue",
};

export function BookPageCard({
  page,
  onUpdate,
  onToggleVisibility,
  readOnly = false,
}: BookPageCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(page.content || "");
  const [formatting, setFormatting] = useState(page.formatting || {});

  const handleSave = () => {
    onUpdate(page._id, { content, formatting });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setContent(page.content || "");
    setFormatting(page.formatting || {});
    setIsEditing(false);
  };

  const toggleFormat = (key: string, value: any) => {
    setFormatting((prev: any) => ({
      ...prev,
      [key]: prev[key] === value ? undefined : value,
    }));
  };

  const pageLabel = PAGE_TYPE_LABELS[page.pageType] || page.pageType;

  return (
    <Card
      className={cn(
        "transition-all",
        !page.isVisible && "opacity-50 border-dashed"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{pageLabel}</h3>
            {page.title && (
              <p className="text-xs text-muted-foreground">{page.title}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {page.isOptional && onToggleVisibility && (
              <Button
                onClick={() => onToggleVisibility(page._id)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                {page.isVisible ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            )}
            {!readOnly && page.status === "empty" && (
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="outline"
              >
                <Edit className="mr-2 h-4 w-4" />
                Add Content
              </Button>
            )}
            {!readOnly && page.status === "completed" && !isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            {/* Formatting Toolbar */}
            <div className="flex flex-wrap gap-2 border-b pb-3">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={
                    formatting.textAlign === "left" ? "default" : "outline"
                  }
                  onClick={() => toggleFormat("textAlign", "left")}
                  className="h-8 w-8 p-0"
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={
                    formatting.textAlign === "center" ? "default" : "outline"
                  }
                  onClick={() => toggleFormat("textAlign", "center")}
                  className="h-8 w-8 p-0"
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={
                    formatting.textAlign === "right" ? "default" : "outline"
                  }
                  onClick={() => toggleFormat("textAlign", "right")}
                  className="h-8 w-8 p-0"
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={
                    formatting.fontWeight === "bold" ? "default" : "outline"
                  }
                  onClick={() => toggleFormat("fontWeight", "bold")}
                  className="h-8 w-8 p-0"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={
                    formatting.fontStyle === "italic" ? "default" : "outline"
                  }
                  onClick={() => toggleFormat("fontStyle", "italic")}
                  className="h-8 w-8 p-0"
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={
                    formatting.fontSize === "medium" ? "default" : "outline"
                  }
                  onClick={() => toggleFormat("fontSize", "medium")}
                >
                  <Type className="h-3 w-3 mr-1" />M
                </Button>
                <Button
                  size="sm"
                  variant={
                    formatting.fontSize === "large" ? "default" : "outline"
                  }
                  onClick={() => toggleFormat("fontSize", "large")}
                >
                  <Type className="h-4 w-4 mr-1" />L
                </Button>
                <Button
                  size="sm"
                  variant={
                    formatting.fontSize === "xlarge" ? "default" : "outline"
                  }
                  onClick={() => toggleFormat("fontSize", "xlarge")}
                >
                  <Type className="h-5 w-5 mr-1" />
                  XL
                </Button>
              </div>
            </div>

            {/* Content Editor */}
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Enter content for ${pageLabel.toLowerCase()}...`}
              rows={8}
              className="resize-none"
            />

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button onClick={handleCancel} variant="outline" size="sm">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} size="sm">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "prose dark:prose-invert max-w-none",
              formatting.textAlign === "center" && "text-center",
              formatting.textAlign === "right" && "text-right",
              formatting.fontSize === "small" && "text-sm",
              formatting.fontSize === "large" && "text-lg",
              formatting.fontSize === "xlarge" && "text-xl",
              formatting.fontWeight === "bold" && "font-bold",
              formatting.fontStyle === "italic" && "italic",
              formatting.lineHeight === "tight" && "leading-tight",
              formatting.lineHeight === "relaxed" && "leading-relaxed"
            )}
          >
            {page.status === "empty" ? (
              <p className="text-sm text-muted-foreground italic">
                No content yet. Click "Add Content" to begin.
              </p>
            ) : (
              <div className="whitespace-pre-wrap">{page.content}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
