"use client";

import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Link,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface FormattingToolbarProps {
  editor: Editor | null;
  className?: string;
}

export function FormattingToolbar({
  editor,
  className,
}: FormattingToolbarProps) {
  if (!editor) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-2 bg-background border border-border rounded-lg shadow-lg",
        className
      )}
    >
      {/* Text Formatting */}
      <Button
        size="sm"
        variant={editor.isActive("bold") ? "default" : "ghost"}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className="h-8 w-8 p-0"
        title="Bold (Cmd+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant={editor.isActive("italic") ? "default" : "ghost"}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className="h-8 w-8 p-0"
        title="Italic (Cmd+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant={editor.isActive("underline") ? "default" : "ghost"}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className="h-8 w-8 p-0"
        title="Underline (Cmd+U)"
      >
        <Underline className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Link */}
      <Button
        size="sm"
        variant={editor.isActive("link") ? "default" : "ghost"}
        onClick={() => {
          const url = window.prompt("Enter URL:");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className="h-8 w-8 p-0"
        title="Add Link (Cmd+K)"
      >
        <Link className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text Alignment */}
      <Button
        size="sm"
        variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className="h-8 w-8 p-0"
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant={editor.isActive({ textAlign: "center" }) ? "default" : "ghost"}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className="h-8 w-8 p-0"
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className="h-8 w-8 p-0"
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Clear Formatting */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() =>
          editor.chain().focus().clearNodes().unsetAllMarks().run()
        }
        className="h-8 px-2 text-xs"
        title="Clear Formatting"
      >
        Clear
      </Button>
    </div>
  );
}
