"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * ResponseLoader - Phased loading experience for Remedy UX OS
 *
 * Shows text skeleton placeholders when in "Structuring" phase
 *
 * Timing:
 * - Phase advance: 4000ms per phase
 * - Skeleton appears with "Structuring your answer" phase
 * - Long wait: 30000ms threshold
 * - Resolve transition: 400ms crossfade (smooth)
 */

type LoaderState = "PHASED_PROGRESS" | "LONG_WAIT_FALLBACK" | "RESOLVE";

const PHASES: string[] = [
  "Assessing urgency",
  "Checking safety signals",
  "Structuring your answer",
  "Assembling your response",
];

// Phase index where skeleton should appear (0-indexed, "Structuring your answer" is index 2)
const SKELETON_PHASE_INDEX = 2;

// Timing constants (in ms)
const PHASE_DURATION = 4000;
const LONG_WAIT_THRESHOLD = 30000;
const RESOLVE_DURATION = 400;

interface ResponseLoaderProps {
  isLoading: boolean;
  onResolveComplete?: () => void;
  onLoadTimeUpdate?: (ms: number) => void;
}

export function ResponseLoader({ isLoading, onResolveComplete, onLoadTimeUpdate }: ResponseLoaderProps) {
  const [state, setState] = useState<LoaderState>("PHASED_PROGRESS");
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [showLongWait, setShowLongWait] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const startTimeRef = useRef<number>(0);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Reset state when loading starts
  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now();
      setState("PHASED_PROGRESS");
      setCurrentPhaseIndex(0);
      setShowLongWait(false);
      setIsResolving(false);
    }
  }, [isLoading]);

  // Phase advancement timer
  useEffect(() => {
    if (!isLoading || state === "RESOLVE" || isResolving) return;

    const phaseTimer = setInterval(() => {
      setCurrentPhaseIndex((prev) => {
        if (prev < PHASES.length - 1) {
          return prev + 1;
        }
        return prev; // Stay on last phase
      });
    }, PHASE_DURATION);

    return () => clearInterval(phaseTimer);
  }, [isLoading, state, isResolving]);

  // Long wait fallback timer
  useEffect(() => {
    if (!isLoading || isResolving) return;

    const longWaitTimer = setTimeout(() => {
      setShowLongWait(true);
      setState("LONG_WAIT_FALLBACK");
    }, LONG_WAIT_THRESHOLD);

    return () => clearTimeout(longWaitTimer);
  }, [isLoading, isResolving]);

  // Show skeleton when we reach the structuring phase
  const showSkeleton = currentPhaseIndex >= SKELETON_PHASE_INDEX;

  // Handle resolve (when isLoading becomes false)
  const handleResolve = useCallback(() => {
    if (isResolving) return;

    // Calculate and report load time
    const loadTime = Date.now() - startTimeRef.current;
    onLoadTimeUpdate?.(loadTime);

    setIsResolving(true);
    setState("RESOLVE");

    // Wait for crossfade duration before calling onResolveComplete
    setTimeout(() => {
      onResolveComplete?.();
    }, RESOLVE_DURATION);
  }, [isResolving, onResolveComplete, onLoadTimeUpdate]);

  useEffect(() => {
    if (!isLoading && state !== "RESOLVE") {
      handleResolve();
    }
  }, [isLoading, state, handleResolve]);

  // Get current active phase label
  const currentPhaseLabel = PHASES[currentPhaseIndex] || PHASES[PHASES.length - 1];

  // Don't render if not loading and not resolving
  if (!isLoading && !isResolving) return null;

  return (
    <div
      className={`w-full transition-all ease-out ${
        isResolving ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      }`}
      style={{ transitionDuration: `${RESOLVE_DURATION}ms` }}
      role="status"
      aria-live="polite"
      aria-busy={isLoading}
    >
      {/* Active Phase - Single line with geometric loader */}
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2">
        {/* Geometric loading indicator */}
        <div className={`shrink-0 ${prefersReducedMotion ? "" : "animate-loader-rotate"}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-black/60">
            <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" className={prefersReducedMotion ? "" : "animate-loader-pulse-1"} />
            <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" className={prefersReducedMotion ? "" : "animate-loader-pulse-2"} />
            <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" className={prefersReducedMotion ? "" : "animate-loader-pulse-3"} />
            <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" className={prefersReducedMotion ? "" : "animate-loader-pulse-4"} />
          </svg>
        </div>
        <span
          className={`text-sm text-black/60 transition-opacity duration-500 ${
            !prefersReducedMotion ? "shimmer-text-slow" : ""
          }`}
        >
          {currentPhaseLabel}
          {prefersReducedMotion && <span className="sr-only"> (Active)</span>}
        </span>
      </div>

      {/* Text Skeleton Placeholders - Only when structuring phase is reached */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${
          showSkeleton ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className={`px-3 md:px-5 py-3 space-y-3 md:space-y-4 ${prefersReducedMotion ? "" : "animate-fade-in"}`}>
          {/* Summary text lines */}
          <div className="space-y-2.5">
            <div
              className={`h-3.5 bg-black/[0.08] rounded-full w-full ${
                prefersReducedMotion ? "" : "animate-skeleton-breathe"
              }`}
            />
            <div
              className={`h-3.5 bg-black/[0.08] rounded-full w-[95%] ${
                prefersReducedMotion ? "" : "animate-skeleton-breathe"
              }`}
              style={{ animationDelay: "0.15s" }}
            />
            <div
              className={`h-3.5 bg-black/[0.08] rounded-full w-[85%] ${
                prefersReducedMotion ? "" : "animate-skeleton-breathe"
              }`}
              style={{ animationDelay: "0.3s" }}
            />
            <div
              className={`h-3.5 bg-black/[0.08] rounded-full w-[60%] ${
                prefersReducedMotion ? "" : "animate-skeleton-breathe"
              }`}
              style={{ animationDelay: "0.45s" }}
            />
          </div>

          {/* Checklist-style lines */}
          <div className="space-y-2 pt-2">
            <div className="flex items-start gap-2">
              <div className={`w-1.5 h-1.5 rounded-full bg-black/[0.08] mt-1.5 shrink-0 ${prefersReducedMotion ? "" : "animate-skeleton-breathe"}`} style={{ animationDelay: "0.5s" }} />
              <div className={`h-3.5 bg-black/[0.08] rounded-full w-[90%] ${prefersReducedMotion ? "" : "animate-skeleton-breathe"}`} style={{ animationDelay: "0.5s" }} />
            </div>
            <div className="flex items-start gap-2">
              <div className={`w-1.5 h-1.5 rounded-full bg-black/[0.08] mt-1.5 shrink-0 ${prefersReducedMotion ? "" : "animate-skeleton-breathe"}`} style={{ animationDelay: "0.65s" }} />
              <div className={`h-3.5 bg-black/[0.08] rounded-full w-[75%] ${prefersReducedMotion ? "" : "animate-skeleton-breathe"}`} style={{ animationDelay: "0.65s" }} />
            </div>
            <div className="flex items-start gap-2">
              <div className={`w-1.5 h-1.5 rounded-full bg-black/[0.08] mt-1.5 shrink-0 ${prefersReducedMotion ? "" : "animate-skeleton-breathe"}`} style={{ animationDelay: "0.8s" }} />
              <div className={`h-3.5 bg-black/[0.08] rounded-full w-[82%] ${prefersReducedMotion ? "" : "animate-skeleton-breathe"}`} style={{ animationDelay: "0.8s" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Long Wait Message */}
      {showLongWait && (
        <p
          className="text-xs text-black/40 px-3 md:px-5 mt-2 animate-fade-in"
          aria-live="polite"
        >
          Still working on your response...
        </p>
      )}

      {/* Emergency disclaimer */}
      <p className="text-xs text-black/40 px-3 md:px-5 mt-3">
        If you feel in immediate danger, seek emergency help.
      </p>
    </div>
  );
}
