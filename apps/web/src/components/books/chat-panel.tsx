"use client";

import { BookOpen, Loader2, Zap, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { MessageItem } from "./message-item";

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
                    Thinking about new book ideas...
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
                    <MessageItem
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
