/**
 * Frontend Rules Engine for Remedy UX Assembly
 *
 * Takes AI response content and applies deterministic rules to build final UI.
 * This offloads component selection/ordering from the AI to reduce latency.
 */

// Types for AI response
export interface IntentDetection {
  primary_intent: string;
  secondary_intents?: string[];
  risk_level: "low" | "medium" | "high";
  reasoning: string;
}

export interface UXMode {
  mode: "informational" | "clarification" | "emergency";
  reason: string;
}

export interface SafetyAlertContent {
  level: "informational" | "caution" | "emergency";
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

export interface SourceContent {
  title: string;
  site_name: string;
  url: string;
  description?: string;
  image_url?: string;
  // Legacy support
  name?: string;
  note?: string;
}

export interface ResponseContent {
  summary?: string;
  safety_alert?: SafetyAlertContent;
  clarifying_question?: ClarifyingQuestionContent;
  checklist?: ChecklistContent;
  cta?: CTAContent;
  sources?: SourceContent[];
}

export interface AIResponse {
  intent_detection: IntentDetection;
  ux_mode: UXMode;
  response_content: ResponseContent;
}

// Types for final UI
export interface UIComponent {
  type: "summary" | "safety_alert" | "clarifying_question" | "checklist" | "cta" | "sources" | "return_to_conversation";
  content: unknown;
}

export interface FinalUI {
  components: UIComponent[];
}

export interface Guardrails {
  triage_required: boolean;
  free_text_allowed: boolean;
  follow_up_questions_allowed: boolean;
  escalation_required: boolean;
  allowed_components: string[];
  blocked_components: string[];
  applied_rules: string[];
}

export interface BuildResult {
  final_ui: FinalUI;
  guardrails: Guardrails;
  exit_state: {
    waiting_for_structured_input: boolean;
    returns_to_free_text: boolean;
  };
}

/**
 * Build final UI from AI response using deterministic rules
 * @param response - The AI response containing intent, mode, and content
 * @param clarifyingCount - Number of clarifying questions already asked (for safety net)
 */
export function buildFinalUI(response: AIResponse, clarifyingCount: number = 0): BuildResult {
  const { intent_detection, ux_mode, response_content } = response;
  const components: UIComponent[] = [];
  const appliedRules: string[] = [];
  const blockedComponents: string[] = [];

  // Determine guardrail flags
  const isEmergency = ux_mode.mode === "emergency";
  const isClarification = ux_mode.mode === "clarification";
  const isTriage = intent_detection.primary_intent === "Triage (Urgent)";

  // Safety net: If clarifying question limit exceeded, strip the clarifying question
  const clarifyingLimitExceeded = clarifyingCount >= 2;
  let hasClarifyingQuestion = !!response_content.clarifying_question;

  if (hasClarifyingQuestion && clarifyingLimitExceeded) {
    // Strip the clarifying question - limit exceeded
    hasClarifyingQuestion = false;
    appliedRules.push("Clarifying question stripped: limit exceeded (2/2)");
  }

  // Rule: Emergency mode suppresses non-essential UI
  const suppressNonEssential = isEmergency;
  if (suppressNonEssential) {
    appliedRules.push("Emergency mode: suppressing non-essential UI");
  }

  // STACKING ORDER (based on mode and content):
  // 1. safety_alert (if caution/emergency - goes first)
  // 2. summary (NOT in emergency mode)
  // 3. safety_alert (if informational - goes after summary)
  // 4. clarifying_question (if present)
  // 5. checklist (if present and not suppressed)
  // 6. cta (if present - ALWAYS allowed in emergency mode)
  // 7. sources (if present and not suppressed)
  // 8. return_to_conversation (if clarifying question allows exit)

  // 1. Safety alert (caution/emergency) - TOP POSITION
  if (response_content.safety_alert) {
    const alertLevel = response_content.safety_alert.level;
    if (alertLevel === "caution" || alertLevel === "emergency") {
      components.push({
        type: "safety_alert",
        content: response_content.safety_alert,
      });
      appliedRules.push(`Safety alert (${alertLevel}) placed at top`);
    }
  }

  // 2. Summary (NOT in emergency mode)
  if (response_content.summary && !isEmergency) {
    components.push({
      type: "summary",
      content: response_content.summary,
    });
  } else if (response_content.summary && isEmergency) {
    blockedComponents.push("summary");
    appliedRules.push("Summary blocked: emergency mode");
  }

  // 3. Safety alert (informational) - AFTER SUMMARY
  if (response_content.safety_alert) {
    const alertLevel = response_content.safety_alert.level;
    if (alertLevel === "informational") {
      components.push({
        type: "safety_alert",
        content: response_content.safety_alert,
      });
      appliedRules.push("Informational alert placed below summary");
    }
  }

  // 4. Clarifying question
  if (hasClarifyingQuestion && !suppressNonEssential) {
    components.push({
      type: "clarifying_question",
      content: response_content.clarifying_question,
    });
    appliedRules.push("Clarifying question included");
  } else if (response_content.clarifying_question && suppressNonEssential) {
    blockedComponents.push("clarifying_question");
    appliedRules.push("Clarifying question suppressed (emergency mode)");
  } else if (response_content.clarifying_question && clarifyingLimitExceeded) {
    blockedComponents.push("clarifying_question");
  }

  // 5. Checklist (if not suppressed and no clarifying question)
  if (response_content.checklist && !suppressNonEssential && !hasClarifyingQuestion) {
    // Enforce 2-5 items limit
    const items = response_content.checklist.items.slice(0, 5);
    if (items.length >= 2) {
      components.push({
        type: "checklist",
        content: {
          ...response_content.checklist,
          items,
        },
      });
      appliedRules.push(`Checklist included (${items.length} items)`);
    }
  } else if (response_content.checklist && suppressNonEssential) {
    blockedComponents.push("checklist");
    appliedRules.push("Checklist suppressed (emergency mode)");
  } else if (response_content.checklist && hasClarifyingQuestion) {
    blockedComponents.push("checklist");
    appliedRules.push("Checklist blocked: clarifying question present");
  }

  // 6. CTA - Apply rules
  if (response_content.cta) {
    // Rule: No CTA when clarifying question is present
    if (hasClarifyingQuestion) {
      blockedComponents.push("cta");
      appliedRules.push("CTA blocked: clarifying question present");
    }
    // Rule: Emergency mode ALWAYS includes CTA (primary only, no secondary)
    else if (isEmergency) {
      const ctaContent: CTAContent = {
        primary: response_content.cta.primary,
      };
      components.push({
        type: "cta",
        content: ctaContent,
      });
      appliedRules.push("CTA included: emergency mode (primary only)");
    }
    // Rule: Secondary CTA only allowed outside triage
    else {
      const ctaContent: CTAContent = {
        primary: response_content.cta.primary,
      };
      if (response_content.cta.secondary && !isTriage) {
        ctaContent.secondary = response_content.cta.secondary;
        appliedRules.push("CTA included with secondary action");
      } else if (response_content.cta.secondary && isTriage) {
        appliedRules.push("Secondary CTA blocked: triage mode");
      } else {
        appliedRules.push("CTA included (primary only)");
      }
      components.push({
        type: "cta",
        content: ctaContent,
      });
    }
  }

  // 7. Sources (if not suppressed and no clarifying question)
  if (response_content.sources && response_content.sources.length > 0 && !suppressNonEssential && !hasClarifyingQuestion) {
    // Enforce 2-4 sources limit
    const sources = response_content.sources.slice(0, 4);
    if (sources.length >= 1) {
      components.push({
        type: "sources",
        content: sources,
      });
      appliedRules.push(`Sources included (${sources.length})`);
    }
  } else if (response_content.sources && suppressNonEssential) {
    blockedComponents.push("sources");
    appliedRules.push("Sources suppressed (emergency mode)");
  } else if (response_content.sources && hasClarifyingQuestion) {
    blockedComponents.push("sources");
    appliedRules.push("Sources blocked: clarifying question present");
  }

  // 8. Return to conversation - DISABLED for now
  // TODO: Re-enable when we have a clear use case for this feature
  // if (hasClarifyingQuestion && response_content.clarifying_question?.allows_exit && !suppressNonEssential) {
  //   components.push({
  //     type: "return_to_conversation",
  //     content: null,
  //   });
  //   appliedRules.push("Return to conversation option included");
  // }

  // Build guardrails object
  const guardrails: Guardrails = {
    triage_required: isTriage,
    free_text_allowed: !hasClarifyingQuestion,
    follow_up_questions_allowed: !isEmergency,
    escalation_required: isEmergency || intent_detection.risk_level === "high",
    allowed_components: components.map(c => c.type),
    blocked_components: blockedComponents,
    applied_rules: appliedRules,
  };

  // Build exit state
  const exit_state = {
    waiting_for_structured_input: hasClarifyingQuestion && !suppressNonEssential,
    returns_to_free_text: !hasClarifyingQuestion || (hasClarifyingQuestion && !!response_content.clarifying_question?.allows_exit),
  };

  return {
    final_ui: { components },
    guardrails,
    exit_state,
  };
}
