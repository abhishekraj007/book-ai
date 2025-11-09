import { gateway } from "@ai-sdk/gateway";

/**
 * Vercel AI Gateway Configuration
 *
 * AI Gateway provides:
 * - Unified API for all providers (no separate API keys needed!)
 * - Automatic retries and fallbacks
 * - Usage monitoring and spend limits
 * - 0% markup on token costs
 *
 * Model format: "provider/model-name"
 * Examples:
 * - openai/gpt-4o
 * - anthropic/claude-3-5-sonnet-20241022
 * - google/gemini-2.0-flash-exp
 *
 * Docs: https://vercel.com/docs/ai-gateway/getting-started
 * Available models: https://vercel.com/docs/ai-gateway/models-and-providers
 */

// AI Gateway client - automatically uses AI_GATEWAY_API_KEY env var

// Provider registry optimized for book writing
// Using standard model names supported by AI Gateway
export const models = {
  // For book generation - using GPT-4o for reliability
  // Note: Kimi K2 (moonshot/kimi-k2-thinking) will be added once available
  bookGeneration: {
    primary: gateway("openai/gpt-4o"), // OpenAI GPT-4o
    fallback: [
      gateway("anthropic/claude-3-5-sonnet-20241022"), // Anthropic Claude 3.5 Sonnet
      gateway("openai/gpt-4-turbo"), // GPT-4 Turbo fallback
    ],
  },
  // For quick tasks (outlines, summaries)
  fast: {
    primary: gateway("openai/gpt-4o-mini"),
    fallback: [
      gateway("openai/gpt-3.5-turbo"),
      gateway("anthropic/claude-3-5-haiku-20241022"),
    ],
  },
  // For complex reasoning
  powerful: {
    primary: gateway("anthropic/claude-3-5-sonnet-20241022"),
    fallback: [gateway("openai/gpt-4o"), gateway("openai/gpt-4-turbo")],
  },
};

// Get model with automatic retry (AI Gateway handles reliability at infrastructure level)
export function getModelWithFallback(
  tier: "bookGeneration" | "fast" | "powerful"
) {
  const config = models[tier];

  // Return the primary model directly
  // AI Gateway itself provides automatic retries and fallback at the infrastructure level
  // Settings like temperature and maxOutputTokens can be passed during generation
  return config.primary;
}

// Alternative: Get fallback model if primary fails
export function getFallbackModel(
  tier: "bookGeneration" | "fast" | "powerful",
  fallbackIndex: number = 0
) {
  const config = models[tier];
  const fallbackModel = config.fallback[fallbackIndex];

  if (!fallbackModel) {
    throw new Error(`No fallback model available at index ${fallbackIndex}`);
  }

  return fallbackModel;
}

/**
 * Why Kimi K2 Thinking is Perfect for Book Generation:
 *
 * 1. Agentic Tool Use: Can handle 200-300 sequential tool calls
 *    - Entire book workflow in one agent loop
 *    - Outline → chapters → revisions without interruption
 *
 * 2. Writing Optimized: State-of-the-art on writing benchmarks
 *    - Excellent for long-form content generation
 *    - Maintains consistency across chapters
 *
 * 3. Large Context (262K tokens): Holds full book for consistency
 *    - Can reference all previous chapters
 *    - Ensures plot and character consistency
 *
 * 4. Reasoning Capabilities: Steps through outline → chapters logically
 *    - Plans before writing
 *    - Considers user feedback in revisions
 *
 * 5. Cost Effective: $0.60/M input, $2.50/M output tokens
 *    - More affordable than Claude Opus or GPT-4
 *
 * 6. Vercel AI Gateway Benefits:
 *    - Single API key for all providers
 *    - Automatic retries and fallbacks
 *    - Built-in spend monitoring
 *    - 0% markup on token costs
 *
 * Setup:
 * 1. Get your AI Gateway API key from https://vercel.com/ai
 * 2. Set AI_GATEWAY_API_KEY environment variable in Convex
 * 3. All providers route through https://ai-gateway.vercel.sh/v1
 */
