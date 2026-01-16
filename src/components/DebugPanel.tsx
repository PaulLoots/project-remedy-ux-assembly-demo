"use client";

import { useState } from "react";
import { testScenarios, evaluateTest, TestEvaluation, TestResult } from "@/data/testScenarios";

interface StructuredResponse {
  intent_detection?: {
    primary_intent: string;
    secondary_intents?: string[];
    risk_level: string;
    reasoning: string;
  };
  ux_mode?: {
    mode: string;
    reason: string;
  };
  response_content?: {
    summary?: string;
    safety_alert?: {
      level: string;
      title?: string;
      message: string;
    };
    clarifying_question?: {
      question: string;
      options: string[];
      allows_exit?: boolean;
    };
    checklist?: {
      heading: string;
      items: string[];
    };
    cta?: {
      primary: string;
      secondary?: string;
    };
    sources?: Array<{
      name: string;
      url: string;
      note?: string;
    }>;
  };
  guardrails?: {
    triage_required: boolean;
    free_text_allowed: boolean;
    follow_up_questions_allowed: boolean;
    escalation_required: boolean;
    allowed_components: string[];
    blocked_components: string[];
    applied_rules?: string[];
  };
  final_ui?: {
    components: Array<{
      type: string;
      content: unknown;
    }>;
  };
  exit_state?: {
    waiting_for_structured_input: boolean;
    returns_to_free_text: boolean;
  };
  clarifying_context?: {
    count: number;
    max: number;
    exhausted: boolean;
  };
  [key: string]: unknown;
}

interface DebugPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  latestResponse: StructuredResponse | null;
  userQuestion: string;
  loadTimeMs?: number | null;
  activeTestId?: number | null;
}

// All available intents in the system
const ALL_INTENTS = [
  "Triage (Urgent)",
  "Medication Guidance",
  "Explain",
  "Navigate the Care System",
  "Planning & Prevention",
  "Chronic Condition Management",
];

// All UX modes
const ALL_UX_MODES = ["informational", "clarification", "emergency"];

// All risk levels
const ALL_RISK_LEVELS = ["low", "medium", "high"];

// All UI components
const ALL_UI_COMPONENTS = [
  "summary",
  "safety_alert",
  "clarifying_question",
  "checklist",
  "cta",
  "sources",
  "return_to_conversation",
];

