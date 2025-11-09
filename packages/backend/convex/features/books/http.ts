import { httpAction } from '../../_generated/server';
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { createBookAgent } from './agent';
import { internal } from '../../_generated/api';
import { Id } from '../../_generated/dataModel';

/**
 * HTTP Action for Book Generation with AI SDK 6 Streaming
 * 
 * Features:
 * - Data Part Reconciliation: Same ID updates existing parts
 * - Transient Notifications: Ephemeral status updates
 * - Resume Support: Loads conversation history from session
 * - Tool Approval: Built-in approval workflow via needsApproval
 */
export const handleBookGeneration = httpAction(async (ctx, req) => {
  try {
    const body = await req.json();
    const { bookId, messages = [], userId } = body;

    if (!bookId) {
      return new Response(JSON.stringify({ error: 'bookId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify book exists and user has access
    const book = await ctx.runQuery(internal.features.books.queries.getBookContext, {
      bookId,
      includeChapters: false,
    });

    if (!book) {
      return new Response(JSON.stringify({ error: 'Book not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load generation session for resume support
    const session = await ctx.runQuery(
      internal.features.books.queries.getGenerationSession,
      { bookId }
    );

    // Use saved messages if resuming, otherwise use provided messages
    const initialMessages = session?.messages?.length > 0 
      ? session.messages 
      : messages;

    // Create UI message stream with data part reconciliation
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        try {
          // 1. Send start notification (transient)
          writer.write({
            type: 'data-notification',
            data: {
              message: 'Initializing book generation...',
              level: 'info',
            },
            transient: true, // Not saved to message history
          });

          // 2. Send initial book status (will be updated via reconciliation)
          writer.write({
            type: 'data-book-status',
            id: `book-${bookId}`, // Same ID = reconciliation
            data: {
              bookId,
              status: 'generating',
              progress: 0,
              currentStep: book.book.currentStep,
            },
          });

          // 3. Create and run the agent
          const agent = createBookAgent(ctx, bookId);

          // Generate with the agent
          const result = await agent.generate({
            messages: initialMessages,
          });

          // 4. Save conversation history for resume
          await ctx.runMutation(
            internal.features.books.mutations.saveConversationHistory,
            {
              bookId,
              messages: result.messages,
            }
          );

          // 5. Update book status (reconciliation)
          writer.write({
            type: 'data-book-status',
            id: `book-${bookId}`, // Same ID updates existing part
            data: {
              bookId,
              status: 'completed',
              progress: 100,
              currentStep: 'completed',
            },
          });

          // 6. Send completion notification (transient)
          writer.write({
            type: 'data-notification',
            data: {
              message: 'Book generation completed!',
              level: 'info',
            },
            transient: true,
          });

          // 7. Merge agent stream (includes tool calls, approvals, text)
          writer.merge(
            result.toUIMessageStream({
              sendStart: false, // We already sent start
            })
          );
        } catch (error) {
          // Mark generation as failed
          await ctx.runMutation(
            internal.features.books.mutations.markGenerationFailed,
            {
              bookId,
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            }
          );

          // Send error notification
          writer.write({
            type: 'data-notification',
            data: {
              message: error instanceof Error ? error.message : 'Generation failed',
              level: 'error',
            },
            transient: true,
          });

          // Update book status to failed
          writer.write({
            type: 'data-book-status',
            id: `book-${bookId}`,
            data: {
              bookId,
              status: 'failed',
              progress: 0,
              currentStep: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          });

          throw error;
        }
      },
    });

    // Return streaming response
    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error('Book generation error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Data Part Types for Type-Safe Streaming:
 * 
 * 1. data-notification (transient):
 *    - Ephemeral status updates
 *    - Not saved to message history
 *    - Only available in onData callback
 * 
 * 2. data-book-status (persistent):
 *    - Book-level status updates
 *    - Reconciliation via same ID
 *    - Saved to message history
 * 
 * 3. data-chapter-status (persistent):
 *    - Chapter-level progress
 *    - Reconciliation via same ID
 *    - Shows loading → completed states
 * 
 * 4. tool-approval-request:
 *    - Built-in by AI SDK for needsApproval tools
 *    - Automatically handled by useChat
 */

