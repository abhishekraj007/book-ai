'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@book-ai/backend/convex/_generated/api';
import type { Id } from '@book-ai/backend/convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { History, RotateCcw, User, Bot, Clock } from 'lucide-react';

interface VersionHistoryProps {
  chapterId: Id<'chapters'>;
}

/**
 * Version History Component
 * 
 * Displays all versions of a chapter with:
 * - Version numbers and timestamps
 * - Who made the change (user/AI)
 * - Description of changes
 * - Ability to revert to any version
 * 
 * Uses Convex real-time queries for instant updates
 */
export function VersionHistory({ chapterId }: VersionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  // Query version history (real-time updates)
  const versions = useQuery(api.features.books.index.getVersionHistory, {
    chapterId,
  });

  // Mutation to revert to a version
  const revert = useMutation(api.features.books.index.revertToVersion);

  const handleRevert = async (versionNumber: number) => {
    if (confirm(`Are you sure you want to revert to version ${versionNumber}?`)) {
      try {
        await revert({ chapterId, versionNumber });
        setIsOpen(false);
      } catch (error) {
        console.error('Failed to revert:', error);
        alert('Failed to revert. Please try again.');
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(timestamp));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          Version History
          {versions && versions.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({versions.length})
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Version History</SheetTitle>
          <SheetDescription>
            View and restore previous versions of this chapter
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {!versions && (
            // Loading skeleton
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          )}

          {versions && versions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No version history yet</p>
            </div>
          )}

          {versions?.map((version, idx) => (
            <Card
              key={version._id}
              className={`
                transition-all cursor-pointer
                ${selectedVersion === version.versionNumber && 'ring-2 ring-primary'}
                ${idx === 0 && 'border-primary/50'}
              `}
              onClick={() => setSelectedVersion(version.versionNumber)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      Version {version.versionNumber}
                      {idx === 0 && (
                        <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {formatDate(version.createdAt)}
                    </CardDescription>
                  </div>

                  {idx !== 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRevert(version.versionNumber);
                      }}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  {/* Changed by indicator */}
                  <div className="flex items-center gap-2 text-sm">
                    {version.changedBy === 'ai' ? (
                      <>
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">AI Generated</span>
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">User Edit</span>
                      </>
                    )}
                  </div>

                  {/* Change description */}
                  <p className="text-sm text-foreground">
                    {version.changeDescription}
                  </p>

                  {/* Content preview (collapsed) */}
                  {selectedVersion === version.versionNumber && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">
                        Content Preview:
                      </p>
                      <div className="bg-muted p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                        {version.content.substring(0, 300)}
                        {version.content.length > 300 && '...'}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

