"use client";

import { Block } from "../block-editor-context";

export function DividerBlock({ block }: { block: Block; editable?: boolean }) {
  return (
    <div
      className="divider-block my-6"
      style={{
        marginTop: block.styling?.marginTop,
        marginBottom: block.styling?.marginBottom,
      }}
    >
      <hr className="border-muted-foreground/20" />
    </div>
  );
}
