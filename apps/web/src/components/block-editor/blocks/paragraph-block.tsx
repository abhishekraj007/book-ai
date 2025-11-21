"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import type { Block } from "../block-editor-context";
import { useMutation } from "convex/react";
import { api } from "@book-ai/backend/convex/_generated/api";
import { FormattingToolbar } from "../formatting-toolbar";
import { cn } from "@/lib/utils";

export function ParagraphBlock({
  block,
  editable = false,
}: {
  block: Block;
  editable?: boolean;
}) {
  const updateBlock = useMutation(api.features.books.updateBlock);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: !editable,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "Type something or press / for commands...",
      }),
    ],
    content: block.content.html,
    editable,
    onUpdate: ({ editor }) => {
      // Auto-save on content change (debounced in production)
      const html = editor.getHTML();
      const plainText = editor.getText();

      updateBlock({
        blockId: block._id,
        content: { html, plainText },
      }).catch(console.error);
    },
    onSelectionUpdate: ({ editor }) => {
      // Show toolbar when text is selected
      if (editable) {
        const { from, to } = editor.state.selection;
        if (from !== to) {
          setShowToolbar(true);
          // Simple positioning - can be improved with proper positioning logic
          setToolbarPosition({ top: 0, left: 0 });
        } else {
          setShowToolbar(false);
        }
      }
    },
  });

  // Update editor content when block changes externally
  useEffect(() => {
    if (editor && editor.getHTML() !== block.content.html) {
      editor.commands.setContent(block.content.html);
    }
  }, [block.content.html, editor]);

  return (
    <div
      className={cn(
        "paragraph-block prose prose-sm max-w-none relative",
        editable && "cursor-text"
      )}
      style={{
        marginTop: block.styling?.marginTop,
        marginBottom: block.styling?.marginBottom,
      }}
    >
      {editor && editable && showToolbar && (
        <div className="absolute -top-12 left-0 z-50">
          <FormattingToolbar editor={editor} />
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
