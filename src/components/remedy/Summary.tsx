"use client";

interface SummaryProps {
  content: string;
}

export function Summary({ content }: SummaryProps) {
  return (
    <div className="p-5">
      <p className="font-semibold text-base leading-5 text-black">
        {content}
      </p>
    </div>
  );
}
