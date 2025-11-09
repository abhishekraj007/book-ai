'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@book-ai/backend/convex/_generated/api';
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { cn } from '@/lib/utils';

const suggestions = [
  "A children's storybook about a brave knight",
  'A coloring book of intricate mandalas',
  'A cookbook of vegan dessert recipes',
  'A sci-fi novel about AI discovering ancient human music',
  'A self-help guide for creative entrepreneurs',
  'A history book about ancient civilizations',
];

interface BookPromptProps {
  className?: string;
}

/**
 * v0.app-inspired Book Creation Prompt using AI Elements
 * 
 * Uses PromptInput and Suggestions from AI Elements for consistent UI
 */
export function BookPrompt({ className }: BookPromptProps) {
  const router = useRouter();
  const createBook = useMutation(api.features.books.index.createBook);
  
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'streaming'>('idle');

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!message.text?.trim()) return;
    
    setStatus('streaming');
    
    try {
      // Create book with the prompt as title
      const result = await createBook({
        title: message.text.length > 50 ? message.text.substring(0, 50) + '...' : message.text,
        type: 'fiction', // Default, AI will determine from prompt
        language: 'English',
      });
      
      // Navigate to generation page
      router.push(`/books/${result.bookId}`);
    } catch (error) {
      console.error('Failed to create book:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to create book. Please try again.'
      );
      setStatus('idle');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setText(suggestion);
  };

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      <div className="space-y-8">
        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Describe the book you want to create
          </h1>
        </div>

        {/* AI Elements Prompt Input */}
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="A sci-fi novel about AI discovering ancient human music..."
              className="min-h-[200px] text-lg"
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputSubmit
              disabled={!text.trim() || status === 'streaming'}
              status={status}
            />
          </PromptInputFooter>
        </PromptInput>

        {/* AI Elements Suggestions */}
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            Try an example:
          </p>
          <Suggestions>
            {suggestions.map((suggestion) => (
              <Suggestion
                key={suggestion}
                suggestion={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
              />
            ))}
          </Suggestions>
        </div>

        {/* Info Text */}
        <div className="text-center space-y-2 pt-4">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="font-semibold">Kimi K2 Thinking AI</span>
          </p>
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            Capable of writing entire books with 200-300 sequential tool calls. 
            The AI will guide you through the process with approval at each step.
          </p>
        </div>
      </div>
    </div>
  );
}

