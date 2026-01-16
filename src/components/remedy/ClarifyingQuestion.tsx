"use client";

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
  return (
    <div className="flex flex-col gap-4 px-5 py-3 w-full">
      <p className="font-semibold text-base text-black">{question}</p>
      <div className="flex flex-col gap-2 w-full">
        {options.map((option, index) => (
          <Button
            key={index}
            variant="neutral"
            onClick={() => onSelect?.(option)}
          >
            {option}
          </Button>
        ))}
        {allowsExit && (
          <Button variant="subtle" onClick={onExit}>
            I can&apos;t answer right now
          </Button>
        )}
      </div>
    </div>
  );
}
