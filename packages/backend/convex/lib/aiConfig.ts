import { gateway } from "@ai-sdk/gateway";

// Provider registry optimized for book writing
// Using standard model names supported by AI Gateway
export const models = {
  // For book generation - using GPT-4o for reliability
  // Note: Kimi K2 (moonshot/kimi-k2-thinking) will be added once available
  bookGeneration: {
    primary: gateway("moonshotai/kimi-k2-thinking"), // OpenAI GPT-4o
    fallback: [
      gateway("anthropic/claude-sonnet-4.5"), // Anthropic Claude 3.5 Sonnet
      gateway("google/gemini-2.5-pro"), // GPT-4 Turbo fallback
      gateway("openai/gpt-4o-mini"),
    ],
  },
  // bookGeneration: {
  //   primary: gateway("openai/gpt-4o"), // OpenAI GPT-4o
  //   fallback: [
  //     gateway("anthropic/claude-3-5-sonnet-20241022"), // Anthropic Claude 3.5 Sonnet
  //     gateway("openai/gpt-4-turbo"), // GPT-4 Turbo fallback
  //   ],
  // },
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
    primary: gateway("anthropic/claude-sonnet-4.5"),
    fallback: [gateway("openai/gpt-5-nano"), gateway("openai/gpt-4-turbo")],
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
