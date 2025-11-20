"use client";

import { Download, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactNode } from "react";

interface BookHeaderProps {
  onToggleSidebar: () => void;
  activeView: "view" | "edit";
  onViewChange: (view: "view" | "edit") => void;
  isGenerating?: boolean;
  version?: string;
  addPagesButton?: ReactNode;
}

export function BookHeader({
  onToggleSidebar,
  activeView,
  onViewChange,
  isGenerating = false,
  version = "Version 3 (Latest)",
  addPagesButton,
}: BookHeaderProps) {
  return (
    <div className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs text-primary-foreground">
            B
          </div>
          <span>BookGen AI</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Tabs
          value={activeView}
          onValueChange={(v: string) => onViewChange(v as "view" | "edit")}
        >
          <TabsList>
            <TabsTrigger value="view">View</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Add Pages Button */}
        {addPagesButton}

        <Badge variant="outline" className="font-normal">
          {version}
        </Badge>

        <span className="text-sm text-muted-foreground">
          {isGenerating ? "Generating..." : "Ready"}
        </span>

        <Button size="sm">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  );
}
