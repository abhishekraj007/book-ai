"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarouselNavigationProps {
  currentIndex: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function CarouselNavigation({
  currentIndex,
  totalPages,
  onPrevious,
  onNext,
}: CarouselNavigationProps) {
  return (
    <>
      {/* Previous Button - Absolute Left */}
      <Button
        onClick={onPrevious}
        disabled={currentIndex === 0}
        variant="outline"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-30"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      {/* Next Button - Absolute Right */}
      <Button
        onClick={onNext}
        disabled={currentIndex === totalPages - 1}
        variant="outline"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-30"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Page Counter - Absolute Bottom Center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border">
        <span className="text-sm font-medium">
          {currentIndex + 1} / {totalPages}
        </span>
      </div>
    </>
  );
}
