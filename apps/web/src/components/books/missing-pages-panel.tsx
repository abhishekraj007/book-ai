"use client";

import { Plus, BookOpen, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MissingPagesPanelProps {
  missingPages: {
    required: string[];
    optional: string[];
  };
  onAddPage: (pageType: string) => void;
  isLoading?: boolean;
}

const PAGE_INFO: Record<
  string,
  { label: string; description: string; icon: any }
> = {
  title_page: {
    label: "Title Page",
    description: "Book title, author, and publisher information",
    icon: BookOpen,
  },
  copyright: {
    label: "Copyright Page",
    description: "Copyright notice and publication details",
    icon: FileText,
  },
  dedication: {
    label: "Dedication",
    description: "Personal dedication to someone special",
    icon: FileText,
  },
  table_of_contents: {
    label: "Table of Contents",
    description: "Auto-generated chapter listing",
    icon: FileText,
  },
  foreword: {
    label: "Foreword",
    description: "Introduction by another person",
    icon: FileText,
  },
  preface: {
    label: "Preface",
    description: "Author's introduction to the book",
    icon: FileText,
  },
  acknowledgments: {
    label: "Acknowledgments",
    description: "Thank you notes to contributors",
    icon: FileText,
  },
  about_author: {
    label: "About the Author",
    description: "Author biography and credentials",
    icon: FileText,
  },
  bibliography: {
    label: "Bibliography",
    description: "List of referenced sources",
    icon: FileText,
  },
  appendix: {
    label: "Appendix",
    description: "Supplementary material",
    icon: FileText,
  },
  prologue: {
    label: "Prologue",
    description: "Opening scene before main story",
    icon: FileText,
  },
  epilogue: {
    label: "Epilogue",
    description: "Closing scene after main story",
    icon: FileText,
  },
};

export function MissingPagesPanel({
  missingPages,
  onAddPage,
  isLoading,
}: MissingPagesPanelProps) {
  const hasRequired = missingPages.required.length > 0;
  const hasOptional = missingPages.optional.length > 0;

  if (!hasRequired && !hasOptional) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BookOpen className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground text-center">
            All essential pages are complete!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {hasRequired && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Required Pages</CardTitle>
              <Badge variant="destructive">
                {missingPages.required.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {missingPages.required.map((pageType) => {
              const info = PAGE_INFO[pageType];
              if (!info) return null;

              const Icon = info.icon;

              return (
                <div
                  key={pageType}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{info.label}</h4>
                      <p className="text-xs text-muted-foreground">
                        {info.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => onAddPage(pageType)}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {hasOptional && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Optional Pages</CardTitle>
              <Badge variant="secondary">{missingPages.optional.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {missingPages.optional.map((pageType) => {
              const info = PAGE_INFO[pageType];
              if (!info) return null;

              const Icon = info.icon;

              return (
                <div
                  key={pageType}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{info.label}</h4>
                      <p className="text-xs text-muted-foreground">
                        {info.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => onAddPage(pageType)}
                    disabled={isLoading}
                    size="sm"
                    variant="ghost"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
