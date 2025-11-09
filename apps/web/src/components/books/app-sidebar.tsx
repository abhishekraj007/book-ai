"use client";

import Link from "next/link";
import { Library, Plus, LayoutTemplate, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  collapsed: boolean;
}

export function AppSidebar({ collapsed }: AppSidebarProps) {
  return (
    <div
      className={cn(
        "flex flex-col border-r bg-muted/30 transition-all duration-300",
        collapsed ? "w-0 overflow-hidden" : "w-56"
      )}
    >
      <div className="flex flex-col gap-1 p-3">
        <div className="mb-2 px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-400 text-sm font-medium text-white">
              A
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">My Workspace</p>
              <p className="text-xs text-muted-foreground">Personal Plan</p>
            </div>
          </div>
        </div>

        <Link href="/books">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            size="sm"
          >
            <Library className="h-4 w-4" />
            My Books
          </Button>
        </Link>

        <Link href="/books/new">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 bg-primary/10"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            New Book
          </Button>
        </Link>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          size="sm"
        >
          <LayoutTemplate className="h-4 w-4" />
          Templates
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          size="sm"
        >
          <Users className="h-4 w-4" />
          Community
        </Button>
      </div>

      <div className="mt-auto border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          size="sm"
        >
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          size="sm"
        >
          Log Out
        </Button>
      </div>
    </div>
  );
}

