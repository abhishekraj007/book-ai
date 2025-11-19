"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@book-ai/backend/convex/_generated/api";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { cn } from "@/lib/utils";
import type { ChatStatus } from "ai";
import { Loader2 } from "lucide-react";

const suggestions = [
  "A children's storybook about a brave knight",
  "A coloring book of intricate mandalas",
  "A cookbook of vegan dessert recipes",
  "A sci-fi novel about AI discovering ancient human music",
  "A self-help guide for creative entrepreneurs",
  "A history book about ancient civilizations",
];
const genres = [
  { id: "fiction", label: "Fiction", icon: "📖" },
  { id: "non_fiction", label: "Non-Fiction", icon: "📚" },
  { id: "childrens", label: "Children's", icon: "🧸" },
  { id: "educational", label: "Educational", icon: "🎓" },
  { id: "reference", label: "Reference", icon: "📋" },
  { id: "poetry", label: "Poetry", icon: "✍️" },
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
  const [creatingGenre, setCreatingGenre] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!message.text?.trim()) return;

    setStatus("submitted");

    try {
      // Create book with the prompt as title
      const result = await createBook({
        title:
          message.text.length > 50
            ? message.text.substring(0, 50) + "..."
            : message.text,
        type: "fiction", // Default, AI will determine from prompt
        language: "English",
      });

      // Navigate to generation page
      router.push(`/books/${result.bookId}`);
    } catch (error) {
      console.error("Failed to create book:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create book. Please try again."
      );
      setStatus("error");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setText(suggestion);
  };

  const handleGenreSelect = async (genreId: string, genreLabel: string) => {
    try {
      setCreatingGenre(genreId);

      // Create book with genre-specific title and better initial prompt
      const result = await createBook({
        title: `${genreLabel} Book`,
        type: genreId,
      });

      // Navigate to the book page
      // The agent will start by asking questions one-by-one
      router.push(`/books/${result.bookId}`);
    } catch (error) {
      console.error("Failed to create book:", error);
      setCreatingGenre(null);
    }
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
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
          <PromptInputFooter className="flex justify-end">
            <PromptInputSubmit
              disabled={!text.trim() || status === "streaming"}
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

        {/* Try an Example - Simple Genre Pills */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Or choose a genre:
          </p>
          <Suggestions>
            {genres.map((genre) => (
              <Suggestion
                key={genre.id}
                suggestion={genre.label}
                onClick={() => handleGenreSelect(genre.id, genre.label)}
              />
            ))}
          </Suggestions>
        </div>
      </div>
    </div>
  );
}
