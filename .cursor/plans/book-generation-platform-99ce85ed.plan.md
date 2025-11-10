<!-- 99ce85ed-679f-45c2-abc7-57dd19e0d5ed 69dc70ab-ac59-44bd-a30b-4b942fe300d0 -->
# Fix Preview and Chat Panel UX Issues

## 1. Fix Suggestion Buttons (Chat Panel)

**File**: `apps/web/src/components/books/chat-panel.tsx`

Current issue: Suggestion buttons appear on all assistant messages.

**Solution**: Only show suggestions on the last assistant message.

```typescript
// In getContextualSuggestions or in MessageWithSmoothing component
// Add index check to only show on last message
const isLastMessage = messages[messages.length - 1]?.id === message.id;

// Then in render:
{message.role === "assistant" &&
  !isLoading &&
  message.status !== "streaming" &&
  isLastMessage && // Add this condition
  suggestions.length > 0 && (
    // ... render suggestions
  )}
```

## 2. Make Chapter Tabs Scroll Anchors (Preview Panel)

**File**: `apps/web/src/components/books/preview-panel.tsx`

Current issue: Tabs don't do anything when clicked.

**Solution**:

- Add `id` attributes to each chapter section
- Convert tabs to clickable links that smooth scroll to chapters
- Remove `Tabs` component, use custom navigation
```typescript
// Add refs and scroll handler
const chapterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

const scrollToChapter = (chapterId: string) => {
  chapterRefs.current[chapterId]?.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'start' 
  });
};

// In chapter rendering:
<div 
  ref={(el) => (chapterRefs.current[`chapter-${chapter.chapterNumber}`] = el)}
  id={`chapter-${chapter.chapterNumber}`}
  className="space-y-6"
>
  {/* chapter content */}
</div>

// Replace Tabs with custom navigation:
<div className="flex items-center gap-2 border-b px-6 py-2 overflow-x-auto">
  {chapters.map((chapter) => (
    <button
      key={chapter._id}
      onClick={() => scrollToChapter(`chapter-${chapter.chapterNumber}`)}
      className="px-3 py-1.5 text-xs rounded hover:bg-muted"
    >
      Chapter {chapter.chapterNumber}
    </button>
  ))}
  {/* Same for drafts */}
</div>
```


## 3. Reorder Drafts in Natural Chapter Order (Preview Panel)

**File**: `apps/web/src/components/books/preview-panel.tsx`

Current issue: Drafts appear at the bottom, hard to review in context.

**Solution**: Merge and sort chapters and drafts by chapter number.

```typescript
// Create merged and sorted array
const allChapters = useMemo(() => {
  const approved = chapters.map(ch => ({ ...ch, isDraft: false }));
  const drafts = (draftChapters || []).map(d => ({ ...d, isDraft: true }));
  
  return [...approved, ...drafts].sort((a, b) => 
    a.chapterNumber - b.chapterNumber
  );
}, [chapters, draftChapters]);

// Then render allChapters instead of chapters first, then draftChapters
{allChapters.map((item) => (
  item.isDraft ? (
    // Render draft with approve/reject UI
  ) : (
    // Render regular chapter
  )
))}
```

## 4. Implement View/Edit Mode Toggle (Preview Panel & Header)

**File**: `apps/web/src/components/books/preview-panel.tsx`

Add edit mode state and functionality:

```typescript
// Add to PreviewPanel props
interface PreviewPanelProps {
  book: any;
  chapters: any[];
  isLoading: boolean;
  activeView: "view" | "edit"; // Add this
  onViewChange: (view: "view" | "edit") => void; // Add this
}

// In View mode: Show formatted content (current behavior)
// In Edit mode: Show editable textarea + action buttons

{activeView === "edit" ? (
  <EditableChapter 
    chapter={chapter}
    onSave={handleSaveChapter}
    onRewrite={handleRewriteSection}
  />
) : (
  <div className="prose prose-lg...">
    {/* Current view mode */}
  </div>
)}
```

**File**: `apps/web/src/components/books/editable-chapter.tsx` (NEW)

Create new component for edit mode:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EditableChapterProps {
  chapter: any;
  onSave: (chapterId: string, content: string) => void;
  onRewrite?: (chapterId: string, selection: string) => void;
}

