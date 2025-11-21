"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { Id } from "@book-ai/backend/convex/_generated/dataModel";

// Block type definition
export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "quote"
  | "callout"
  | "bulletList"
  | "numberedList"
  | "checkList"
  | "image"
  | "divider"
  | "columns"
  | "spacer";

export interface Block {
  _id: Id<"pageBlocks">;
  pageId: Id<"bookPages">;
  type: BlockType;
  order: number;
  content: {
    html: string;
    plainText?: string;
  };
  blockData?: any;
  styling?: {
    fontSize?: string;
    textAlign?: string;
    textColor?: string;
    marginTop?: string;
    marginBottom?: string;
    backgroundColor?: string;
    borderLeft?: string;
    borderRadius?: string;
  };
  createdBy?: string;
  isLocked?: boolean;
  parentColumnId?: Id<"pageBlocks">;
  createdAt: number;
  updatedAt: number;
}

interface BlockEditorContextValue {
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string | null) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  pageId: Id<"bookPages">;
}

const BlockEditorContext = createContext<BlockEditorContextValue | null>(null);

export function BlockEditorProvider({
  children,
  pageId,
}: {
  children: ReactNode;
  pageId: Id<"bookPages">;
}) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <BlockEditorContext.Provider
      value={{
        selectedBlockId,
        setSelectedBlockId,
        isDragging,
        setIsDragging,
        pageId,
      }}
    >
      {children}
    </BlockEditorContext.Provider>
  );
}

export function useBlockEditor() {
  const context = useContext(BlockEditorContext);
  if (!context) {
    throw new Error("useBlockEditor must be used within BlockEditorProvider");
  }
  return context;
}
