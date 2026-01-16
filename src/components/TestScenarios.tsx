"use client";

import { testScenarios, TestScenario } from "@/data/testScenarios";

interface TestScenariosProps {
  onSelectTest: (input: string, testId: number) => void;
}

// Category colors for visual grouping
const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  "Informational Mode": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600" },
  "Medication Guidance": { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-600" },
  "Clarification Mode": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600" },
  "Emergency Mode": { bg: "bg-red-50", border: "border-red-200", text: "text-red-600" },
  "Navigation": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600" },
  "Prevention": { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-600" },
  "Chronic Care": { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-600" },
  "Stress Test": { bg: "bg-fuchsia-50", border: "border-fuchsia-200", text: "text-fuchsia-600" },
};

function TestCard({ scenario, onClick }: { scenario: TestScenario; onClick: () => void }) {
  const colors = categoryColors[scenario.category] || { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-600" };

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-start text-left p-4 rounded-xl border ${colors.border} ${colors.bg} hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer`}
    >
      {/* Category badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${colors.text}`}>
          {scenario.category}
        </span>
        <span className="text-[10px] text-black/30">#{scenario.id}</span>
      </div>

      {/* Input string - prioritized */}
      <p className="text-sm font-medium text-black leading-snug mb-2 line-clamp-2">
        &ldquo;{scenario.input}&rdquo;
      </p>

      {/* Test name - de-prioritized */}
      <p className="text-xs text-black/40">
        {scenario.name}
      </p>

      {/* Hover indicator */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={colors.text}>
          <path
            d="M6 3L11 8L6 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </button>
  );
}

export function TestScenarios({ onSelectTest }: TestScenariosProps) {
  // Split into two columns
  const leftColumn = testScenarios.slice(0, 6);
  const rightColumn = testScenarios.slice(6, 12);

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-lg font-bold text-black mb-2">Test Scenarios</h2>
        <p className="text-sm text-black/50 max-w-md mx-auto">
          Click any scenario to run it through the UX Assembly system and validate the response.
        </p>
      </div>

      {/* Grid layout - 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="flex flex-col gap-3">
          {leftColumn.map((scenario) => (
            <TestCard
              key={scenario.id}
              scenario={scenario}
              onClick={() => onSelectTest(scenario.input, scenario.id)}
            />
          ))}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3">
          {rightColumn.map((scenario) => (
            <TestCard
              key={scenario.id}
              scenario={scenario}
              onClick={() => onSelectTest(scenario.input, scenario.id)}
            />
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <p className="text-center text-xs text-black/30 mt-6">
        Or type your own question in the input below
      </p>
    </div>
  );
}
