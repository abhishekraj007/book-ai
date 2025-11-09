'use client';

import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@book-ai/backend/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Plus, Loader2, Trash2, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { Id } from '@book-ai/backend/convex/_generated/dataModel';

/**
 * Books Dashboard
 * 
 * Lists all books created by the user with status and actions
 */
export default function BooksDashboard() {
  const router = useRouter();
  const books = useQuery(api.features.books.index.listMyBooks);
  const deleteBook = useMutation(api.features.books.index.deleteBook);

  const handleDelete = async (bookId: Id<'books'>) => {
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteBook({ bookId });
    } catch (error) {
      console.error('Failed to delete book:', error);
      alert('Failed to delete book. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'generating':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'generating':
        return 'Generating...';
      case 'failed':
        return 'Failed';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(timestamp));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">My Books</h1>
            </div>
            <p className="text-muted-foreground">
              Create and manage your AI-generated books
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => router.push('/books/create')}
            className="gap-2"
          >
            <Plus className="h-5 w-5" />
            Create New Book
          </Button>
        </div>

        {/* Books Grid */}
        {books === undefined && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {books?.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                No books yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Create your first AI-generated book to get started
              </p>
              <Button
                onClick={() => router.push('/books/create')}
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Create Your First Book
              </Button>
            </CardContent>
          </Card>
        )}

        {books && books.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <Card
                key={book._id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/books/${book._id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">
                      {book.title}
                    </CardTitle>
                    <div className="flex-shrink-0">
                      {getStatusIcon(book.status)}
                    </div>
                  </div>
                  <CardDescription className="capitalize">
                    {book.type.replace(/_/g, ' ')}
                    {book.metadata.genre && ` · ${book.metadata.genre}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Status */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium text-foreground">
                        {getStatusText(book.status)}
                      </span>
                    </div>

                    {/* Current Step */}
                    {book.status === 'generating' && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Step:</span>
                        <span className="font-medium text-foreground capitalize">
                          {book.currentStep.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}

                    {/* Credits Used */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Credits Used:</span>
                      <span className="font-medium text-foreground">
                        {book.creditsUsed}
                      </span>
                    </div>

                    {/* Last Updated */}
                    <div className="text-xs text-muted-foreground">
                      Updated {formatDate(book.updatedAt)}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/books/${book._id}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(book._id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