export function EditableChapter({ chapter, onSave, onRewrite }: EditableChapterProps) {
  const [content, setContent] = useState(chapter.content);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  const handleTextSelection = () => {
    const selection = window.getSelection()?.toString();
    if (selection) {
      setSelectedText(selection);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setHasChanges(true);
        }}
        onMouseUp={handleTextSelection}
        className="min-h-[400px] font-serif text-base leading-relaxed"
      />
      
      {/* Action buttons */}
      <div className="flex gap-2">
        {hasChanges && (
          <Button onClick={() => onSave(chapter._id, content)}>
            Save Changes
          </Button>
        )}
        {selectedText && onRewrite && (
          <Button 
            variant="outline"
            onClick={() => onRewrite(chapter._id, selectedText)}
          >
            Rewrite Selection
          </Button>
        )}
      </div>
    </div>
  );
}
```

## 5. Add Chapter Edit Mutations (Backend)

**File**: `packages/backend/convex/features/books/index.ts`

Add public mutation for editing chapter content:

```typescript
export const updateChapterContent = mutation({
  args: {
    chapterId: v.id('chapters'),
    content: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { chapterId, content }) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error('Not authenticated');
    
    const chapter = await ctx.db.get(chapterId);
    if (!chapter) throw new Error('Chapter not found');
    
    const book = await ctx.db.get(chapter.bookId);
    if (!book || book.userId !== user.subject) {
      throw new Error('Not authorized');
    }
    
    // Save as new version
    await ctx.runMutation(internal.features.books.mutations.createChapterVersion, {
      chapterId: chapterId as string,
      content,
      changedBy: 'user',
      changeDescription: 'Manual edit',
    });
    
    return { success: true };
  },
});
```

**File**: `packages/backend/convex/features/books/mutations.ts`

Add helper mutation for creating chapter versions:

```typescript
export const createChapterVersion = internalMutation({
  args: {
    chapterId: v.string(),
    content: v.string(),
    changedBy: v.string(),
    changeDescription: v.string(),
  },
  returns: v.object({ versionId: v.string() }),
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.chapterId as Id<"chapters">);
    if (!chapter) throw new Error("Chapter not found");
    
    const newVersion = chapter.currentVersion + 1;
    
    const versionId = await ctx.db.insert("chapterVersions", {
      chapterId: args.chapterId as Id<"chapters">,
      versionNumber: newVersion,
      content: args.content,
      changedBy: args.changedBy,
      changeDescription: args.changeDescription,
      createdAt: Date.now(),
    });
    
    await ctx.db.patch(args.chapterId as Id<"chapters">, {
      content: args.content,
      currentVersion: newVersion,
      updatedAt: Date.now(),
    });
    
    return { versionId };
  },
});
```

## 6. Wire Up Edit Mode in Page Component

**File**: `apps/web/src/app/books/[id]/page.tsx`

Pass view state to preview panel and handle edit actions:

```typescript
const [activeView, setActiveView] = useState<"view" | "edit">("view");
const updateChapter = useMutation(api.features.books.index.updateChapterContent);

const handleSaveChapter = async (chapterId: string, content: string) => {
  await updateChapter({ 
    chapterId: chapterId as Id<"chapters">, 
    content 
  });
};

// In JSX:
<PreviewPanel 
  book={book} 
  chapters={chapters} 
  isLoading={isLoading}
  activeView={activeView}
  onViewChange={setActiveView}
  onSaveChapter={handleSaveChapter}
/>
```

## Summary

These changes will:

1. Clean up chat by only showing suggestions on the last message
2. Make chapter navigation functional with smooth scrolling
3. Show drafts in context for easier review
4. Enable comprehensive editing with inline editing and contextual tools
5. Improve overall UX and content management workflow

### To-dos

- [ ] Install AI SDK 6 beta packages (@ai-sdk/openai@beta, @ai-sdk/anthropic@beta, @ai-sdk/google@beta, @ai-sdk/react@beta)
- [ ] Create multi-provider configuration with fallback middleware in convex/lib/ai-config.ts
- [ ] Implement Convex schema (books, chapters, chapterVersions, generationSessions tables)
- [ ] Create ToolLoopAgent with approval-required tools (generateOutline, generateChapter)
- [ ] Setup Convex HTTP streaming with data part reconciliation and transient notifications
- [ ] Build useBookGeneration hook with onData callback for approval handling
- [ ] Create v0.app-inspired generation UI with approval cards and transient notifications
- [ ] Implement version control mutations and VersionHistory component
- [ ] Add resume/retry mechanisms using session persistence and initialMessages
- [ ] Implement export functionality for PDF, EPUB, Markdown, HTML, TXT
- [ ] Install @convex-dev/agent package and configure convex.config.ts
- [ ] Create bookAgent.ts with Agent definition and tools
- [ ] Create actions.ts with startGeneration and continueGeneration actions
- [ ] Add getThreadMessages query to queries.ts
- [ ] Add threadId field to books table in schema.ts
- [ ] Refactor use-book-generation.ts to use Convex mutations/queries
- [ ] Delete features/books/http.ts and remove route from http.ts
- [ ] Test end-to-end: create book, generate outline, approve, generate chapter