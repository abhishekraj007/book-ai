"use client";

import { Plus, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface AddPagesSheetProps {
  missingPages?: { required: string[]; optional: string[] };
  existingPages?: string[]; // Array of page types that are already added
  onAddPage: (pageType: string) => void;
  isLoading?: boolean;
}

const PAGE_DESCRIPTIONS: Record<string, string> = {
  title_page:
    "The first page displaying the book's title, author, and publisher",
  copyright: "Copyright notice and publication information",
  dedication: "Personal dedication to someone special",
  table_of_contents: "Automatically generated list of all chapters",
  foreword: "Introduction written by someone other than the author",
  preface: "Author's introduction explaining the book's purpose",
  acknowledgments: "Thank you notes to contributors and supporters",
  prologue: "Opening scene that sets up the story",
  about_author: "Author biography and background",
  bibliography: "List of referenced sources and materials",
  appendix: "Supplementary information and data",
};

const PAGE_LABELS: Record<string, string> = {
  title_page: "Title Page",
  copyright: "Copyright Page",
  dedication: "Dedication",
  table_of_contents: "Table of Contents",
  foreword: "Foreword",
  preface: "Preface",
  acknowledgments: "Acknowledgments",
  prologue: "Prologue",
  about_author: "About the Author",
  bibliography: "Bibliography",
  appendix: "Appendix",
};

export function AddPagesSheet({
  missingPages,
  existingPages = [],
  onAddPage,
  isLoading,
}: AddPagesSheetProps) {
  if (!missingPages) return null;

  const totalMissing =
    missingPages.required.length + missingPages.optional.length;

  // Combine all page types (required + optional)
  const allRequiredPages = ["title_page", "table_of_contents"];

  const allOptionalPages = [
    "copyright",
    "dedication",
    "foreword",
    "preface",
    "acknowledgments",
    "about_author",
    "bibliography",
    "appendix",
  ];

  // Check if a page is already added
  const isPageAdded = (pageType: string) => existingPages.includes(pageType);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Pages
          {totalMissing > 0 && (
            <Badge variant="secondary" className="ml-1">
              {totalMissing}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Add Book Pages</SheetTitle>
          <SheetDescription>
            Add missing pages to complete your book structure. Required pages
            are essential, optional pages can enhance your book.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-6 p-4">
            {/* Required Pages */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-sm">Required Pages</h3>
                <Badge variant="destructive" className="text-xs">
                  {allRequiredPages.filter((p) => !isPageAdded(p)).length}
                </Badge>
              </div>
              <div className="space-y-2">
                {allRequiredPages.map((pageType) => {
                  const isAdded = isPageAdded(pageType);
                  return (
                    <div
                      key={pageType}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        isAdded ? "bg-muted/50" : "bg-card hover:bg-accent/50"
                      }`}
                    >
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">
                            {PAGE_LABELS[pageType] || pageType}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {PAGE_DESCRIPTIONS[pageType] ||
                            "Essential page for your book"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => onAddPage(pageType)}
                        disabled={isLoading || isAdded}
                        size="sm"
                        className="flex-shrink-0"
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Separator */}
            <Separator className="my-4" />

            {/* Optional Pages */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-sm">Optional Pages</h3>
                <Badge variant="secondary" className="text-xs">
                  {allOptionalPages.filter((p) => !isPageAdded(p)).length}
                </Badge>
              </div>
              <div className="space-y-2">
                {allOptionalPages.map((pageType) => {
                  const isAdded = isPageAdded(pageType);
                  return (
                    <div
                      key={pageType}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        isAdded
                          ? "bg-muted/50 opacity-75"
                          : "bg-card hover:bg-accent/50"
                      }`}
                    >
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">
                            {PAGE_LABELS[pageType] || pageType}
                          </h4>
                          <Badge
                            variant={isAdded ? "secondary" : "outline"}
                            className="text-xs h-5 px-1.5"
                          >
                            {isAdded ? "Added" : "Optional"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {PAGE_DESCRIPTIONS[pageType] ||
                            "Enhance your book with this page"}
                        </p>
                      </div>
                      <Button
                        onClick={() => onAddPage(pageType)}
                        disabled={isLoading || isAdded}
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0"
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completion state */}
            {totalMissing === 0 && (
              <div className="text-center py-8 px-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <Check className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  All required pages added!
                </p>
                <p className="text-xs mt-1 text-green-700 dark:text-green-300">
                  Your book structure is complete.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
