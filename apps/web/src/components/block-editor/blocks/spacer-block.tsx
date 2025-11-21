"use client";

import type { Block } from "../block-editor-context";
import { cn } from "@/lib/utils";

export function SpacerBlock({
  block,
  editable = false,
}: {
  block: Block;
  editable?: boolean;
}) {
  // Get height from blockData, default to 2rem
  const height = block.blockData?.height || "2rem";

  return (
    <div
      className={cn(
        "spacer-block",
        editable && "border border-dashed border-muted-foreground/20"
      )}
      style={{
        height,
        minHeight: "1rem",
      }}
    >
      {editable && (
        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
          Spacer ({height})
        </div>
      )}
    </div>
  );
}
