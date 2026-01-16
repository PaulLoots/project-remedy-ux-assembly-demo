"use client";

import { CitationText } from "./CitationText";

interface Source {
  title: string;
  site_name: string;
  url: string;
  description?: string;
}

interface SummaryProps {
  content: string;
  sources?: Source[];
  onCitationHover?: (index: number | null) => void;
}

export function Summary({ content, sources = [], onCitationHover }: SummaryProps) {
  return (
    <div className="p-5">
      <p className="font-semibold text-base leading-5 text-black">
        <CitationText text={content} sources={sources} onCitationHover={onCitationHover} />
      </p>
    </div>
  );
}
