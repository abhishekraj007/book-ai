"use client";

import { Check, X, BookOpen, Loader2, Zap, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSmoothText } from "@convex-dev/agent/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  Task,
  TaskTrigger,
  TaskContent,
  TaskItem,
} from "@/components/ai-elements/task";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";
import { getContextualSuggestions } from "@/utils/chat-utils";
import { Markdown } from "@/components/ui/markdown";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { QuestionCard } from "./question-card";
import type { QuestionCardMetadata } from "@/types/question-card";
import { useState } from "react";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";

interface ChatPanelProps {
  messages: any[];
  input: string;
  setInput: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  isLoading: boolean;
  error: Error | null;
  onApprove: () => void;
  onReject: () => void;
  onSendMessage: (message: string) => void;
  loadMore?: () => void;
  canLoadMore?: boolean;
  isLoadingMore?: boolean;
  generationMode?: "auto" | "manual";
  onGenerationModeChange?: (mode: "auto" | "manual") => void;
}

/**
 * Message component with text smoothing for streaming responses
 * This creates the v0.app-style word-by-word streaming effect
 */
function MessageWithSmoothing({
  message,
  isLoading,
  onApprove,
  onReject,
  onSendMessage,
  isLastMessage,
  hasUserResponseAfter,
}: {
  message: any;
  isLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSendMessage: (message: string) => void;
  isLastMessage: boolean;
  hasUserResponseAfter: boolean;
}) {
  // Use smooth text for streaming messages
  const [smoothText] = useSmoothText(message.text || message.content || "", {
    startStreaming: message.status === "streaming",
  });

  // Get contextual suggestions for this message (only on last assistant message)
  const suggestions =
    message.role === "assistant" &&
    !isLoading &&
    message.status !== "streaming" &&
    isLastMessage
      ? getContextualSuggestions(smoothText)
      : [];

  return (
    <Message
      from={message.role}
      className={cn(
        "max-w-full flex flex-col",
        message.role === "user" && "ml-auto"
      )}
    >
      <MessageContent
        className={cn(
          "rounded-lg p-3 text-sm",
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        {/* Render smoothed text - use Markdown for assistant, plain text for user */}
        {message.role === "assistant" ? (
          <div className="text-sm [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-3 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1 [&_h3]:mt-2 [&_p]:mb-2 [&_p]:leading-relaxed [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-1">
            <Markdown>{smoothText}</Markdown>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{smoothText}</div>
        )}

        {/* Show streaming indicator with shimmer effect */}
        {(message.status === "streaming" || (message as any).reasoning) && (
          <Reasoning isStreaming={message.status === "streaming"}>
            <ReasoningTrigger />
            <ReasoningContent>
              {(message as any).reasoning || ""}
            </ReasoningContent>
          </Reasoning>
        )}

        {/* Tool invocations - Convex Agent stores them in parts array */}
        {(() => {
          // Debug: log message parts
          if ((message as any).parts) {
            const toolParts = (message as any).parts.filter((p: any) =>
              p.type?.startsWith("tool-")
            );
            if (toolParts.length > 0) {
              console.log(
                "[CHAT-PANEL] Message has tool parts:",
                toolParts.map((t: any) => t.type)
              );
            }
          }
          return null;
        })()}
        {(message as any).parts?.map((part: any, idx: number) => {
          // Skip non-tool parts
          if (!part.type?.startsWith("tool-")) return null;

          const isInProgress =
            part.state !== "output-available" && part.state !== "done";

          // Debug logging for askQuestion
          if (part.type === "tool-askQuestion") {
            console.log("[CHAT-PANEL] askQuestion tool found in parts:", {
              type: part.type,
              isInProgress,
              state: part.state,
              input: part.input,
              output: part.output,
            });
          }

          // Special handling for askQuestion tool - render suggestions
          if (part.type === "tool-askQuestion") {
            const input = part.input;

            // Only render if the tool has completed (has output)
            // Skip the "input-available" state to avoid duplicates
            if (!part.output || part.state === "input-available") {
              return null;
            }

            // Always render the question text (even after user responds)
            // But hide suggestions after user responds
            return (
              <div key={`part-${idx}`} className="mt-3 space-y-2">
                {/* Render the question text - always visible */}
                {input?.question && (
                  <p className="text-sm font-medium text-foreground mb-2">
                    {input.question}
                  </p>
                )}

                {/* Render suggestions only if user hasn't responded yet */}
                {!hasUserResponseAfter && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {input?.suggestions?.map(
                        (suggestion: string, sugIdx: number) => (
                          <Suggestion
                            key={sugIdx}
                            suggestion={suggestion}
                            onClick={() => onSendMessage(suggestion)}
                          />
                        )
                      )}
                    </div>
                    {input?.allowCustomInput !== false && (
                      <p className="text-xs text-muted-foreground text-center">
                        Or type your own answer below
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          }

          // Special handling for chapter generation
          if (part.type === "tool-saveChapter") {
            const input = part.input;
            return (
              <div key={`part-${idx}`} className="mt-4">
                <Task defaultOpen={false}>
                  <TaskTrigger
                    title={`Chapter ${input?.chapterNumber || "..."}: ${input?.title || "Loading..."}`}
                  />
                  <TaskContent>
                    <TaskItem>
                      <span className="text-xs text-muted-foreground">
                        Word count: {input?.wordCount || "..."} words
                      </span>
                    </TaskItem>
                    <TaskItem>
                      {isInProgress ? (
                        <Shimmer className="text-xs text-muted-foreground">
                          Generating chapter...
                        </Shimmer>
                      ) : (
                        <span className="text-xs text-green-600">
                          ✓ Chapter saved! View in the preview panel
                        </span>
                      )}
                    </TaskItem>
                  </TaskContent>
                </Task>
              </div>
            );
          }

          // Regular tool invocations
          if (isInProgress) {
            const loadingText =
              part.type === "tool-saveStoryIdeas"
                ? "Saving story ideas..."
                : part.type === "tool-saveFoundation"
                  ? "Saving foundation..."
                  : part.type === "tool-saveStructure"
                    ? "Saving structure..."
                    : part.type === "tool-setGenerationMode"
                      ? "Setting generation mode..."
                      : part.type === "tool-saveCheckpoint"
                        ? "Saving progress..."
                        : "Processing...";

            return (
              <div
                key={`part-${idx}`}
                className="mt-2 rounded border bg-background p-2 text-xs"
              >
                <Shimmer className="text-muted-foreground">
                  {loadingText}
                </Shimmer>
              </div>
            );
          }

          return (
            <div
              key={`part-${idx}`}
              className="mt-2 rounded border bg-background p-2 text-xs"
            >
              <div className="font-semibold text-foreground">
                {part.type === "tool-saveStoryIdeas" && "✓ Story Ideas Saved"}
                {part.type === "tool-saveFoundation" && "✓ Foundation Saved"}
                {part.type === "tool-saveStructure" && "✓ Structure Saved"}
                {part.type === "tool-setGenerationMode" &&
                  "✓ Generation Mode Set"}
                {part.type === "tool-saveCheckpoint" && "✓ Progress Saved"}
              </div>
            </div>
          );
        })}
      </MessageContent>

      {/* Question Card - render outside MessageContent for better styling */}
      {message.role === "assistant" &&
        message.metadata?.messageType === "question_card" && (
          <QuestionCard
            question={message.content}
            options={(message.metadata as QuestionCardMetadata).options}
            allowCustomInput={
              (message.metadata as QuestionCardMetadata).allowCustomInput
            }
            multiSelect={(message.metadata as QuestionCardMetadata).multiSelect}
            onSelect={(optionId, customValue) => {
              // Find the selected option label
              const option = (
                message.metadata as QuestionCardMetadata
              ).options.find((opt) => opt.id === optionId);
              const responseText = customValue || option?.label || optionId;
              onSendMessage(responseText);
            }}
          />
        )}

      {/* Question with Suggestions - new format from askQuestion tool */}
      {message.role === "assistant" &&
        message.metadata?.messageType === "question_with_suggestions" &&
        !isLoading &&
        message.status !== "streaming" && (
          <div className="mt-3 space-y-2">
            <Suggestions>
              {(message.metadata as any).suggestions?.map(
                (suggestion: string, idx: number) => (
                  <Suggestion
                    key={idx}
                    suggestion={suggestion}
                    onClick={() => onSendMessage(suggestion)}
                  />
                )
              )}
            </Suggestions>
            {(message.metadata as any).allowCustomInput !== false && (
              <p className="text-xs text-muted-foreground text-center">
                Or type your own answer below
              </p>
            )}
          </div>
        )}

      {/* Approval buttons - only show on last assistant message */}
      {message.role === "assistant" &&
        !isLoading &&
        isLastMessage &&
        message.status !== "streaming" &&
        (smoothText.toLowerCase().includes("approve") ||
          smoothText.toLowerCase().includes("would you like")) && (
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={onApprove} className="h-7 text-xs">
              <Check className="mr-1 h-3 w-3" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              className="h-7 text-xs"
            >
              <X className="mr-1 h-3 w-3" />
              Revise
            </Button>
          </div>
        )}

      {/* Contextual suggestion buttons */}
      {message.role === "assistant" &&
        !isLoading &&
        message.status !== "streaming" &&
        suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((suggestion, idx) => (
              <Button
                key={idx}
                size="sm"
                variant="outline"
                onClick={() => onSendMessage(suggestion.message)}
                className="h-7 text-xs border-dashed hover:border-solid"
                disabled={isLoading}
              >
                {suggestion.icon && (
                  <span className="mr-1">{suggestion.icon}</span>
                )}
                {suggestion.label}
              </Button>
            ))}
          </div>
        )}
    </Message>
  );
}

export function ChatPanel({
  messages,
  input,
  setInput,
  onSubmit,
  isLoading,
  error,
  onApprove,
  onReject,
  onSendMessage,
  loadMore,
  canLoadMore,
  isLoadingMore,
  generationMode = "manual",
  onGenerationModeChange,
}: ChatPanelProps) {
  return (
    <div className="flex h-full w-full flex-col border-r bg-background">
      {/* Header - fixed height */}
      <div className="shrink-0 border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">BookGen AI</h2>
            <p className="text-xs text-muted-foreground">
              Your AI writing assistant
            </p>
          </div>

          {/* Generation Mode Toggle */}
          {onGenerationModeChange && (
            <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
              <Button
                variant={generationMode === "auto" ? "default" : "ghost"}
                size="sm"
                onClick={() => onGenerationModeChange("auto")}
                className="h-7 gap-1.5 text-xs"
              >
                <Zap className="h-3.5 w-3.5" />
                Auto
              </Button>
              <Button
                variant={generationMode === "manual" ? "default" : "ghost"}
                size="sm"
                onClick={() => onGenerationModeChange("manual")}
                className="h-7 gap-1.5 text-xs"
              >
                <Hand className="h-3.5 w-3.5" />
                Manual
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable conversation area */}
      <div className="flex min-h-0 flex-1 flex-col">
        <Conversation className="h-[calc(100vh-350px)] overflow-auto">
          <ConversationContent className="gap-4 p-4 h-[calc(100vh-350px)] overflow-auto">
            {/* Show centered spinner during initial load */}
            {messages.length === 0 && isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Thinking abouts new book ideas...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Load More Button - only show when messages exist */}
                {messages.length > 0 && canLoadMore && loadMore && (
                  <div className="flex justify-center pb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className="h-8 text-xs"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load older messages"
                      )}
                    </Button>
                  </div>
                )}

                {messages.map((message: any, index: number) => {
                  // Check if there's a user message after this assistant message
                  const hasUserResponseAfter =
                    message.role === "assistant" &&
                    index < messages.length - 1 &&
                    messages[index + 1]?.role === "user";

                  return (
                    <MessageWithSmoothing
                      key={message.id}
                      message={message}
                      isLoading={isLoading}
                      onApprove={onApprove}
                      onReject={onReject}
                      onSendMessage={onSendMessage}
                      isLastMessage={index === messages.length - 1}
                      hasUserResponseAfter={hasUserResponseAfter}
                    />
                  );
                })}

                {error && (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-xs text-destructive">
                    <p className="font-semibold">Error</p>
                    <p>{error.message}</p>
                  </div>
                )}
              </>
            )}
          </ConversationContent>

          <ConversationScrollButton />
        </Conversation>

        {/* Input area - fixed height */}
        <div className="shrink-0 border-t p-4">
          <PromptInput onSubmit={onSubmit}>
            <PromptInputBody>
              <PromptInputTextarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me what to write next..."
                className="min-h-[60px] text-sm"
              />
            </PromptInputBody>
            <PromptInputFooter className="flex justify-end">
              <PromptInputSubmit
                disabled={isLoading || !input.trim()}
                status={isLoading ? "streaming" : undefined}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
