"use client";

import { Check, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="flex w-[380px] flex-col border-r bg-background">
      {messages.length === 0 && (
        <div className="space-y-2 p-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-left text-xs"
            onClick={() => onSendMessage("Start a new sci-fi novel")}
          >
            "Start a new sci-fi novel"
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-left text-xs"
            onClick={() =>
              onSendMessage("Write a children's story about a brave squirrel")
            }
          >
            "Write a children's story about a brave squirrel"
          </Button>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Conversation className="flex-1">
          <ConversationContent className="gap-4 p-4">
            {messages.map((message: any) => (
              <Message
                key={message.id}
                from={message.role}
                className={cn(
                  "max-w-full",
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
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {message.toolInvocations?.map((tool: any) => (
                    <div
                      key={tool.toolCallId}
                      className="mt-2 rounded border bg-background p-2 text-xs"
                    >
                      <div className="font-semibold text-foreground">
                        {tool.toolName === "saveOutline" && "✓ Outline Saved"}
                        {tool.toolName === "saveChapter" && "✓ Chapter Saved"}
                        {tool.toolName === "saveCheckpoint" &&
                          "✓ Progress Saved"}
                      </div>
                    </div>
                  ))}
                </MessageContent>

                {message.role === "assistant" &&
                  !isLoading &&
                  message.content.toLowerCase().includes("approve") && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        onClick={onApprove}
                        className="h-7 text-xs"
                      >
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
              </Message>
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

        <div className="border-t p-4">
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
