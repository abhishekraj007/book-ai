'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@book-ai/backend/convex/_generated/api';
import type { Id } from '@book-ai/backend/convex/_generated/dataModel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw, X } from 'lucide-react';

interface ResumeBannerProps {
  bookId: Id<'books'>;
  onResume?: () => void;
}

/**
 * Resume Banner Component
 * 
 * Displays a prominent banner when generation is paused or failed,
 * allowing users to resume from the last checkpoint.
 * 
 * Features:
 * - Shows last checkpoint information
 * - Displays retry count
 * - Resume button with loading state
 * - Dismissible
 */
export function ResumeBanner({ bookId, onResume }: ResumeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Query resume state
  const resumeState = useQuery(api.features.books.index.getResumeState, {
    bookId,
  });

  // Mutation to retry generation
  const retry = useMutation(api.features.books.index.retryGeneration);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleResume = async () => {
    setIsRetrying(true);
    try {
      await retry({ bookId });
      onResume?.();
    } catch (error) {
      console.error('Failed to resume:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to resume generation. Please try again.'
      );
    } finally {
      setIsRetrying(false);
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

  // Don't show if dismissed or no resume state
  if (isDismissed || !resumeState?.canResume) {
    return null;
  }

  return (
    <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10 mb-6">
      <div className="p-4 flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1">
            Generation Paused
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Your book generation was interrupted. You can resume from where you
            left off.
          </p>

          <div className="space-y-1 text-xs text-muted-foreground mb-4">
            <p>
              <span className="font-medium">Last checkpoint:</span>{' '}
              {resumeState.lastCheckpoint.step.replace(/_/g, ' ')}
            </p>
            <p>
              <span className="font-medium">Last active:</span>{' '}
              {formatDate(resumeState.lastCheckpoint.timestamp)}
            </p>
            {resumeState.retryCount > 0 && (
              <p>
                <span className="font-medium">Retry attempts:</span>{' '}
                {resumeState.retryCount}/3
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleResume}
              disabled={isRetrying || resumeState.retryCount >= 3}
              className="gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {isRetrying ? 'Resuming...' : 'Resume Generation'}
            </Button>

            {resumeState.retryCount >= 3 && (
              <p className="text-xs text-destructive self-center">
                Maximum retry attempts reached
              </p>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 flex-shrink-0"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

