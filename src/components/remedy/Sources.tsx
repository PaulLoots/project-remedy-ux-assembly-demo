"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface Source {
  title: string;
  site_name: string;
  url: string;
  description?: string;
  image_url?: string;
  // Legacy support
  name?: string;
  note?: string;
}

interface SourcesProps {
  sources: Source[];
  highlightedIndex?: number | null;
}

// Helper to safely extract hostname from URL
function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

// Get favicon URL using Google's favicon service
function getFaviconUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return null;
  }
}

// Source card component with hover overlay
function SourceCard({
  source,
  index,
  isHighlighted,
}: {
  source: Source;
  index: number;
  isHighlighted: boolean;
}) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});
  const cardRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  // Use new fields or fall back to legacy fields
  const title = source.title || source.name || "Untitled";
  const siteName = source.site_name || getHostname(source.url);
  const description = source.description || source.note;
  const faviconUrl = getFaviconUrl(source.url);

  // Track mount state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate overlay position based on card position in viewport
  useEffect(() => {
    if (showOverlay && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const overlayWidth = 280;

      // Position overlay relative to viewport
      const style: React.CSSProperties = {
        position: "fixed",
        left: rect.left,
        width: overlayWidth,
        zIndex: 9999,
      };

      // Show below if not enough space above (need ~250px for overlay with image)
      if (spaceAbove < 280) {
        style.top = rect.bottom + 8;
      } else {
        style.bottom = window.innerHeight - rect.top + 8;
      }

      // Ensure overlay doesn't go off-screen horizontally
      if (rect.left + overlayWidth > window.innerWidth - 16) {
        style.left = window.innerWidth - overlayWidth - 16;
      }

      setOverlayStyle(style);
    }
  }, [showOverlay]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowOverlay(true), 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowOverlay(false), 150);
  };

  // Render overlay using portal to avoid clipping
  const overlay = showOverlay && mounted && createPortal(
    <div
      className="bg-white rounded-xl shadow-lg border border-black/10 overflow-hidden animate-fade-in"
      style={overlayStyle}
      onMouseEnter={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }}
      onMouseLeave={handleMouseLeave}
    >
      {/* Preview image */}
      {source.image_url && (
        <div className="w-full h-32 bg-black/5 overflow-hidden">
          <img
            src={source.image_url}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).parentElement!.style.display = "none";
            }}
          />
        </div>
      )}

      <div className="p-4">
        {/* Site favicon + site name */}
        <div className="flex items-center gap-2 mb-2">
          {faviconUrl ? (
            <img
              src={faviconUrl}
              alt=""
              className="w-4 h-4 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-4 h-4 rounded bg-black/10 flex items-center justify-center shrink-0">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-black/40">
                <path
                  d="M6 1C3.24 1 1 3.24 1 6C1 8.76 3.24 11 6 11C8.76 11 11 8.76 11 6C11 3.24 8.76 1 6 1Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          )}
          <span className="text-xs font-medium text-black/70">{siteName}</span>
        </div>

        {/* Title */}
        <p className="font-semibold text-sm text-black mb-2 leading-tight line-clamp-2">
          {title}
        </p>

        {/* Description */}
        {description && (
          <p className="text-xs text-black/60 leading-relaxed line-clamp-3">
            {description}
          </p>
        )}

        {/* Link hint */}
        <div className="flex items-center gap-1 mt-3 text-black/40">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M8.33 8.33H1.67C1.48 8.33 1.33 8.19 1.33 8V2C1.33 1.81 1.48 1.67 1.67 1.67H4.17V2.5H2.17V7.5H7.83V5.5H8.67V8C8.67 8.19 8.52 8.33 8.33 8.33Z"
              fill="currentColor"
            />
            <path
              d="M5.83 1.67V2.5H7.16L4.29 5.37L4.88 5.96L7.75 3.09V4.42H8.58V1.67H5.83Z"
              fill="currentColor"
            />
          </svg>
          <span className="text-[10px]">Click to open</span>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div
      ref={cardRef}
      className="relative h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex flex-col justify-between gap-1.5 p-3 rounded-xl transition-all duration-200 h-full ${
          isHighlighted ? "bg-black/[0.12]" : "bg-black/[0.04] hover:bg-black/[0.08]"
        }`}
      >
        {/* Title - 12px */}
        <p className="font-medium text-xs text-black leading-tight line-clamp-2">
          {title}
        </p>

        {/* Favicon, site name, dot, and source number */}
        <div className="flex items-center gap-1.5 mt-auto">
          {faviconUrl ? (
            <img
              src={faviconUrl}
              alt=""
              className="w-4 h-4 rounded shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-4 h-4 rounded bg-black/10 shrink-0" />
          )}
          <p className="font-normal text-[11px] text-black/50 truncate flex items-center gap-1">
            <span>{siteName}</span>
            <span className="text-black/30">·</span>
            <span>{index + 1}</span>
          </p>
        </div>
      </a>

      {/* Hover overlay rendered via portal */}
      {overlay}
    </div>
  );
}

export function Sources({ sources, highlightedIndex }: SourcesProps) {
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hiddenCount = sources.length - 2;
  const hasMore = sources.length > 2;

  // Calculate content height for animation
  const updateHeight = useCallback(() => {
    if (contentRef.current) {
      const grid = contentRef.current;
      const cards = Array.from(grid.children) as HTMLElement[];
      if (cards.length === 0) return;

      // Find the max height in first row (first 2 cards)
      const firstRowCards = cards.slice(0, 2);
      const firstRowHeight = Math.max(...firstRowCards.map(c => c.offsetHeight));

      const gap = 8; // gap-2 = 0.5rem = 8px
      const totalRows = Math.ceil(sources.length / 2);
      const visibleRows = expanded ? totalRows : 1;

      // Use the first row height as the standard (CSS grid makes rows equal)
      const height = visibleRows * firstRowHeight + (visibleRows - 1) * gap;
      setContentHeight(height);
    }
  }, [expanded, sources.length]);

  // Update height on mount and when expanded changes
  useEffect(() => {
    updateHeight();
  }, [updateHeight]);

  // Scroll into view when expanding
  const handleToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);

    // Scroll to reveal expanded content
    if (newExpanded && containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-2 md:gap-2.5 px-3 md:px-5 py-2 md:py-3 w-full">
      {/* Header row - always shows toggle button in same position */}
      <div className="flex items-center justify-between">
        <p className="font-normal text-xs md:text-sm text-black/60">
          {sources.length} {sources.length === 1 ? "Source" : "Sources"}
        </p>
        {hasMore && (
          <button
            onClick={handleToggle}
            className="flex items-center gap-1 text-xs md:text-sm text-black/60 hover:text-black transition-colors"
          >
            <span>{expanded ? "Show less" : `${hiddenCount} More`}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={`transition-transform duration-300 ${expanded ? "rotate-[270deg]" : "rotate-90"}`}
            >
              <path
                d="M4.5 2.5L8 6L4.5 9.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Sources grid - animated height */}
      <div
        className="overflow-hidden transition-[height] duration-300 ease-out"
        style={{ height: contentHeight ? `${contentHeight}px` : "auto" }}
      >
        <div ref={contentRef} className="grid grid-cols-2 gap-2">
          {sources.map((source, index) => (
            <SourceCard
              key={index}
              source={source}
              index={index}
              isHighlighted={highlightedIndex === index + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
