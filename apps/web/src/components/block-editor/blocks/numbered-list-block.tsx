"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import type { Block } from "../block-editor-context";
import { useMutation } from "convex/react";
import { api } from "@book-ai/backend/convex/_generated/api";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function NumberedListBlock({
  block,
  editable = false,
}: {
  block: Block;
  editable?: boolean;
}) {
  const updateBlock = useMutation(api.features.books.updateBlock);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        orderedList: {},
      }),
      OrderedList,
      ListItem,
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
        "numbered-list-block prose prose-sm max-w-none",
        editable && "cursor-text"
      )}
      style={{
        marginTop: block.styling?.marginTop,
        marginBottom: block.styling?.marginBottom,
      }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
