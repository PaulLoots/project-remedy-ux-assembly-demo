"use client";

import { useState } from "react";
import { Button } from "./Button";

interface ClarifyingQuestionProps {
  question: string;
  options: string[];
  onSelect?: (option: string) => void;
}

export function ClarifyingQuestion({
  question,
  options,
  onSelect,
}: ClarifyingQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    if (selectedOption) return; // Already selected, ignore
    setSelectedOption(option);
    onSelect?.(option);
  };

  // Don't render anything once an option has been selected
  // This prevents the blank space issue
  if (selectedOption) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 md:gap-4 px-3 md:px-5 py-2 md:py-3 w-full animate-fade-in">
      <p className="font-semibold text-sm md:text-base text-black">{question}</p>
      <div className="flex flex-col gap-2 w-full">
        {options.map((option, index) => (
          <Button
            key={index}
            variant="neutral"
            align="left"
            onClick={() => handleSelect(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}
