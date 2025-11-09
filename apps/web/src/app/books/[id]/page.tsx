"use client";

import { use } from "react";
import { useBookGeneration } from "@/hooks/use-book-generation";
import { ResumeBanner } from "@/components/resume-banner";
import { ExportMenu } from "@/components/export-menu";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import {
  Confirmation,
  ConfirmationActions,
  ConfirmationTitle,
  ConfirmationRequest,
} from "@/components/ai-elements/confirmation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Check,
  Loader2,
  X,
  AlertCircle,
  Info,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Id } from "@book-ai/backend/convex/_generated/dataModel";

/**
 * Book Generation Page - v0.app-inspired UI
 *
 * Features:
 * - Real-time streaming updates
 * - Approval workflow with modal cards
 * - Transient notifications (toast-like)
 * - Chapter progress tracking
 * - Markdown content rendering
 */
export default function BookGenerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const bookId = id as Id<"books">;

  const {
    messages,
    isLoading,
    generationState,
    pendingApproval,
    approve,
    reject,
    notifications,
    dismissNotification,
    reload,
  } = useBookGeneration(bookId);

  // Extract chapter statuses from messages
  const chapterStatuses =
    messages?.flatMap(
      (msg) =>
        msg.parts
          ?.filter((p) => p.type === "data-chapter-status")
          .map((p) => p.data) || []
    ) || [];

  return (
    <div className="flex h-screen bg-background">
      {/* ========================================================================
          LEFT SIDEBAR - Chapter Navigation
          ======================================================================== */}
      <aside className="w-80 border-r border-border bg-card">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Chapters</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your book progress
          </p>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto">
          {chapterStatuses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">Preparing book outline...</p>
            </div>
          )}

          {chapterStatuses.map((chapter, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-accent/50 transition-colors"
            >
              <div className="flex-shrink-0">
                {chapter.status === "loading" && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                )}
                {chapter.status === "completed" && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {chapter.status === "error" && (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  Chapter {chapter.chapterNumber}
                  {chapter.title && `: ${chapter.title}`}
                </p>
                {chapter.status === "loading" && (
                  <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${chapter.progress}%` }}
                    />
                  </div>
                )}
                {chapter.wordCount && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {chapter.wordCount.toLocaleString()} words
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ========================================================================
          MAIN CONTENT - Generation Stream
          ======================================================================== */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header with Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/books")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Books
            </Button>
            <ExportMenu bookId={bookId} />
          </div>

          {/* Resume Banner */}
          <ResumeBanner bookId={bookId} onResume={() => reload()} />

          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-foreground">
                {generationState.currentStep === "idle" &&
                  "Starting Generation..."}
                {generationState.currentStep === "outline_complete" &&
                  "Outline Created"}
                {generationState.currentStep.startsWith("chapter_") &&
                  `Generating ${generationState.currentStep.replace("_", " ")}`}
                {generationState.currentStep === "completed" &&
                  "Book Complete!"}
              </h1>
              {generationState.isGenerating && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
            </div>

            {generationState.progress > 0 && (
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${generationState.progress}%` }}
                />
              </div>
            )}
          </div>

          {/* AI Elements Conversation */}
          <Conversation>
            <ConversationContent>
              {messages?.map((msg) => (
                <div key={msg.id}>
                  {/* Text Messages */}
                  {msg.parts
                    ?.filter((p) => p.type === "text")
                    .map((part, idx) => (
                      <Message key={idx} from={msg.role}>
                        <MessageContent>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {part.text}
                          </div>
                        </MessageContent>
                      </Message>
                    ))}

                  {/* Outline Preview */}
                  {msg.parts
                    ?.filter((p) => p.type === "data-outline")
                    .map((part, idx) => (
                      <Card key={idx} className="border-primary/20 my-4">
                        <CardHeader>
                          <CardTitle>Proposed Book Outline</CardTitle>
                          <CardDescription>
                            {part.data.synopsis}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {part.data.chapters?.map((ch) => (
                              <div
                                key={ch.number}
                                className="flex items-start gap-2"
                              >
                                <span className="text-sm font-medium text-muted-foreground">
                                  {ch.number}.
                                </span>
                                <div>
                                  <p className="text-sm font-medium">
                                    {ch.title}
                                  </p>
                                  {ch.synopsis && (
                                    <p className="text-xs text-muted-foreground">
                                      {ch.synopsis}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ))}

              {/* Loading State with AI Elements Loader */}
              {isLoading && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>
      </main>

      {/* ========================================================================
          TRANSIENT NOTIFICATIONS (Toast-like)
          ======================================================================== */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notif) => (
          <Card
            key={notif.id}
            className={`
              min-w-[300px] shadow-lg border-l-4 animate-in slide-in-from-right
              ${notif.level === "info" && "border-l-blue-500"}
              ${notif.level === "success" && "border-l-green-500"}
              ${notif.level === "warning" && "border-l-yellow-500"}
              ${notif.level === "error" && "border-l-red-500"}
            `}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {notif.level === "info" && (
                    <Info className="h-5 w-5 text-blue-500" />
                  )}
                  {notif.level === "success" && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {notif.level === "warning" && (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  {notif.level === "error" && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <p className="text-sm text-foreground flex-1">
                  {notif.message}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => dismissNotification(notif.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ========================================================================
          APPROVAL MODAL using AI Elements Confirmation
          ======================================================================== */}
      {pendingApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Confirmation state="approval-requested">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <ConfirmationTitle className="text-lg font-semibold">
                  Approval Required
                </ConfirmationTitle>
                <CardDescription>
                  The AI wants to{" "}
                  {pendingApproval.toolName
                    .replace(/([A-Z])/g, " $1")
                    .toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Show tool arguments in a readable format */}
                  <ConfirmationRequest>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm text-foreground whitespace-pre-wrap">
                        {JSON.stringify(pendingApproval.args, null, 2)}
                      </pre>
                    </div>
                  </ConfirmationRequest>

                  {/* Approval Actions */}
                  <ConfirmationActions className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => reject(pendingApproval.toolCallId)}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => approve(pendingApproval.toolCallId)}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                  </ConfirmationActions>
                </div>
              </CardContent>
            </Card>
          </Confirmation>
        </div>
      )}
    </div>
  );
}
