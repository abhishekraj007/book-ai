"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@book-ai/backend/convex/_generated/api";
import type { Id } from "@book-ai/backend/convex/_generated/dataModel";
import type { Block } from "./block-editor-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";

interface BlockActionsMenuProps {
  block: Block;
  onDelete?: () => void;
  onDuplicate?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function BlockActionsMenu({
  block,
  onDelete,
  onDuplicate,
  canMoveUp = true,
  canMoveDown = true,
}: BlockActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const deleteBlock = useMutation(api.features.books.deleteBlock);
  const duplicateBlock = useMutation(api.features.books.duplicateBlock);
  const reorderBlocks = useMutation(api.features.books.reorderBlocks);

  const handleDelete = async () => {
    try {
      await deleteBlock({ blockId: block._id });
      onDelete?.();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to delete block:", error);
    }
  };

  const handleDuplicate = async () => {
    try {
      const newBlockId = await duplicateBlock({ blockId: block._id });
      onDuplicate?.();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to duplicate block:", error);
    }
  };

  const handleMoveUp = async () => {
    // TODO: Implement move up logic with reorderBlocks
    console.log("Move up:", block._id);
    setIsOpen(false);
  };

  const handleMoveDown = async () => {
    // TODO: Implement move down logic with reorderBlocks
    console.log("Move down:", block._id);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleMoveUp} disabled={!canMoveUp}>
          <ArrowUp className="mr-2 h-4 w-4" />
          Move Up
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleMoveDown} disabled={!canMoveDown}>
          <ArrowDown className="mr-2 h-4 w-4" />
          Move Down
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
