import { createOpenAI } from '@ai-sdk/openai';
import { wrapLanguageModel, defaultSettingsMiddleware } from 'ai';

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
 * - anthropic/claude-sonnet-4
 * - openai/gpt-4o
 * - xai/grok-4
 * - moonshotai/kimi-k2-thinking
 */

// Create AI Gateway client
const aiGateway = createOpenAI({
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  apiKey: process.env.AI_GATEWAY_API_KEY || '',
});

// Provider registry optimized for book writing
export const models = {
  // For book generation - uses Kimi K2 Thinking
  // Can execute 200-300 sequential tool calls - perfect for entire book workflow!
  bookGeneration: {
    primary: aiGateway('moonshotai/kimi-k2-thinking'), 
    fallback: [
      aiGateway('anthropic/claude-sonnet-4'), // Strong writing abilities
      aiGateway('openai/gpt-4o'), // General purpose fallback
    ],
  },
  // For quick tasks (outlines, summaries)
  fast: {
    primary: aiGateway('openai/gpt-4o-mini'),
    fallback: [
      aiGateway('google/gemini-2.0-flash'),
      aiGateway('anthropic/claude-haiku-4'),
    ],
  },
  // For complex reasoning (if Kimi fails)
  powerful: {
    primary: aiGateway('anthropic/claude-opus-4'),
    fallback: [
      aiGateway('openai/o1'),
      aiGateway('google/gemini-2.5-pro'),
    ],
  },
};

// Get model with automatic fallback and retry
export function getModelWithFallback(
  tier: 'bookGeneration' | 'fast' | 'powerful'
) {
  const config = models[tier];

  return wrapLanguageModel({
    model: config.primary,
    middleware: [
      defaultSettingsMiddleware({
        settings: {
          maxRetries: 2, // AI SDK built-in retry
          maxOutputTokens: 8000, // Longer responses for book content
        },
      }),
      // Custom fallback middleware
      {
        wrapGenerate: async ({ doGenerate, params }) => {
          try {
            return await doGenerate();
          } catch (error) {
            console.error(`Primary model failed, trying fallbacks...`);
            // Try each fallback
            for (const fallbackModel of config.fallback) {
              try {
                console.log(`Trying fallback model...`);
                // @ts-expect-error - fallback model doesn't have doGenerate directly
                return await fallbackModel.doGenerate(params);
              } catch (fallbackError) {
                console.error(
                  `Fallback failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`
                );
              }
            }
            throw error; // All models failed
          }
        },
        wrapStream: async ({ doStream, params }) => {
          try {
            return await doStream();
          } catch (error) {
            console.error(`Primary model stream failed, trying fallbacks...`);
            // Try each fallback
            for (const fallbackModel of config.fallback) {
              try {
                console.log(`Trying fallback model for streaming...`);
                // @ts-expect-error - fallback model doesn't have doStream directly
                return await fallbackModel.doStream(params);
              } catch (fallbackError) {
                console.error(
                  `Fallback stream failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`
                );
              }
            }
            throw error; // All models failed
          }
        },
      },
    ],
  });
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

