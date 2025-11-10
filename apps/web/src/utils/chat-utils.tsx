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
  const suggestions: ContextualSuggestion[] = [];

  // Chapter review context
  if (
    lowerText.includes("review") ||
    lowerText.includes("meets your vision") ||
    lowerText.includes("changes you'd like")
  ) {
    suggestions.push(
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
      }
    );
  }

  // General chapter content context
  if (
    lowerText.includes("chapter") &&
    (lowerText.includes("complete") ||
      lowerText.includes("finished") ||
      lowerText.includes("ready"))
  ) {
    suggestions.push(
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
      }
    );
  }

  // Outline context
  if (
    lowerText.includes("outline") &&
    (lowerText.includes("proceed") || lowerText.includes("changes"))
  ) {
    suggestions.push(
      {
        label: "Looks good",
        message: "Looks good, continue",
        icon: <Check className="h-3 w-3" />,
      },
      {
        label: "Revise",
        message: "Please revise the outline",
        icon: <RefreshCw className="h-3 w-3" />,
      }
    );
  }

  // Default suggestions for any assistant message asking for feedback
  if (suggestions.length === 0) {
    if (
      lowerText.includes("?") ||
      lowerText.includes("let me know") ||
      lowerText.includes("feedback")
    ) {
      suggestions.push(
        { label: "Looks good", message: "Looks good, continue" },
        { label: "Improve", message: "Please improve this" }
      );
    }
  }

  return suggestions;
}
