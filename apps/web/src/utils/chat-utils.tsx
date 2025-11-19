import { Check, RefreshCw, TrendingUp } from "lucide-react";

export interface ContextualSuggestion {
  label: string;
  message: string;
  icon?: React.ReactNode;
}

/**
 * Get contextual suggestion buttons based on message content
 */
export function getContextualSuggestions(
  text: string
): ContextualSuggestion[] {
  const lowerText = text.toLowerCase();

  // Chapter review context - highest priority
  if (
    lowerText.includes("review") &&
    lowerText.includes("chapter")
  ) {
    return [
      {
        label: "Looks good",
        message: "Looks good, continue",
        icon: <Check className="h-3 w-3" />,
      },
      {
        label: "Rewrite",
        message: "Please rewrite this chapter",
        icon: <RefreshCw className="h-3 w-3" />,
      },
      {
        label: "Improve",
        message: "Please improve this chapter",
        icon: <TrendingUp className="h-3 w-3" />,
      },
    ];
  }

  // General chapter content context
  if (
    lowerText.includes("chapter") &&
    (lowerText.includes("generated") ||
      lowerText.includes("saved") ||
      lowerText.includes("ready"))
  ) {
    return [
      {
        label: "Continue",
        message: "Looks good, continue",
        icon: <Check className="h-3 w-3" />,
      },
      {
        label: "Rewrite",
        message: "Please rewrite this chapter",
        icon: <RefreshCw className="h-3 w-3" />,
      },
      {
        label: "Improve",
        message: "Please improve this chapter",
        icon: <TrendingUp className="h-3 w-3" />,
      },
    ];
  }

  // Outline context
  if (
    lowerText.includes("outline") &&
    (lowerText.includes("proceed") || lowerText.includes("changes"))
  ) {
    return [
      {
        label: "Looks good",
        message: "Looks good, continue",
        icon: <Check className="h-3 w-3" />,
      },
      {
        label: "Revise",
        message: "Please revise the outline",
        icon: <RefreshCw className="h-3 w-3" />,
      },
    ];
  }

  // Default suggestions for any assistant message asking for feedback
  if (
    lowerText.includes("?") ||
    lowerText.includes("let me know") ||
    lowerText.includes("feedback")
  ) {
    return [
      { label: "Looks good", message: "Looks good, continue" },
      { label: "Improve", message: "Please improve this" },
    ];
  }

  return [];
}
