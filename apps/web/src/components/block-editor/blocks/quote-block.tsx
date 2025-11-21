"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Block } from "../block-editor-context";
import { useMutation } from "convex/react";
import { api } from "@book-ai/backend/convex/_generated/api";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function QuoteBlock({
  block,
  editable = false,
}: {
  block: Block;
  editable?: boolean;
}) {
  const updateBlock = useMutation(api.features.books.updateBlock);

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
        "quote-block my-4 pl-4 border-l-4 border-muted-foreground/30 italic text-muted-foreground",
        editable && "cursor-text"
      )}
      style={{
        borderLeftColor: block.styling?.borderLeft,
        backgroundColor: block.styling?.backgroundColor,
        marginTop: block.styling?.marginTop,
        marginBottom: block.styling?.marginBottom,
      }}
    >
      <blockquote className="prose prose-sm max-w-none">
        <EditorContent editor={editor} />
      </blockquote>
    </div>
  );
}
