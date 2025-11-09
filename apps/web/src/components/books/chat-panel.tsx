"use client";

import {
  Check,
  X,
  BookOpen,
  Sparkles,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSmoothText } from "@convex-dev/agent/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";

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
}

/**
 * Get contextual suggestion buttons based on message content
 */
function getContextualSuggestions(
  text: string
): Array<{ label: string; message: string; icon?: React.ReactNode }> {
  const lowerText = text.toLowerCase();
  const suggestions: Array<{
    label: string;
    message: string;
    icon?: React.ReactNode;
  }> = [];

  // Chapter review context
  if (
    lowerText.includes("review") ||
    lowerText.includes("meets your vision") ||
    lowerText.includes("changes you'd like")
  ) {
    suggestions.push(
      {
        label: "Looks good",
        message: "Looks good, continue",
        icon: <Check className="h-3 w-3" />,
      },
      {
        label: "Rewrite",
        message: "Please rewrite this chapter",
        icon: <RefreshCw className="h-3 w-3" />,
      },
      {
        label: "Improve",
        message: "Please improve this chapter",
        icon: <TrendingUp className="h-3 w-3" />,
      }
    );
  }

  // General chapter content context
  if (
    lowerText.includes("chapter") &&
    (lowerText.includes("complete") ||
      lowerText.includes("finished") ||
      lowerText.includes("ready"))
  ) {
    suggestions.push(
      {
        label: "Continue",
        message: "Looks good, continue",
        icon: <Check className="h-3 w-3" />,
      },
      {
        label: "Rewrite",
        message: "Please rewrite this chapter",
        icon: <RefreshCw className="h-3 w-3" />,
      },
      {
        label: "Improve",
        message: "Please improve this chapter",
        icon: <TrendingUp className="h-3 w-3" />,
      }
    );
  }

  // Outline context
  if (
    lowerText.includes("outline") &&
    (lowerText.includes("proceed") || lowerText.includes("changes"))
  ) {
    suggestions.push(
      {
        label: "Looks good",
        message: "Looks good, continue",
        icon: <Check className="h-3 w-3" />,
      },
      {
        label: "Revise",
        message: "Please revise the outline",
        icon: <RefreshCw className="h-3 w-3" />,
      }
    );
  }

  // Default suggestions for any assistant message asking for feedback
  if (suggestions.length === 0) {
    if (
      lowerText.includes("?") ||
      lowerText.includes("let me know") ||
      lowerText.includes("feedback")
    ) {
      suggestions.push(
        { label: "Looks good", message: "Looks good, continue" },
        { label: "Improve", message: "Please improve this" }
      );
    }
  }

  return suggestions;
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
}: {
  message: any;
  isLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSendMessage: (message: string) => void;
}) {
  // Use smooth text for streaming messages
  const [smoothText] = useSmoothText(message.text || message.content || "", {
    startStreaming: message.status === "streaming",
  });

  // Get contextual suggestions for this message
  const suggestions =
    message.role === "assistant" && !isLoading && message.status !== "streaming"
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
        {/* Render smoothed text */}
        <div className="whitespace-pre-wrap">{smoothText}</div>

        {/* Show streaming indicator */}
        {message.status === "streaming" && (
          <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-current" />
        )}

        {/* Tool invocations */}
        {message.toolInvocations?.map((tool: any) => (
          <div
            key={tool.toolCallId}
            className="mt-2 rounded border bg-background p-2 text-xs"
          >
            <div className="font-semibold text-foreground">
              {tool.toolName === "saveOutline" && "✓ Outline Saved"}
              {tool.toolName === "saveChapter" && "✓ Chapter Saved"}
              {tool.toolName === "saveCheckpoint" && "✓ Progress Saved"}
            </div>
          </div>
        ))}
      </MessageContent>

      {/* Approval buttons */}
      {message.role === "assistant" &&
        !isLoading &&
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
}: ChatPanelProps) {
  return (
    <div className="flex h-full w-[380px] flex-col border-r bg-background">
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
        </div>
      </div>

      {/* Scrollable conversation area */}
      <div className="flex min-h-0 flex-1 flex-col">
        <Conversation className="h-[calc(100vh-350px)] overflow-auto">
          <ConversationContent className="gap-4 p-4 h-[calc(100vh-350px)] overflow-auto">
            {messages.map((message: any) => (
              <MessageWithSmoothing
                key={message.id}
                message={message}
                isLoading={isLoading}
                onApprove={onApprove}
                onReject={onReject}
                onSendMessage={onSendMessage}
              />
            ))}

            {error && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-xs text-destructive">
                <p className="font-semibold">Error</p>
                <p>{error.message}</p>
              </div>
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
