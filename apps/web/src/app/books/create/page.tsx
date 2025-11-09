'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@book-ai/backend/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, BookOpen, Sparkles } from 'lucide-react';

/**
 * Book Creation Page
 * 
 * Form to initiate a new book generation with AI
 */
export default function CreateBookPage() {
  const router = useRouter();
  const createBook = useMutation(api.features.books.index.createBook);

  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'fiction',
    genre: '',
    targetAudience: '',
    language: 'English',
    tone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const result = await createBook(formData);
      // Redirect to generation page
      router.push(`/books/${result.bookId}`);
    } catch (error) {
      console.error('Failed to create book:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to create book. Please try again.'
      );
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Create Your Book</h1>
          </div>
          <p className="text-muted-foreground">
            Powered by Kimi K2 Thinking AI - capable of writing entire books with 200-300
            sequential tool calls
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Book Details</CardTitle>
            <CardDescription>
              Tell us about the book you want to create. The AI will generate an outline
              for your approval before writing chapters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Book Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter your book title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  disabled={isCreating}
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Book Type *</Label>
                <select
                  id="type"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  required
                  disabled={isCreating}
                >
                  <option value="fiction">Fiction</option>
                  <option value="non_fiction">Non-Fiction</option>
                  <option value="storybook">Storybook (Children)</option>
                  <option value="coloring_book">Coloring Book</option>
                  <option value="history">History</option>
                  <option value="biography">Biography</option>
                  <option value="self_help">Self-Help</option>
                  <option value="educational">Educational</option>
                </select>
              </div>

              {/* Genre */}
              <div className="space-y-2">
                <Label htmlFor="genre">Genre (Optional)</Label>
                <Input
                  id="genre"
                  placeholder="e.g., Mystery, Romance, Science Fiction"
                  value={formData.genre}
                  onChange={(e) =>
                    setFormData({ ...formData, genre: e.target.value })
                  }
                  disabled={isCreating}
                />
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience (Optional)</Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g., Young Adults, Children 8-12, Adults"
                  value={formData.targetAudience}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAudience: e.target.value })
                  }
                  disabled={isCreating}
                />
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language">Language *</Label>
                <Input
                  id="language"
                  placeholder="English"
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value })
                  }
                  required
                  disabled={isCreating}
                />
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <Label htmlFor="tone">Tone (Optional)</Label>
                <Input
                  id="tone"
                  placeholder="e.g., Humorous, Dark, Inspirational"
                  value={formData.tone}
                  onChange={(e) =>
                    setFormData({ ...formData, tone: e.target.value })
                  }
                  disabled={isCreating}
                />
              </div>

              {/* Info Box */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-foreground">
                      How it works:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>AI generates a book outline for your review</li>
                      <li>You approve or request changes</li>
                      <li>AI writes each chapter, awaiting your approval</li>
                      <li>Revise any chapter at any time</li>
                      <li>Export to PDF, EPUB, HTML, or Markdown</li>
                    </ol>
                    <p className="text-xs mt-2">
                      Minimum 10 credits required. Credits are deducted per
                      generation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full gap-2"
                disabled={isCreating || !formData.title}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Book...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Start Generating Book
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

