"use client";

import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSmoothText } from "@convex-dev/agent/react";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  Task,
  TaskTrigger,
  TaskContent,
  TaskItem,
} from "@/components/ai-elements/task";
import { cn } from "@/lib/utils";
import { getContextualSuggestions } from "@/utils/chat-utils";
import { Markdown } from "@/components/ui/markdown";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";

interface MessageItemProps {
  message: any;
  isLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSendMessage: (message: string) => void;
  isLastMessage: boolean;
  hasUserResponseAfter: boolean;
}

/**
 * Message component with text smoothing for streaming responses
 * This creates the v0.app-style word-by-word streaming effect
 */
export function MessageItem({
  message,
  isLoading,
  onApprove,
  onReject,
  onSendMessage,
  isLastMessage,
  hasUserResponseAfter,
}: MessageItemProps) {
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
            : "bg-muted/30"
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

        {/* Show shimmer with contextual message when agent is actively working */}
        {message.status === "streaming" && (
          <div className="mt-2">
            <Shimmer>
              {(() => {
                const parts = (message as any).parts || [];

                // Build contextual message from parts
                let stepCount = 0;
                for (const part of parts) {
                  if (part.type === "step-start") {
                    stepCount++;

                    // Look ahead to see if there's a tool call coming
                    const nextPartIndex = parts.indexOf(part) + 1;
                    const nextPart = parts[nextPartIndex];

                    if (nextPart?.type?.startsWith("tool-")) {
                      // We have a tool call - show specific action
                      const toolType = nextPart.type.replace("tool-", "");
                      const toolMessages: Record<string, string> = {
                        askQuestion: "Preparing your next question...",
                        saveFoundation: "Saving book foundation...",
                        saveStructure: "Creating book structure...",
                        generateBookTitle: "Generating book title...",
                        setGenerationMode: "Setting generation mode...",
                        saveChapter: "Writing chapter content...",
                        saveStoryIdeas: "Creating story ideas...",
                        updateBookMetadata: "Updating book details...",
                        saveCheckpoint: "Saving progress...",
                      };

                      return (
                        toolMessages[toolType] || `Processing ${toolType}...`
                      );
                    } else {
                      // Check if agent is thinking (has thoughts token count)
                      const hasThoughts =
                        part.callProviderMetadata?.google?.usageMetadata
                          ?.thoughtsTokenCount > 0;

                      if (hasThoughts) {
                        return "Thinking...";
                      }
                    }
                  }
                }

                // Default message
                return stepCount > 0 ? "Generating..." : "Thinking...";
              })()}
            </Shimmer>
          </div>
        )}

        {(message as any).parts?.map((part: any, idx: number) => {
          // Skip non-tool parts
          if (!part.type?.startsWith("tool-")) return null;

          const isInProgress =
            part.state !== "output-available" && part.state !== "done";

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
