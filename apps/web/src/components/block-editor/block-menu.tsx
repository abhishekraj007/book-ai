"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@book-ai/backend/convex/_generated/api";
import type { Id } from "@book-ai/backend/convex/_generated/dataModel";
import type { BlockType } from "./block-editor-context";
import { cn } from "@/lib/utils";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Image,
  Minus,
  AlertCircle,
  Space,
} from "lucide-react";

interface BlockMenuItem {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
}

const BLOCK_MENU_ITEMS: BlockMenuItem[] = [
  {
    type: "paragraph",
    label: "Paragraph",
    description: "Plain text block",
    icon: Type,
    keywords: ["text", "p", "paragraph"],
  },
  {
    type: "heading1",
    label: "Heading 1",
    description: "Large section heading",
    icon: Heading1,
    keywords: ["h1", "heading", "title"],
  },
  {
    type: "heading2",
    label: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    keywords: ["h2", "heading", "subtitle"],
  },
  {
    type: "heading3",
    label: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    keywords: ["h3", "heading"],
  },
  {
    type: "quote",
    label: "Quote",
    description: "Blockquote",
    icon: Quote,
    keywords: ["quote", "blockquote", "citation"],
  },
  {
    type: "bulletList",
    label: "Bullet List",
    description: "Unordered list",
    icon: List,
    keywords: ["list", "ul", "bullet", "unordered"],
  },
  {
    type: "numberedList",
    label: "Numbered List",
    description: "Ordered list",
    icon: ListOrdered,
    keywords: ["list", "ol", "numbered", "ordered"],
  },
  {
    type: "callout",
    label: "Callout",
    description: "Highlighted info box",
    icon: AlertCircle,
    keywords: ["callout", "info", "warning", "note"],
  },
  {
    type: "image",
    label: "Image",
    description: "Upload an image",
    icon: Image,
    keywords: ["image", "img", "picture", "photo"],
  },
  {
    type: "divider",
    label: "Divider",
    description: "Horizontal line",
    icon: Minus,
    keywords: ["divider", "hr", "line", "separator"],
  },
  {
    type: "spacer",
    label: "Spacer",
    description: "Vertical spacing",
    icon: Space,
    keywords: ["spacer", "space", "gap"],
  },
];

interface BlockMenuProps {
  pageId: Id<"bookPages">;
  onInsert: (blockId: Id<"pageBlocks">) => void;
  onClose: () => void;
  position: { top: number; left: number };
  search?: string;
}

export function BlockMenu({
  pageId,
  onInsert,
  onClose,
  position,
  search = "",
}: BlockMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const createBlock = useMutation(api.features.books.createBlock);

  // Filter items based on search
  const filteredItems = BLOCK_MENU_ITEMS.filter((item) => {
    const searchLower = search.toLowerCase();
    return (
      item.label.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.keywords.some((kw) => kw.includes(searchLower))
    );
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filteredItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (i) => (i - 1 + filteredItems.length) % filteredItems.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = filteredItems[selectedIndex];
        if (item) handleInsert(item.type);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredItems, selectedIndex]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleInsert = async (type: BlockType) => {
    try {
      // Get current blocks to determine order
      const order = Date.now(); // Simple ordering

      const blockId = await createBlock({
        pageId,
        type,
        order,
        content: {
          html: type === "divider" || type === "spacer" ? "" : "<p></p>",
          plainText: "",
        },
        createdBy: "user",
        ...(type === "callout" && {
          blockData: { type: "info" },
        }),
        ...(type === "spacer" && {
          blockData: { height: "2rem" },
        }),
      });

      onInsert(blockId);
      onClose();
    } catch (error) {
      console.error("Failed to create block:", error);
    }
  };

  if (filteredItems.length === 0) {
    return (
      <div
        ref={menuRef}
        className="absolute z-50 w-64 bg-popover border border-border rounded-lg shadow-lg p-4"
        style={{ top: position.top, left: position.left }}
      >
        <p className="text-sm text-muted-foreground">No blocks found</p>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-64 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      <div className="max-h-80 overflow-y-auto">
        {filteredItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              onClick={() => handleInsert(item.type)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent transition-colors",
                index === selectedIndex && "bg-accent"
              )}
            >
              <Icon className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{item.label}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border bg-muted/50">
        ↑↓ Navigate • Enter Select • Esc Close
      </div>
    </div>
  );
}
