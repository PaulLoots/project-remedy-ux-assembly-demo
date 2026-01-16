"use client";

import { CitationText } from "./CitationText";

interface Source {
  title: string;
  site_name: string;
  url: string;
  description?: string;
}

interface ChecklistProps {
  heading: string;
  items: string[];
  sources?: Source[];
  onCitationHover?: (index: number | null) => void;
}

export function Checklist({ heading, items, sources = [], onCitationHover }: ChecklistProps) {
  return (
    <div className="flex flex-col gap-4 p-5 w-full">
      <p className="font-semibold text-base text-black">{heading}</p>
      <ul className="list-disc pl-6 space-y-1">
        {items.map((item, index) => (
          <li key={index} className="font-normal text-base text-black">
            <CitationText text={item} sources={sources} onCitationHover={onCitationHover} />
          </li>
        ))}
      </ul>
    </div>
  );
}
