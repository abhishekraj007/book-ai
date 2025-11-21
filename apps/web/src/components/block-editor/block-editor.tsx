"use client";

import { useQuery } from "convex/react";
import { api } from "@book-ai/backend/convex/_generated/api";
import type { Id } from "@book-ai/backend/convex/_generated/dataModel";
import { BlockRenderer } from "./block-renderer";
import { BlockEditorProvider } from "./block-editor-context";
import { Loader2 } from "lucide-react";

export function BlockEditor({
  pageId,
  editable = false,
}: {
  pageId: Id<"bookPages">;
  editable?: boolean;
}) {
  const blocks = useQuery(api.features.books.getPageBlocks, { pageId });

  if (blocks === undefined) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-12">
        {editable ? (
          <div>
            <p className="text-lg font-medium mb-2">No blocks yet</p>
            <p className="text-sm">
              Click to add your first block or type <code>/</code> to open the
              block menu
            </p>
          </div>
        ) : (
          <p>This page has no content</p>
        )}
      </div>
    );
  }

  return (
    <BlockEditorProvider pageId={pageId}>
      <div className="block-editor relative">
        {/* Render all blocks */}
        <div className="blocks-container space-y-2">
          {blocks.map((block) => (
            <BlockRenderer key={block._id} block={block} editable={editable} />
          ))}
        </div>

        {/* Add block button (when editable) */}
        {editable && (
          <div className="mt-4">
            <button
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                // TODO: Add new block
                console.log("Add new block");
              }}
            >
              + Add block
            </button>
          </div>
        )}
      </div>
    </BlockEditorProvider>
  );
}
