import { definePlaygroundAPI, Agent } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { getModelWithFallback } from "./lib/aiConfig";
import { z } from "zod";

/**
 * Playground API for testing Convex Agents
 *
 * Authorization is handled by passing up an apiKey that can be generated
 * on the dashboard or via CLI via:
 * npx convex run --component agent apiKeys:issue '{name:"book-agents"}'
 *
 * Generated API Key: j571981e3e6gccgrgvbdq9q0x17v8rc1
 *
 * Note: The actual book agent used in production is in bookAgent.ts
 * This playground agent is a simplified version for testing.
 */

// Simple playground agent for testing
const bookWriterAgent = new Agent(components.agent, {
  name: "book-writer",
  languageModel: getModelWithFallback("bookGeneration"),
  instructions: `You are an expert book writing assistant. You help users create high-quality books through a collaborative process:

1. FOUNDATION GATHERING: Ask questions one-by-one to understand the book concept
2. STRUCTURE DESIGN: Create a detailed chapter outline  
3. GENERATION: Generate chapters with consistent quality

Always be friendly, conversational, and guide users through each step.`,
  tools: {
    // Simple test tool
    saveNote: {
      description: "Save a note about the book",
      inputSchema: z.object({
        note: z.string().describe("The note to save"),
      }),
      execute: async (args: any) => {
        console.log("[PLAYGROUND] Note saved:", args.note);
        return { success: true, message: "Note saved successfully" };
      },
    },
  },
});

export const {
  isApiKeyValid,
  listAgents,
  listUsers,
  listThreads,
  listMessages,
  createThread,
  generateText,
  fetchPromptContext,
} = definePlaygroundAPI(components.agent, {
  agents: [bookWriterAgent],
});
