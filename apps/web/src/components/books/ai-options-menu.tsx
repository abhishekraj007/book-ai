"use client";

import { useState } from "react";
import { Edit, RefreshCw, Sparkles, Expand, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AIOptionsMenuProps {
  onEdit?: () => void;
  onRewrite?: () => void;
  onEnhance?: () => void;
  onExpand?: () => void;
  className?: string;
}

export function AIOptionsMenu({
  onEdit,
  onRewrite,
  onEnhance,
  onExpand,
  className,
}: AIOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={className}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Page Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {onEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit Content</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            AI Actions
          </DropdownMenuLabel>

          {onRewrite && (
            <DropdownMenuItem onClick={onRewrite}>
              <RefreshCw className="mr-2 h-4 w-4 text-purple-600" />
              <span>Rewrite with AI</span>
            </DropdownMenuItem>
          )}

          {onEnhance && (
            <DropdownMenuItem onClick={onEnhance}>
              <Sparkles className="mr-2 h-4 w-4 text-yellow-600" />
              <span>Enhance with AI</span>
            </DropdownMenuItem>
          )}

          {onExpand && (
            <DropdownMenuItem onClick={onExpand}>
              <Expand className="mr-2 h-4 w-4 text-blue-600" />
              <span>Expand Content</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
