"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Block } from "../block-editor-context";
import { useMutation } from "convex/react";
import { api } from "@book-ai/backend/convex/_generated/api";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, Info, Lightbulb, AlertTriangle } from "lucide-react";

const CALLOUT_ICONS = {
  info: Info,
  warning: AlertTriangle,
  tip: Lightbulb,
  danger: AlertCircle,
};

const CALLOUT_STYLES = {
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
  },
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800",
    icon: "text-yellow-600 dark:text-yellow-400",
  },
  tip: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
  },
  danger: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
  },
};

export function CalloutBlock({
  block,
  editable = false,
}: {
  block: Block;
  editable?: boolean;
}) {
  const updateBlock = useMutation(api.features.books.updateBlock);

  // Get callout type from blockData
  const calloutType =
    (block.blockData?.type as keyof typeof CALLOUT_ICONS) || "info";
  const Icon = CALLOUT_ICONS[calloutType];
  const styles = CALLOUT_STYLES[calloutType];

  const editor = useEditor({
    extensions: [StarterKit],
    content: block.content.html,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const plainText = editor.getText();

      updateBlock({
        blockId: block._id,
        content: { html, plainText },
      }).catch(console.error);
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== block.content.html) {
      editor.commands.setContent(block.content.html);
    }
  }, [block.content.html, editor]);

  return (
    <div
      className={cn(
        "callout-block my-4 p-4 rounded-lg border-l-4 flex gap-3",
        styles.bg,
        styles.border,
        editable && "cursor-text"
      )}
      style={{
        backgroundColor: block.blockData?.backgroundColor || undefined,
        marginTop: block.styling?.marginTop,
        marginBottom: block.styling?.marginBottom,
      }}
    >
      {Icon && (
        <div className={cn("flex-shrink-0 mt-0.5", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex-1 prose prose-sm max-w-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