export function DebugPanel({
  isOpen,
  onToggle,
  latestResponse,
  userQuestion,
  loadTimeMs,
  activeTestId,
}: DebugPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "test" | "json">("overview");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    input: true,
    detection: true,
    components: true,
    state: false,
    rules: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatLoadTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Get active components from final_ui
  const activeComponents = latestResponse?.final_ui?.components.map(c => c.type) || [];

  // Get component details for display
  const getComponentDetail = (type: string): string | null => {
    if (!latestResponse?.response_content) return null;
    const content = latestResponse.response_content;
    switch (type) {
      case "safety_alert":
        return content.safety_alert?.level || null;
      case "clarifying_question":
        return content.clarifying_question ? `${content.clarifying_question.options.length} options` : null;
      case "checklist":
        return content.checklist ? `${content.checklist.items.length} items` : null;
      case "cta":
        return content.cta?.secondary ? "2 actions" : content.cta ? "1 action" : null;
      case "sources":
        return content.sources ? `${content.sources.length} sources` : null;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30 transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      {/* Panel - Desktop: Floating panel on right, Mobile: Full screen overlay */}
      <div
        className={`fixed z-40 bg-white shadow-xl transition-all duration-300
          inset-0 w-full
          md:inset-auto md:top-3 md:right-3 md:bottom-3 md:left-auto md:w-[400px] md:rounded-2xl md:border md:border-black/10
          ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"}`}
      >
        <div className="h-full flex flex-col overflow-hidden md:rounded-2xl">
          {/* Header */}
          <div className="px-4 md:px-5 pt-4 md:pt-5 pb-3 md:pb-4 border-b border-black/5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm md:text-base font-bold text-black">System Debug</h2>
                <p className="text-[10px] md:text-xs text-black/40 mt-0.5">
                  AI analysis + rules engine
                </p>
              </div>
              <div className="flex items-center gap-2">
                {loadTimeMs !== null && loadTimeMs !== undefined && (
                  <div className={`text-xs md:text-sm font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg ${
                    loadTimeMs < 2000 ? "bg-emerald-50 text-emerald-700" :
                    loadTimeMs < 4000 ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-700"
                  }`}>
                    {formatLoadTime(loadTimeMs)}
                  </div>
                )}
                {/* Mobile close button */}
                <button
                  onClick={onToggle}
                  className="md:hidden p-1.5 -mr-1 text-black/40 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
                  aria-label="Close panel"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-4 md:px-5 py-2 border-b border-black/5 bg-black/[0.02]">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-2.5 md:px-3 py-1.5 text-[11px] md:text-xs font-medium rounded-md transition-all ${
                activeTab === "overview"
                  ? "bg-black text-white"
                  : "text-black/50 hover:text-black hover:bg-black/5"
              }`}
            >
              Overview
            </button>
            {/* Only show Test Results tab if a test was selected */}
            {activeTestId && (
              <button
                onClick={() => setActiveTab("test")}
                className={`px-2.5 md:px-3 py-1.5 text-[11px] md:text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === "test"
                    ? "bg-black text-white"
                    : "text-black/50 hover:text-black hover:bg-black/5"
                }`}
              >
                <span className="hidden sm:inline">Test Results</span>
                <span className="sm:hidden">Tests</span>
                {latestResponse && (
                  <TestResultBadge result={evaluateTest(
                    testScenarios.find(t => t.id === activeTestId)!,
                    latestResponse
                  ).overall} />
                )}
              </button>
            )}
            <button
              onClick={() => setActiveTab("json")}
              className={`px-2.5 md:px-3 py-1.5 text-[11px] md:text-xs font-medium rounded-md transition-all ${
                activeTab === "json"
                  ? "bg-black text-white"
                  : "text-black/50 hover:text-black hover:bg-black/5"
              }`}
            >
              JSON
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 scrollbar-minimal">
            {!latestResponse ? (
              <div className="flex flex-col items-center justify-center h-full text-black/30 px-8 text-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mb-3 opacity-50">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 8V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1" fill="currentColor"/>
                </svg>
                <p className="text-sm">Ask a question to see analysis</p>
              </div>
            ) : activeTab === "overview" ? (
              <div className="p-4 space-y-1">
                {/* User Input Section */}
                <CollapsibleSection
                  title="Input"
                  expanded={expandedSections.input}
                  onToggle={() => toggleSection("input")}
                >
                  <p className="text-sm text-black leading-relaxed">
                    &ldquo;{userQuestion || "N/A"}&rdquo;
                  </p>
                </CollapsibleSection>

                {/* Detection Section - Intents, Risk, Mode */}
                <CollapsibleSection
                  title="Detection"
                  badge="AI"
                  expanded={expandedSections.detection}
                  onToggle={() => toggleSection("detection")}
                >
                  <div className="space-y-4">
                    {/* Intents */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-black/40 mb-2">Intents</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_INTENTS.map(intent => {
                          const isPrimary = latestResponse.intent_detection?.primary_intent === intent;
                          const isSecondary = latestResponse.intent_detection?.secondary_intents?.includes(intent);
                          const isActive = isPrimary || isSecondary;
                          return (
                            <span
                              key={intent}
                              className={`text-[11px] px-2 py-1 rounded-md transition-all ${
                                isPrimary
                                  ? "bg-violet-100 text-violet-800 font-medium"
                                  : isSecondary
                                  ? "bg-violet-50 text-violet-600"
                                  : "bg-black/[0.03] text-black/25"
                              }`}
                            >
                              {intent}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Risk Level */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-black/40 mb-2">Risk Level</p>
                      <div className="flex gap-1.5">
                        {ALL_RISK_LEVELS.map(level => {
                          const isActive = latestResponse.intent_detection?.risk_level === level;
                          return (
                            <span
                              key={level}
                              className={`text-[11px] px-2.5 py-1 rounded-md capitalize transition-all ${
                                isActive
                                  ? level === "high"
                                    ? "bg-red-100 text-red-800 font-medium"
                                    : level === "medium"
                                    ? "bg-amber-100 text-amber-800 font-medium"
                                    : "bg-emerald-100 text-emerald-800 font-medium"
                                  : "bg-black/[0.03] text-black/25"
                              }`}
                            >
                              {level}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* UX Mode */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-black/40 mb-2">UX Mode</p>
                      <div className="flex gap-1.5">
                        {ALL_UX_MODES.map(mode => {
                          const isActive = latestResponse.ux_mode?.mode === mode;
                          return (
                            <span
                              key={mode}
                              className={`text-[11px] px-2.5 py-1 rounded-md capitalize transition-all ${
                                isActive
                                  ? mode === "emergency"
                                    ? "bg-red-100 text-red-800 font-medium"
                                    : mode === "clarification"
                                    ? "bg-amber-100 text-amber-800 font-medium"
                                    : "bg-blue-100 text-blue-800 font-medium"
                                  : "bg-black/[0.03] text-black/25"
                              }`}
                            >
                              {mode}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reasoning */}
                    {latestResponse.intent_detection?.reasoning && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-black/40 mb-1.5">Reasoning</p>
                        <p className="text-xs text-black/60 leading-relaxed bg-black/[0.02] rounded-lg px-3 py-2">
                          {latestResponse.intent_detection.reasoning}
                        </p>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>

                {/* UI Components Section */}
                <CollapsibleSection
                  title="Components"
                  badge="Output"
                  expanded={expandedSections.components}
                  onToggle={() => toggleSection("components")}
                >
                  <div className="grid grid-cols-2 gap-1.5">
                    {ALL_UI_COMPONENTS.map(component => {
                      const isActive = activeComponents.includes(component);
                      const detail = getComponentDetail(component);
                      return (
                        <div
                          key={component}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-lg transition-all ${
                            isActive
                              ? "bg-emerald-50 border border-emerald-200"
                              : "bg-black/[0.02] border border-transparent"
                          }`}
                        >
                          <span className={`text-[11px] ${isActive ? "text-emerald-800 font-medium" : "text-black/30"}`}>
                            {component.replace(/_/g, " ")}
                          </span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Component details */}
                  {activeComponents.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-black/5 space-y-1">
                      {activeComponents.map(comp => {
                        const detail = getComponentDetail(comp);
                        if (!detail) return null;
                        return (
                          <div key={comp} className="flex items-center justify-between text-[11px]">
                            <span className="text-black/40">{comp.replace(/_/g, " ")}</span>
                            <span className="text-black/60">{detail}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CollapsibleSection>

                {/* State Section */}
                <CollapsibleSection
                  title="State"
                  badge="Frontend"
                  expanded={expandedSections.state}
                  onToggle={() => toggleSection("state")}
                >
                  <div className="space-y-3">
                    {/* Clarifying Questions */}
                    {latestResponse.clarifying_context && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-black/40 mb-2">Clarifying Questions</p>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {Array.from({ length: latestResponse.clarifying_context.max }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-6 h-1.5 rounded-full ${
                                  i < latestResponse.clarifying_context!.count
                                    ? latestResponse.clarifying_context!.exhausted
                                      ? "bg-red-400"
                                      : "bg-amber-400"
                                    : "bg-black/10"
                                }`}
                              />
                            ))}
                          </div>
                          <span className={`text-[11px] font-medium ${
                            latestResponse.clarifying_context.exhausted
                              ? "text-red-600"
                              : "text-black/50"
                          }`}>
                            {latestResponse.clarifying_context.count}/{latestResponse.clarifying_context.max}
                            {latestResponse.clarifying_context.exhausted && " exhausted"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Exit State */}
                    {latestResponse.exit_state && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-black/40 mb-2">Exit State</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-black/60">Waiting for input</span>
                            <StatusDot active={latestResponse.exit_state.waiting_for_structured_input} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-black/60">Returns to free text</span>
                            <StatusDot active={latestResponse.exit_state.returns_to_free_text} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Guardrails */}
                    {latestResponse.guardrails && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-black/40 mb-2">Guardrails</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-black/60">Triage required</span>
                            <StatusDot active={latestResponse.guardrails.triage_required} color={latestResponse.guardrails.triage_required ? "red" : undefined} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-black/60">Free text allowed</span>
                            <StatusDot active={latestResponse.guardrails.free_text_allowed} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-black/60">Follow-ups allowed</span>
                            <StatusDot active={latestResponse.guardrails.follow_up_questions_allowed} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-black/60">Escalation required</span>
                            <StatusDot active={latestResponse.guardrails.escalation_required} color={latestResponse.guardrails.escalation_required ? "red" : undefined} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>

                {/* Applied Rules Section */}
                {latestResponse.guardrails?.applied_rules && latestResponse.guardrails.applied_rules.length > 0 && (
                  <CollapsibleSection
                    title="Applied Rules"
                    badge="Frontend"
                    expanded={expandedSections.rules}
                    onToggle={() => toggleSection("rules")}
                    count={latestResponse.guardrails.applied_rules.length}
                  >
                    <div className="space-y-1">
                      {latestResponse.guardrails.applied_rules.map((rule, i) => (
                        <div
                          key={i}
                          className="text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-md flex items-start gap-2"
                        >
                          <span className="text-blue-400 shrink-0">→</span>
                          <span className="leading-relaxed">{rule}</span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}
              </div>
            ) : activeTab === "test" ? (
              /* Test Results Tab */
              <TestResultsPanel
                activeTestId={activeTestId}
                latestResponse={latestResponse}
              />
            ) : (
              /* JSON Tab */
              <div className="p-4 h-full">
                <div className="bg-[#1e1e1e] rounded-xl p-4 h-full overflow-auto">
                  <pre className="text-xs text-[#d4d4d4] font-mono whitespace-pre overflow-x-auto">
                    <JsonSyntaxHighlight json={latestResponse} />
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  badge,
  expanded,
  onToggle,
  count,
  children,
}: {
  title: string;
  badge?: "AI" | "Frontend" | "Output";
  expanded: boolean;
  onToggle: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  const badgeColors = {
    AI: "bg-violet-100 text-violet-600",
    Frontend: "bg-cyan-100 text-cyan-600",
    Output: "bg-emerald-100 text-emerald-600",
  };

  return (
    <div className="border border-black/5 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-black/[0.02] hover:bg-black/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-black uppercase tracking-wide">{title}</span>
          {badge && (
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${badgeColors[badge]}`}>
              {badge}
            </span>
          )}
          {count !== undefined && (
            <span className="text-[10px] text-black/40">{count}</span>
          )}
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`text-black/30 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          expanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-3 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}

// Status Dot Component
function StatusDot({ active, color }: { active: boolean; color?: "red" | "green" }) {
  if (color === "red" && active) {
    return <span className="w-2 h-2 rounded-full bg-red-500" />;
  }
  return (
    <span className={`w-2 h-2 rounded-full ${active ? "bg-emerald-500" : "bg-black/10"}`} />
  );
}

// JSON Syntax Highlighting Component
function JsonSyntaxHighlight({ json }: { json: unknown }) {
  const stringify = (obj: unknown, indent = 0): React.ReactNode[] => {
    const spaces = "  ".repeat(indent);
    const result: React.ReactNode[] = [];

    if (obj === null) {
      return [<span key="null" className="text-[#569cd6]">null</span>];
    }

    if (typeof obj === "boolean") {
      return [<span key="bool" className="text-[#569cd6]">{obj.toString()}</span>];
    }

    if (typeof obj === "number") {
      return [<span key="num" className="text-[#b5cea8]">{obj}</span>];
    }

    if (typeof obj === "string") {
      // Escape and truncate very long strings
      const escaped = obj.replace(/"/g, '\\"').replace(/\n/g, "\\n");
      const display = escaped.length > 100 ? escaped.slice(0, 100) + "..." : escaped;
      return [<span key="str" className="text-[#ce9178]">&quot;{display}&quot;</span>];
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return [<span key="empty-arr">[]</span>];
      }
      result.push(<span key="arr-open">[{"\n"}</span>);
      obj.forEach((item, i) => {
        result.push(<span key={`arr-space-${i}`}>{spaces}  </span>);
        result.push(...stringify(item, indent + 1));
        if (i < obj.length - 1) {
          result.push(<span key={`arr-comma-${i}`}>,</span>);
        }
        result.push(<span key={`arr-nl-${i}`}>{"\n"}</span>);
      });
      result.push(<span key="arr-close">{spaces}]</span>);
      return result;
    }

    if (typeof obj === "object") {
      const entries = Object.entries(obj);
      if (entries.length === 0) {
        return [<span key="empty-obj">{"{}"}</span>];
      }
      result.push(<span key="obj-open">{"{"}{"\n"}</span>);
      entries.forEach(([key, value], i) => {
        result.push(<span key={`obj-space-${i}`}>{spaces}  </span>);
        result.push(<span key={`obj-key-${i}`} className="text-[#9cdcfe]">&quot;{key}&quot;</span>);
        result.push(<span key={`obj-colon-${i}`}>: </span>);
        result.push(...stringify(value, indent + 1));
        if (i < entries.length - 1) {
          result.push(<span key={`obj-comma-${i}`}>,</span>);
        }
        result.push(<span key={`obj-nl-${i}`}>{"\n"}</span>);
      });
      result.push(<span key="obj-close">{spaces}{"}"}</span>);
      return result;
    }

    return [<span key="unknown">{String(obj)}</span>];
  };

  return <>{stringify(json)}</>;
}

// Test Result Badge Component
function TestResultBadge({ result, size = "sm" }: { result: TestResult; size?: "sm" | "md" }) {
  const colors = {
    pass: "bg-emerald-500",
    partial: "bg-amber-500",
    fail: "bg-red-500",
    pending: "bg-black/20",
  };

  const sizeClasses = size === "sm" ? "w-2 h-2" : "w-3 h-3";

  return <span className={`${sizeClasses} rounded-full ${colors[result]} shrink-0`} />;
}

// Test Results Panel Component
function TestResultsPanel({
  activeTestId,
  latestResponse,
}: {
  activeTestId?: number | null;
  latestResponse: StructuredResponse | null;
}) {
  if (!activeTestId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-black/30 px-8 text-center py-12">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mb-3 opacity-50">
          <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-sm font-medium mb-1">No Test Selected</p>
        <p className="text-xs">Select a test scenario from the landing page to see results here</p>
      </div>
    );
  }

  const scenario = testScenarios.find(t => t.id === activeTestId);
  if (!scenario) {
    return (
      <div className="p-4 text-center text-black/50">
        Test scenario not found
      </div>
    );
  }

  if (!latestResponse) {
    return (
      <div className="p-4">
        <div className="border border-black/10 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
              Test #{scenario.id}
            </span>
            <TestResultBadge result="pending" size="md" />
          </div>
          <p className="text-sm font-medium text-black mb-1">{scenario.name}</p>
          <p className="text-xs text-black/50">&ldquo;{scenario.input}&rdquo;</p>
        </div>
        <p className="text-center text-xs text-black/40">Waiting for response...</p>
      </div>
    );
  }

  const evaluation = evaluateTest(scenario, latestResponse);

  return (
    <div className="p-4 space-y-4">
      {/* Test Header */}
      <div className="border border-black/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
              Test #{scenario.id}
            </span>
            <span className="text-[10px] text-black/30">{scenario.category}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold ${
            evaluation.overall === "pass"
              ? "bg-emerald-100 text-emerald-700"
              : evaluation.overall === "partial"
              ? "bg-amber-100 text-amber-700"
              : "bg-red-100 text-red-700"
          }`}>
            <TestResultBadge result={evaluation.overall} />
            {evaluation.overall === "pass" ? "PASSED" : evaluation.overall === "partial" ? "PARTIAL" : "FAILED"}
          </div>
        </div>
        <p className="text-sm font-medium text-black mb-1">{scenario.name}</p>
        <p className="text-xs text-black/50 mb-2">&ldquo;{scenario.input}&rdquo;</p>
        <p className="text-xs text-black/40 leading-relaxed">{scenario.description}</p>
      </div>

      {/* Test Results Detail */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40 px-1">
          Validation Results
        </p>

        {/* UX Mode */}
        <TestResultRow
          label="UX Mode"
          expected={evaluation.details.ux_mode.expected}
          actual={evaluation.details.ux_mode.actual}
          result={evaluation.details.ux_mode.result}
        />

        {/* Risk Level */}
        <TestResultRow
          label="Risk Level"
          expected={evaluation.details.risk_level.expected}
          actual={evaluation.details.risk_level.actual}
          result={evaluation.details.risk_level.result}
        />

        {/* Primary Intent */}
        <TestResultRow
          label="Primary Intent"
          expected={evaluation.details.primary_intent.expected}
          actual={evaluation.details.primary_intent.actual}
          result={evaluation.details.primary_intent.result}
        />

        {/* Required Components */}
        <div className="bg-black/[0.02] rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-black/60">Required Components</span>
            <TestResultBadge result={evaluation.details.required_components.result} />
          </div>
          <div className="flex flex-wrap gap-1 mb-1">
            {evaluation.details.required_components.expected.map(comp => {
              const present = evaluation.details.required_components.actual.includes(comp);
              return (
                <span
                  key={comp}
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    present
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {comp} {present ? "✓" : "✗"}
                </span>
              );
            })}
          </div>
          {evaluation.details.required_components.missing.length > 0 && (
            <p className="text-[10px] text-red-600">
              Missing: {evaluation.details.required_components.missing.join(", ")}
            </p>
          )}
        </div>

        {/* Forbidden Components */}
        {evaluation.details.forbidden_components && (
          <div className="bg-black/[0.02] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-black/60">Forbidden Components</span>
              <TestResultBadge result={evaluation.details.forbidden_components.result} />
            </div>
            {evaluation.details.forbidden_components.found.length > 0 ? (
              <p className="text-[10px] text-red-600">
                Found forbidden: {evaluation.details.forbidden_components.found.join(", ")}
              </p>
            ) : (
              <p className="text-[10px] text-emerald-600">
                None found (correct)
              </p>
            )}
          </div>
        )}

        {/* Safety Alert */}
        {evaluation.details.safety_alert && (
          <TestResultRow
            label="Safety Alert Level"
            expected={evaluation.details.safety_alert.expected || "none"}
            actual={evaluation.details.safety_alert.actual || "none"}
            result={evaluation.details.safety_alert.result}
          />
        )}

        {/* Free Text Allowed */}
        <TestResultRow
          label="Free Text Allowed"
          expected={evaluation.details.free_text_allowed.expected ? "Yes" : "No"}
          actual={evaluation.details.free_text_allowed.actual ? "Yes" : "No"}
          result={evaluation.details.free_text_allowed.result}
        />
      </div>

      {/* Notes */}
      {scenario.expectations.notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 mb-1">
            Test Notes
          </p>
          <p className="text-xs text-blue-800 leading-relaxed">
            {scenario.expectations.notes}
          </p>
        </div>
      )}
    </div>
  );
}

// Test Result Row Component
function TestResultRow({
  label,
  expected,
  actual,
  result,
}: {
  label: string;
  expected: string | null;
  actual: string | null;
  result: TestResult;
}) {
  return (
    <div className="flex items-center justify-between bg-black/[0.02] rounded-lg px-3 py-2">
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-black/60">{label}</span>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-black/40">Expected: <span className="text-black/70">{expected || "—"}</span></span>
          <span className="text-black/20">|</span>
          <span className="text-black/40">Got: <span className={`${
            result === "pass" ? "text-emerald-700" : result === "partial" ? "text-amber-700" : "text-red-700"
          }`}>{actual || "—"}</span></span>
        </div>
      </div>
      <TestResultBadge result={result} size="md" />
    </div>
  );
}
