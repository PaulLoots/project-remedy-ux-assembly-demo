"use client";

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
  name: string;
  url: string;
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
      name: extractString(s.name),
      url: extractString(s.url),
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

export function ResponseRenderer({
  finalUI,
  onOptionSelect,
  onCTAClick,
  onReturnToConversation,
}: ResponseRendererProps) {
  return (
    <div className="flex flex-col w-full">
      {finalUI.components.map((component, index) => {
        switch (component.type) {
          case "summary":
            return (
              <Summary key={index} content={extractString(component.content)} />
            );

          case "safety_alert": {
            const alert = extractSafetyAlert(component.content);
            return (
              <SafetyAlert
                key={index}
                level={alert.level}
                title={alert.title}
                message={alert.message}
              />
            );
          }

          case "clarifying_question": {
            const question = extractClarifyingQuestion(component.content);
            return (
              <ClarifyingQuestion
                key={index}
                question={question.question}
                options={question.options}
                allowsExit={question.allows_exit}
                onSelect={onOptionSelect}
              />
            );
          }

          case "checklist": {
            const checklist = extractChecklist(component.content);
            return (
              <Checklist
                key={index}
                heading={checklist.heading}
                items={checklist.items}
              />
            );
          }

          case "cta": {
            const cta = extractCTA(component.content);
            return (
              <CTA
                key={index}
                primary={cta.primary}
                secondary={cta.secondary}
                onPrimaryClick={() => onCTAClick?.("primary")}
                onSecondaryClick={() => onCTAClick?.("secondary")}
              />
            );
          }

          case "sources": {
            const sources = extractSources(component.content);
            return <Sources key={index} sources={sources} />;
          }

          case "return_to_conversation":
            return (
              <ReturnToConversation
                key={index}
                onReturn={onReturnToConversation}
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
