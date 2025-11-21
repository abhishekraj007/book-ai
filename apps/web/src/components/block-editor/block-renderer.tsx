"use client";

import type { Block } from "./block-editor-context";
import { ParagraphBlock } from "./blocks/paragraph-block";
import { HeadingBlock } from "./blocks/heading-block";
import { QuoteBlock } from "./blocks/quote-block";
import { DividerBlock } from "./blocks/divider-block";
import { CalloutBlock } from "./blocks/callout-block";
import { BulletListBlock } from "./blocks/bullet-list-block";
import { NumberedListBlock } from "./blocks/numbered-list-block";
import { ImageBlock } from "./blocks/image-block";
import { SpacerBlock } from "./blocks/spacer-block";

export function BlockRenderer({
  block,
  editable = false,
}: {
  block: Block;
  editable?: boolean;
}) {
  // Render appropriate block component based on type
  switch (block.type) {
    case "paragraph":
      return <ParagraphBlock block={block} editable={editable} />;

    case "heading1":
    case "heading2":
    case "heading3":
      return <HeadingBlock block={block} editable={editable} />;

    case "quote":
      return <QuoteBlock block={block} editable={editable} />;

    case "divider":
      return <DividerBlock block={block} editable={editable} />;

    case "callout":
      return <CalloutBlock block={block} editable={editable} />;

    case "bulletList":
      return <BulletListBlock block={block} editable={editable} />;

    case "numberedList":
      return <NumberedListBlock block={block} editable={editable} />;

    case "image":
      return <ImageBlock block={block} editable={editable} />;

    case "spacer":
      return <SpacerBlock block={block} editable={editable} />;

    // TODO: Implement remaining block types
    case "checkList":
    case "columns":
      return (
        <div className="p-4 border border-dashed border-muted-foreground/30 rounded text-sm text-muted-foreground">
          {block.type} block (not yet implemented)
        </div>
      );

    default:
      return (
        <div className="p-4 border border-destructive/30 rounded text-sm text-destructive">
          Unknown block type: {block.type}
        </div>
      );
  }
}
