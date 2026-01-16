"use client";

import { Fragment, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface Source {
  title: string;
  site_name: string;
  url: string;
  description?: string;
  image_url?: string;
}

interface CitationTextProps {
  text: string;
  className?: string;
  sources?: Source[];
  onCitationHover?: (index: number | null) => void;
}

/**
 * Renders text with inline citation markers [1], [2], etc.
 * Citations are rendered as inline blocks with hover overlays.
 */
export function CitationText({ text, className = "", sources = [], onCitationHover }: CitationTextProps) {
  // Parse text to find citation markers like [1], [2], [1] [2], etc.
  const parts = text.split(/(\[\d+\])/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const citationMatch = part.match(/^\[(\d+)\]$/);
        if (citationMatch) {
          const citationIndex = parseInt(citationMatch[1], 10);
          const source = sources[citationIndex - 1]; // 1-indexed to 0-indexed
          return (
            <CitationMarker
              key={index}
              index={citationIndex}
              source={source}
              onHover={onCitationHover}
            />
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </span>
  );
}

// Individual citation marker with hover overlay
function CitationMarker({
  index,
  source,
  onHover,
}: {
  index: number;
  source?: Source;
  onHover?: (index: number | null) => void;
}) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);
  const markerRef = useRef<HTMLAnchorElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track mount state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate overlay position based on marker position in viewport
  useEffect(() => {
    if (showOverlay && markerRef.current) {
      const rect = markerRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;
      const overlayWidth = 280;

      // Position overlay relative to viewport
      const style: React.CSSProperties = {
        position: "fixed",
        width: overlayWidth,
        zIndex: 9999,
        pointerEvents: "none",
      };

      // Determine vertical position (need ~280px for overlay with image)
      if (spaceAbove < 300) {
        style.top = rect.bottom + 8;
      } else {
        style.bottom = window.innerHeight - rect.top + 8;
      }

      // Determine horizontal position
      if (spaceLeft < 140) {
        style.left = rect.left;
      } else if (spaceRight < 140) {
        style.right = window.innerWidth - rect.right;
      } else {
        style.left = rect.left + rect.width / 2 - overlayWidth / 2;
      }

      // Ensure overlay doesn't go off-screen horizontally
      if (typeof style.left === "number" && style.left < 16) {
        style.left = 16;
      }
      if (typeof style.left === "number" && style.left + overlayWidth > window.innerWidth - 16) {
        style.left = window.innerWidth - overlayWidth - 16;
      }

      setOverlayStyle(style);
    }
  }, [showOverlay]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowOverlay(true);
      onHover?.(index);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowOverlay(false);
      onHover?.(null);
    }, 150);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (source?.url) {
      window.open(source.url, "_blank", "noopener,noreferrer");
    }
    e.preventDefault();
  };

  // Get favicon URL
  const getFaviconUrl = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
    } catch {
      return null;
    }
  };

  const faviconUrl = source?.url ? getFaviconUrl(source.url) : null;

  // Render overlay using portal to avoid clipping
  const overlay = showOverlay && source && mounted && createPortal(
    <div
      className="bg-white rounded-xl shadow-lg border border-black/10 overflow-hidden animate-fade-in"
      style={overlayStyle}
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
          <span className="text-xs font-medium text-black/70">{source.site_name || "Source"}</span>
        </div>

        {/* Title */}
        <p className="font-semibold text-sm text-black mb-2 leading-tight line-clamp-2">
          {source.title}
        </p>

        {/* Description */}
        {source.description && (
          <p className="text-xs text-black/60 leading-relaxed line-clamp-3">
            {source.description}
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
    <span
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        ref={markerRef}
        href={source?.url || "#"}
        onClick={handleClick}
        className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 mx-0.5 text-[11px] font-medium text-black/50 bg-black/[0.06] rounded hover:bg-black/[0.12] hover:text-black/70 transition-colors cursor-pointer align-baseline"
        aria-label={`Source ${index}`}
      >
        {index}
      </a>

      {/* Hover overlay rendered via portal */}
      {overlay}
    </span>
  );
}
