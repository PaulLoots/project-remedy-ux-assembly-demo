"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Summary } from "./Summary";
import { SafetyAlert } from "./SafetyAlert";
import { ClarifyingQuestion } from "./ClarifyingQuestion";
import { Checklist } from "./Checklist";
import { CTA } from "./CTA";
import { Sources } from "./Sources";
import { ReturnToConversation } from "./ReturnToConversation";

// Types matching the JSON structure from remedy-ux-assembly prompt
interface SafetyAlertContent {
  level: "informational" | "caution" | "emergency";
  title?: string;
  message: string;
}

interface ClarifyingQuestionContent {
  question: string;
  options: string[];
  allows_exit?: boolean;
}

interface ChecklistContent {
  heading: string;
  items: string[];
}

interface CTAContent {
  primary: string;
  secondary?: string;
}

interface SourceContent {
  title: string;
  site_name: string;
  url: string;
  description?: string;
  image_url?: string;
  // Legacy support
  name?: string;
  note?: string;
}

// Helper to extract string content (handles both string and {text: string} formats)
function extractString(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (content && typeof content === "object" && "text" in content) {
    return (content as { text: string }).text;
  }
  return "";
}

// Helper to safely extract safety alert content
function extractSafetyAlert(content: unknown): SafetyAlertContent {
  const c = content as Record<string, unknown>;
  return {
    level: (c.level as SafetyAlertContent["level"]) || "informational",
    title: extractString(c.title) || undefined,
    message: extractString(c.message),
  };
}

// Helper to safely extract clarifying question content
function extractClarifyingQuestion(content: unknown): ClarifyingQuestionContent {
  const c = content as Record<string, unknown>;
  return {
    question: extractString(c.question),
    options: Array.isArray(c.options) ? c.options.map(extractString) : [],
    allows_exit: c.allows_exit as boolean | undefined,
  };
}

// Helper to safely extract checklist content
function extractChecklist(content: unknown): ChecklistContent {
  const c = content as Record<string, unknown>;
  return {
    heading: extractString(c.heading),
    items: Array.isArray(c.items) ? c.items.map(extractString) : [],
  };
}

// Helper to safely extract CTA content
function extractCTA(content: unknown): CTAContent {
  const c = content as Record<string, unknown>;
  return {
    primary: extractString(c.primary),
    secondary: c.secondary ? extractString(c.secondary) : undefined,
  };
}

// Helper to safely extract sources content
function extractSources(content: unknown): SourceContent[] {
  if (!Array.isArray(content)) return [];
  return content.map((source) => {
    const s = source as Record<string, unknown>;
    return {
      title: extractString(s.title) || extractString(s.name) || "",
      site_name: extractString(s.site_name) || "",
      url: extractString(s.url),
      description: s.description ? extractString(s.description) : (s.note ? extractString(s.note) : undefined),
      image_url: s.image_url ? extractString(s.image_url) : undefined,
      // Legacy fields
      name: extractString(s.name),
      note: s.note ? extractString(s.note) : undefined,
    };
  });
}

interface UIComponent {
  type:
    | "summary"
    | "safety_alert"
    | "clarifying_question"
    | "checklist"
    | "cta"
    | "sources"
    | "return_to_conversation";
  content:
    | string
    | SafetyAlertContent
    | ClarifyingQuestionContent
    | ChecklistContent
    | CTAContent
    | SourceContent[];
}

interface FinalUI {
  components: UIComponent[];
}

interface ResponseRendererProps {
  finalUI: FinalUI;
  onOptionSelect?: (option: string) => void;
  onCTAClick?: (type: "primary" | "secondary") => void;
  onReturnToConversation?: () => void;
}

// Stagger delay between each component animation (ms)
const STAGGER_DELAY = 80;

export function ResponseRenderer({
  finalUI,
  onOptionSelect,
  onCTAClick,
  onReturnToConversation,
}: ResponseRendererProps) {
  const [highlightedSource, setHighlightedSource] = useState<number | null>(null);
  const sourcesRef = useRef<HTMLDivElement>(null);

  // Extract sources from components to pass to other components
  const sourcesComponent = finalUI.components.find(c => c.type === "sources");
  const sources = sourcesComponent ? extractSources(sourcesComponent.content) : [];

  // Handle citation hover - highlight the source
  const handleCitationHover = useCallback((index: number | null) => {
    setHighlightedSource(index);
  }, []);

  return (
    <div className="flex flex-col w-full">
      {finalUI.components.map((component, index) => {
        const delay = index * STAGGER_DELAY;

        // Animation wrapper styles - applied inline to avoid component recreation issues
        const animationStyle = {
          animationDelay: `${delay}ms`,
          animationFillMode: "forwards" as const,
        };

        switch (component.type) {
          case "summary":
            return (
              <div key={index} className="animate-fade-in-up opacity-0" style={animationStyle}>
                <Summary
                  content={extractString(component.content)}
                  sources={sources}
                  onCitationHover={handleCitationHover}
                />
              </div>
            );

          case "safety_alert": {
            const alert = extractSafetyAlert(component.content);
            return (
              <div key={index} className="animate-fade-in-up opacity-0" style={animationStyle}>
                <SafetyAlert
                  level={alert.level}
                  title={alert.title}
                  message={alert.message}
                />
              </div>
            );
          }

          case "clarifying_question": {
            const question = extractClarifyingQuestion(component.content);
            return (
              <div key={index} className="animate-fade-in-up opacity-0" style={animationStyle}>
                <ClarifyingQuestion
                  question={question.question}
                  options={question.options}
                  allowsExit={question.allows_exit}
                  onSelect={onOptionSelect}
                />
              </div>
            );
          }

          case "checklist": {
            const checklist = extractChecklist(component.content);
            return (
              <div key={index} className="animate-fade-in-up opacity-0" style={animationStyle}>
                <Checklist
                  heading={checklist.heading}
                  items={checklist.items}
                  sources={sources}
                  onCitationHover={handleCitationHover}
                />
              </div>
            );
          }

          case "cta": {
            const cta = extractCTA(component.content);
            return (
              <div key={index} className="animate-fade-in-up opacity-0" style={animationStyle}>
                <CTA
                  primary={cta.primary}
                  secondary={cta.secondary}
                  onPrimaryClick={() => onCTAClick?.("primary")}
                  onSecondaryClick={() => onCTAClick?.("secondary")}
                />
              </div>
            );
          }

          case "sources": {
            const extractedSources = extractSources(component.content);
            return (
              <div key={index} className="animate-fade-in-up opacity-0" style={animationStyle}>
                <div ref={sourcesRef}>
                  <Sources sources={extractedSources} highlightedIndex={highlightedSource} />
                </div>
              </div>
            );
          }

          case "return_to_conversation":
            return (
              <div key={index} className="animate-fade-in-up opacity-0" style={animationStyle}>
                <ReturnToConversation
                  onReturn={onReturnToConversation}
                />
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
