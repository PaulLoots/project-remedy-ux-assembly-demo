"use client";

import { Button } from "./Button";

interface ReturnToConversationProps {
  message?: string;
  onReturn?: () => void;
}

export function ReturnToConversation({
  message = "You can ask another question now",
  onReturn,
}: ReturnToConversationProps) {
  return (
    <div className="flex flex-col gap-5 p-5 w-full">
      <p className="font-semibold text-base text-black">{message}</p>
      <Button variant="neutral" onClick={onReturn}>
        <span className="flex items-center justify-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.33334 8H12.6667"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7.33334 4L3.33334 8L7.33334 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Return to conversation
        </span>
      </Button>
    </div>
  );
}
