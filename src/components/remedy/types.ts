// Types matching the JSON structure from the Remedy UX Assembly prompt

export type SafetyLevel = "informational" | "caution" | "emergency";
export type UXMode = "informational" | "clarification" | "emergency";
export type RiskLevel = "low" | "medium" | "high";

export interface SafetyAlertContent {
  level: SafetyLevel;
  title?: string;
  message: string;
}

export interface ClarifyingQuestionContent {
  question: string;
  options: string[];
  allows_exit?: boolean;
}

export interface ChecklistContent {
  heading: string;
  items: string[];
}

export interface CTAContent {
  primary: string;
  secondary?: string;
}

export interface SourceItem {
  name: string;
  url: string;
  note?: string;
}

export interface UIComponent {
  type: "summary" | "safety_alert" | "clarifying_question" | "checklist" | "cta" | "sources" | "return_to_conversation";
  content: string | SafetyAlertContent | ClarifyingQuestionContent | ChecklistContent | CTAContent | SourceItem[];
}

export interface FinalUI {
  components: UIComponent[];
}

export interface RemedyResponse {
  user_input: {
    question: string;
  };
  intent_detection: {
    primary_intent: string;
    secondary_intents: string[];
    risk_level: RiskLevel;
    reasoning: string;
  };
  ux_mode: {
    mode: UXMode;
    reason: string;
  };
  guardrails: {
    triage_required: boolean;
    free_text_allowed: boolean;
    follow_up_questions_allowed: boolean;
    escalation_required: boolean;
    allowed_components: string[];
    blocked_components: string[];
  };
  structured_response: {
    summary?: string;
    safety_alert?: SafetyAlertContent;
    clarifying_question?: ClarifyingQuestionContent;
    checklist?: ChecklistContent;
    cta?: CTAContent;
    sources?: SourceItem[];
  };
  component_selection: {
    selected_components: Array<{
      component: string;
      included: boolean;
    }>;
  };
  stacking_and_limits: {
    stacking_order: string[];
    cta_included: boolean;
    clarifying_question_included: boolean;
    rules_violated: boolean;
    suppressed_components: string[];
    notes?: string;
  };
  final_ui: FinalUI;
  exit_state: {
    waiting_for_structured_input: boolean;
    returns_to_free_text: boolean;
  };
}
