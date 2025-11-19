"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { QuestionOption } from "@/types/question-card";

interface QuestionCardProps {
  question: string;
  options: QuestionOption[];
  onSelect: (optionId: string, customValue?: string) => void;
  allowCustomInput?: boolean;
  multiSelect?: boolean;
}

export function QuestionCard({
  question,
  options,
  onSelect,
  allowCustomInput = false,
  multiSelect = false,
}: QuestionCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [customValue, setCustomValue] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleOptionClick = (optionId: string) => {
    if (multiSelect) {
      const newSelected = new Set(selectedOptions);
      if (newSelected.has(optionId)) {
        newSelected.delete(optionId);
      } else {
        newSelected.add(optionId);
      }
      setSelectedOptions(newSelected);
    } else {
      // Single select - immediately send selection
      onSelect(optionId);
    }
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onSelect("custom", customValue.trim());
      setCustomValue("");
      setShowCustomInput(false);
    }
  };

  const handleMultiSelectSubmit = () => {
    if (selectedOptions.size > 0) {
      onSelect(Array.from(selectedOptions).join(","));
      setSelectedOptions(new Set());
    }
  };

  return (
    <div className="my-4 rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-medium text-foreground">{question}</h3>

      {/* Option Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleOptionClick(option.id)}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:border-primary hover:bg-accent ${
              selectedOptions.has(option.id)
                ? "border-primary bg-accent"
                : "border-border"
            }`}
          >
            {option.icon && (
              <span className="text-3xl" role="img" aria-label={option.label}>
                {option.icon}
              </span>
            )}
            <span className="text-center text-xs font-medium">
              {option.label}
            </span>
            {option.description && (
              <span className="text-center text-[10px] text-muted-foreground">
                {option.description}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Multi-select submit button */}
      {multiSelect && selectedOptions.size > 0 && (
        <div className="mt-4">
          <Button onClick={handleMultiSelectSubmit} className="w-full">
            Continue with {selectedOptions.size} selection
            {selectedOptions.size > 1 ? "s" : ""}
          </Button>
        </div>
      )}

      {/* Custom Input Option */}
      {allowCustomInput && (
        <div className="mt-4">
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Or type your own answer ↓
            </button>
          ) : (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Type your answer..."
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCustomSubmit();
                  }
                }}
                className="flex-1"
                autoFocus
              />
              <Button onClick={handleCustomSubmit} size="sm">
                Submit
              </Button>
              <Button
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomValue("");
                }}
                size="sm"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
