# Agent Approval Workflow Issue

## Current Problem

The book generation is completing immediately without executing the agentic workflow or waiting for user approvals. The HTTP endpoint logs show:

1. Initialization
2. Book status: generating
3. Book status: completed (immediately!)
4. Generation completed

## Root Cause

`ToolLoopAgent.generate()` with `needsApproval` tools **does not work as expected** in our current implementation:

### What We Expected
- Agent starts generating
- When a tool with `needsApproval: true` is called, the agent pauses
- Approval request is streamed to the client
- User approves/rejects
- Agent continues with next step
- Repeat until book is complete

### What Actually Happens
- `agent.generate()` is called with a prompt
- The agent executes **synchronously** without streaming intermediate steps
- Tools with `needsApproval` are either:
  - Skipped entirely (most likely)
  - Executed without approval (unlikely)
- The function returns immediately with a final result
- No interactive approval workflow occurs

## Technical Details

### ToolLoopAgent Limitations
```typescript
const result = await agent.generate({ prompt: userPrompt });
// ^ This is a BLOCKING call that returns AFTER completion
// It does NOT:
// - Stream intermediate results
// - Pause for approvals
// - Provide callbacks for tool execution
// - Allow interactive intervention
```

### The `needsApproval` Flag
The `needsApproval` flag on tools is designed for **streaming contexts** where:
- The agent's execution is streamed chunk-by-chunk
- Tool calls are emitted as they happen
- The system waits for user input before executing
- The agent then continues with the approval decision

But `agent.generate()` is **not a streaming API** - it's a fire-and-forget execution.

## Solutions

### Option 1: Use StreamText with Manual Tool Loop (Recommended)

Instead of `ToolLoopAgent`, use `streamText` with manual tool loop management:

```typescript
import { streamText } from "ai";

const stream = streamText({
  model: getModelWithFallback("bookGeneration"),
  messages: initialMessages,
  tools: {
    generateOutline: {
      description: "...",
      parameters: z.object({ ... }),
      // No needsApproval here - we handle it manually
    },
  },
  onChunk: async ({ chunk }) => {
    if (chunk.type === "tool-call") {
      // Stream approval request to client
      writer.write({
        type: "tool-approval",
        id: `approval-${chunk.toolCallId}`,
        data: {
          toolName: chunk.toolName,
          args: chunk.args,
          toolCallId: chunk.toolCallId,
        },
      });
      
      // WAIT for user approval from another endpoint/channel
      // This requires bidirectional communication
    }
  }
});
```

**Challenges:**
- Requires bidirectional communication (WebSocket or polling)
- More complex state management
- Manual tool loop implementation

### Option 2: Two-Step Generation Process

Instead of real-time approval, use a proposal → approval → execution flow:

1. **Step 1: Generate Proposal**
   ```typescript
   // Agent generates outline without executing tools
   const outlineProposal = await agent.generate({
     prompt: "Generate a book outline for: " + title,
     maxSteps: 1, // Stop after first response
   });
   
   // Stream proposal to client
   writer.write({
     type: "data-outline-proposal",
     data: outlineProposal,
   });
   ```

2. **Step 2: User Approves**
   - Frontend displays proposal
   - User clicks "Approve" button
   - Frontend sends approval to backend

3. **Step 3: Execute Approved Step**
   ```typescript
   // Execute the approved outline
   await ctx.runMutation(internal.books.mutations.saveOutline, {
     ...approvedOutline
   });
   
   // Move to next step (chapter generation)
   ```

**Advantages:**
- Simpler implementation
- Works with current tech stack
- Clear separation of proposal and execution

**Disadvantages:**
- Not a true "agentic" workflow
- More back-and-forth HTTP calls

### Option 3: Remove Approval Workflow (Fastest Implementation)

Generate the entire book in one go without approvals:

```typescript
const agent = new ToolLoopAgent({
  model: getModelWithFallback("bookGeneration"),
  tools: {
    generateOutline: {
      needsApproval: false, // No approval
      // ... tool implementation
    },
  },
});

const result = await agent.generate({ prompt: userPrompt });
```

**Advantages:**
- Works with current `ToolLoopAgent` implementation
- Kimi K2 Thinking can handle 200-300 sequential tool calls
- Simple to implement

**Disadvantages:**
- No user control during generation
- All-or-nothing approach

## Recommended Approach

**Option 2 (Two-Step Process)** is the best balance of:
- User control and approval workflow
- Implementation complexity
- Compatibility with current stack

### Implementation Plan

1. **Step-by-step generation endpoints:**
   - `/book/generate-outline` - Proposes outline
   - `/book/approve-outline` - Saves outline and starts chapter 1
   - `/book/generate-chapter` - Proposes chapter content
   - `/book/approve-chapter` - Saves chapter and moves to next

2. **Frontend flow:**
   - Display proposal cards
   - User reviews and approves
   - Progress to next step
   - Show completed sections

3. **Database tracking:**
   - Store current generation step in `books.currentStep`
   - Track proposals in `generationSessions`
   - Enable resume from any step

## Next Steps

1. Choose approach (recommend Option 2)
2. Implement step-by-step generation endpoints
3. Update frontend to handle proposals
4. Test approval workflow
5. Add resume/retry support

## Testing the Current Implementation

To see what's actually happening, check the Convex logs:
1. Navigate to: https://dashboard.convex.dev/deployment/outstanding-mink-147/logs
2. Trigger a book generation
3. Look for our console.log statements:
   - `=== BOOK GENERATION STARTED ===`
   - `[TOOL EXECUTE] generateOutline`
   - etc.

This will show us if the agent is calling tools or not.

