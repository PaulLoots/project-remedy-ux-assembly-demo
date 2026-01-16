"use client";

import { useState } from "react";

interface StructuredResponse {
  user_input?: {
    question: string;
  };
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
  guardrails?: {
    triage_required: boolean;
    free_text_allowed: boolean;
    follow_up_questions_allowed: boolean;
    escalation_required: boolean;
    allowed_components: string[];
    blocked_components: string[];
  };
  final_ui?: unknown;
  [key: string]: unknown;
}

interface DebugPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  latestResponse: StructuredResponse | null;
  userQuestion: string;
}

export function DebugPanel({
  isOpen,
  onToggle,
  latestResponse,
  userQuestion,
}: DebugPanelProps) {
  const [activeTab, setActiveTab] = useState<"analysis" | "json">("analysis");

  return (
    <>
      {/* Toggle Button - Fixed on right edge */}
      <button
        onClick={onToggle}
        className={`fixed top-1/2 -translate-y-1/2 z-30 bg-black text-white px-2 py-4 rounded-l-lg transition-all duration-300 hover:bg-zinc-800 ${
          isOpen ? "right-[400px]" : "right-0"
        }`}
        style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
      >
        {isOpen ? "Close" : "Debug"}
      </button>

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[400px] bg-white border-l border-black/10 shadow-lg z-20 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-black/10">
            <h2 className="text-lg font-bold text-black">System Debug</h2>
            <p className="text-sm text-black/50">
              View AI reasoning and response data
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-black/10">
            <button
              onClick={() => setActiveTab("analysis")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "analysis"
                  ? "text-black border-b-2 border-black"
                  : "text-black/50 hover:text-black/70"
              }`}
            >
              Analysis
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "json"
                  ? "text-black border-b-2 border-black"
                  : "text-black/50 hover:text-black/70"
              }`}
            >
              Full JSON
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {!latestResponse ? (
              <div className="text-center text-black/40 py-8">
                Ask a question to see the system analysis
              </div>
            ) : activeTab === "analysis" ? (
              <div className="space-y-6">
                {/* User Input */}
                <Section title="User Input">
                  <p className="text-sm text-black bg-black/5 p-3 rounded-lg">
                    {userQuestion || latestResponse.user_input?.question || "N/A"}
                  </p>
                </Section>

                {/* Intent Detection */}
                {latestResponse.intent_detection && (
                  <Section title="Intent Detection">
                    <div className="space-y-3">
                      <InfoRow
                        label="Primary Intent"
                        value={latestResponse.intent_detection.primary_intent}
                      />
                      {latestResponse.intent_detection.secondary_intents &&
                        latestResponse.intent_detection.secondary_intents.length > 0 && (
                          <InfoRow
                            label="Secondary Intents"
                            value={latestResponse.intent_detection.secondary_intents.join(", ")}
                          />
                        )}
                      <InfoRow
                        label="Risk Level"
                        value={latestResponse.intent_detection.risk_level}
                        highlight={
                          latestResponse.intent_detection.risk_level === "high"
                            ? "red"
                            : latestResponse.intent_detection.risk_level === "medium"
                            ? "amber"
                            : "green"
                        }
                      />
                      <div>
                        <p className="text-xs text-black/50 mb-1">Reasoning</p>
                        <p className="text-sm text-black bg-black/5 p-2 rounded">
                          {latestResponse.intent_detection.reasoning}
                        </p>
                      </div>
                    </div>
                  </Section>
                )}

                {/* UX Mode */}
                {latestResponse.ux_mode && (
                  <Section title="UX Mode">
                    <div className="space-y-3">
                      <InfoRow
                        label="Selected Mode"
                        value={latestResponse.ux_mode.mode}
                        highlight={
                          latestResponse.ux_mode.mode === "emergency"
                            ? "red"
                            : latestResponse.ux_mode.mode === "clarification"
                            ? "amber"
                            : "blue"
                        }
                      />
                      <div>
                        <p className="text-xs text-black/50 mb-1">Reason</p>
                        <p className="text-sm text-black bg-black/5 p-2 rounded">
                          {latestResponse.ux_mode.reason}
                        </p>
                      </div>
                    </div>
                  </Section>
                )}

                {/* Guardrails */}
                {latestResponse.guardrails && (
                  <Section title="Guardrails">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <BooleanBadge
                          label="Triage Required"
                          value={latestResponse.guardrails.triage_required}
                        />
                        <BooleanBadge
                          label="Free Text Allowed"
                          value={latestResponse.guardrails.free_text_allowed}
                        />
                        <BooleanBadge
                          label="Follow-up Questions"
                          value={latestResponse.guardrails.follow_up_questions_allowed}
                        />
                        <BooleanBadge
                          label="Escalation Required"
                          value={latestResponse.guardrails.escalation_required}
                        />
                      </div>
                      {latestResponse.guardrails.allowed_components &&
                        latestResponse.guardrails.allowed_components.length > 0 && (
                          <div>
                            <p className="text-xs text-black/50 mb-1">
                              Allowed Components
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {latestResponse.guardrails.allowed_components.map(
                                (comp, i) => (
                                  <span
                                    key={i}
                                    className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded"
                                  >
                                    {comp}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      {latestResponse.guardrails.blocked_components &&
                        latestResponse.guardrails.blocked_components.length > 0 && (
                          <div>
                            <p className="text-xs text-black/50 mb-1">
                              Blocked Components
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {latestResponse.guardrails.blocked_components.map(
                                (comp, i) => (
                                  <span
                                    key={i}
                                    className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded"
                                  >
                                    {comp}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </Section>
                )}
              </div>
            ) : (
              /* JSON Tab */
              <div className="bg-black/5 rounded-lg p-3 overflow-x-auto">
                <pre className="text-xs text-black font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(latestResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-black mb-2 uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "red" | "amber" | "green" | "blue";
}) {
  const highlightStyles = {
    red: "bg-red-100 text-red-800",
    amber: "bg-amber-100 text-amber-800",
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-black/50">{label}</p>
      <span
        className={`text-sm font-medium px-2 py-0.5 rounded ${
          highlight ? highlightStyles[highlight] : "text-black"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function BooleanBadge({ label, value }: { label: string; value: boolean }) {
  return (
    <div
      className={`text-xs px-2 py-1.5 rounded text-center ${
        value ? "bg-green-100 text-green-800" : "bg-black/5 text-black/50"
      }`}
    >
      {label}: {value ? "Yes" : "No"}
    </div>
  );
}
