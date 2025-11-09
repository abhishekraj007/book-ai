# Chat-Based Book Generation Implementation

## Overview

Successfully implemented a **v0.app-inspired chat-based book generation system** that allows users to have a conversational, step-by-step interaction with AI to create books.

## Architecture

### Backend (Convex HTTP Streaming)

**File**: `packages/backend/convex/features/books/http.ts`

- Uses AI SDK 6's `streamText()` for real-time streaming responses
- Implements conversational flow with system prompts guiding the AI
- Provides tools for database operations:
  - `saveOutline` - Saves book outline after approval
  - `saveChapter` - Saves chapters after approval
  - `saveCheckpoint` - Saves progress for resume functionality
- Streams responses using Server-Sent Events (SSE)
- Full CORS support for cross-origin requests

**Key Features:**
- Real-time streaming of AI responses
- Automatic tool calling for database operations
- Context-aware system prompts based on book progress
- Comprehensive logging for debugging

### Frontend (React + AI Elements)

**Files**:
- `apps/web/src/hooks/use-book-generation.ts` - Custom hook for chat management
- `apps/web/src/app/books/[id]/page.tsx` - Chat UI using AI Elements

**Key Features:**
- v0.app-inspired chat interface
- Real-time message streaming
- Quick action buttons (Approve, Reject)
- Suggestion chips for quick start
- Tool invocation display (showing database operations)
- Error handling and loading states
- Responsive layout with scroll-to-bottom behavior

## User Flow

1. **User lands on book generation page**
   - Sees welcome message from AI
   - Gets suggestion chips for quick start

2. **User describes the book they want**
   - e.g., "Create a sci-fi novel about AI discovering ancient human music"

3. **AI proposes a detailed outline**
   - Shows chapter count, titles, descriptions
   - Asks for user approval

4. **User approves or requests changes**
   - Click "Approve" to proceed
   - Click "Revise" to request changes
   - Or type custom feedback

5. **AI generates chapters one by one**
   - Shows each chapter content
   - Waits for approval before next chapter
   - Saves approved chapters to database

6. **Repeat until book is complete**
   - User has full control at each step
   - Can modify, regenerate, or approve content
   - Progress is automatically saved

## Technical Implementation Details

### AI Model Configuration

**File**: `packages/backend/convex/lib/aiConfig.ts`

- Uses Vercel AI Gateway for unified model access
- Primary model: OpenAI GPT-4o (via gateway)
- Fallback models: Claude 3.5 Sonnet, GPT-4 Turbo
- Single `AI_GATEWAY_API_KEY` for all providers
- Automatic retries and fallback at infrastructure level

### Database Schema

**File**: `packages/backend/convex/schema.ts`

Tables:
- `books` - Book metadata, status, current step
- `chapters` - Chapter content, status, version tracking
- `chapterVersions` - Version history for undo/redo
- `generationSessions` - Resume/retry state

### Streaming Response Format

The backend streams responses in text format:
```
0:"Hello, "
0:"I'd be happy "
0:"to help you create "
0:"a book!"
```

The frontend parses this and builds the assistant's message incrementally.

### Tool Calling

When the AI needs to save data, it calls tools:

```json
{
  "toolName": "saveOutline",
  "state": "result",
  "result": {
    "success": true,
    "message": "Outline saved successfully"
  }
}
```

These are displayed in the UI as status cards.

## Benefits of This Approach

1. **User Control**: User approves each major step
2. **Transparency**: User sees exactly what the AI is doing
3. **Flexibility**: Easy to modify or regenerate content
4. **Resume Support**: Can pause and continue later
5. **Version Control**: Full history of changes
6. **Scalability**: Streaming handles large responses efficiently
7. **Reusability**: Convex backend can be reused for native app

## Next Steps for Enhancement

1. **Rich Text Editor**: Add inline editing for approved content
2. **Export Options**: PDF, EPUB, TXT export buttons
3. **Templates**: Pre-built prompts for different book types
4. **Collaboration**: Multi-user book creation
5. **AI Suggestions**: Proactive suggestions for improvement
6. **Analytics**: Track generation progress and time
7. **Cost Tracking**: Monitor API usage and credits

## Testing

To test the implementation:

1. **Start the development server**:
   ```bash
   # Terminal 1: Convex backend
   cd packages/backend && npx convex dev

   # Terminal 2: Web frontend
   cd apps/web && pnpm dev
   ```

2. **Create a new book**:
   - Go to http://localhost:3006/dashboard
   - Use the "BookPrompt" component to describe a book
   - System will navigate to `/books/[id]`

3. **Interact with the AI**:
   - Type messages or click suggestion chips
   - Approve/reject AI proposals
   - Watch tool invocations in real-time
   - Check Convex dashboard for saved data

4. **Check logs**:
   - **Frontend**: Browser console for client-side logs
   - **Backend**: Convex dashboard logs for server-side logs
   - All important steps are logged with `[STEP]`, `[TOOL]`, `[CHUNK]` prefixes

## Troubleshooting

### Issue: Streaming not working
- Check `NEXT_PUBLIC_CONVEX_SITE_URL` is set correctly
- Verify AI Gateway API key is configured
- Check CORS headers in responses

### Issue: Tool calls not executing
- Check Convex mutations exist and are properly registered
- Verify `inputSchema` matches tool parameters
- Check database schema has required fields

### Issue: Messages not displaying
- Check message format matches expected structure
- Verify `from` prop is either "user" or "assistant"
- Check for TypeScript errors in browser console

## Environment Variables

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
```

**Backend** (`packages/backend/.env.local`):
```bash
AI_GATEWAY_API_KEY=your_ai_gateway_key
```

## Summary

This implementation provides a solid foundation for a chat-based book generation platform inspired by v0.app. The conversational interface makes the complex process of book creation feel natural and intuitive, while the approval workflow ensures users maintain full control over the final product.

The use of AI SDK 6, Convex HTTP streaming, and AI Elements components creates a modern, performant, and user-friendly experience that can easily be extended with additional features.

