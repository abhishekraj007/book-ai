"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Block } from "../block-editor-context";
import { useMutation } from "convex/react";
import { api } from "@book-ai/backend/convex/_generated/api";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function HeadingBlock({
  block,
  editable = false,
}: {
  block: Block;
  editable?: boolean;
}) {
  const updateBlock = useMutation(api.features.books.updateBlock);

  // Determine heading level
  const level = parseInt(block.type.replace("heading", "")) as 1 | 2 | 3;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Only allow heading of the specific level
        heading: {
          levels: [level],
        },
      }),
      Link.configure({
        openOnClick: !editable,
      }),
    ],
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
        "heading-block prose prose-sm max-w-none",
        level === 1 && "prose-headings:text-4xl prose-headings:font-bold",
        level === 2 && "prose-headings:text-3xl prose-headings:font-semibold",
        level === 3 && "prose-headings:text-2xl prose-headings:font-medium",
        editable && "cursor-text",
        block.styling?.textAlign &&
          {
            left: "text-left",
            center: "text-center",
            right: "text-right",
          }[block.styling.textAlign]
      )}
      style={{
        color: block.styling?.textColor,
        marginTop: block.styling?.marginTop,
        marginBottom: block.styling?.marginBottom,
      }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
