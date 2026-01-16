"use client";

import { useState } from "react";
import { Button } from "./Button";

interface ClarifyingQuestionProps {
  question: string;
  options: string[];
  allowsExit?: boolean;
  onSelect?: (option: string) => void;
  onExit?: () => void;
}

export function ClarifyingQuestion({
  question,
  options,
  allowsExit = true,
  onSelect,
  onExit,
}: ClarifyingQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    if (selectedOption) return; // Already selected, ignore
    setSelectedOption(option);
    onSelect?.(option);
  };

  const handleExit = () => {
    if (selectedOption) return; // Already selected, ignore
    setSelectedOption("__exit__");
    onExit?.();
  };

  // Don't render anything once an option has been selected
  // This prevents the blank space issue
  if (selectedOption) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 px-5 py-3 w-full animate-fade-in">
      <p className="font-semibold text-base text-black">{question}</p>
      <div className="flex flex-col gap-2 w-full">
        {options.map((option, index) => (
          <Button
            key={index}
            variant="neutral"
            onClick={() => handleSelect(option)}
          >
            {option}
          </Button>
        ))}
        {allowsExit && (
          <Button variant="subtle" onClick={handleExit}>
            I can&apos;t answer right now
          </Button>
        )}
      </div>
    </div>
  );
}
