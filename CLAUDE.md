# Project Remedy - UX Assembly Demo

## Overview
Remedy UX Assembly Demo - A medical guidance chatbot that provides structured, focused responses to health questions. Instead of long-form text, the system uses a modular UI where AI decides which UI components to display based on user intent, risk level, and safety considerations.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI Provider:** OpenAI (gpt-5-mini)
- **Deployment:** Vercel

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts       # OpenAI chat completions endpoint
│   ├── globals.css            # Global styles + custom animations
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Chat.tsx               # Main chat interface with reset + test integration
│   ├── DebugPanel.tsx         # Collapsible debug panel with test results
│   ├── TestScenarios.tsx      # Landing UI grid for test scenarios
│   └── remedy/
│       ├── index.ts           # Component exports
│       ├── types.ts           # TypeScript interfaces
│       ├── ResponseRenderer.tsx  # Assembles UI from JSON response
│       ├── ResponseLoader.tsx # Loading skeleton with animations
│       ├── Button.tsx         # Reusable button component
│       ├── Summary.tsx        # Main response text with inline citations
│       ├── SafetyAlert.tsx    # Warning messages (informational/caution/emergency)
│       ├── ClarifyingQuestion.tsx  # Follow-up questions with options
│       ├── Checklist.tsx      # Action items list
│       ├── CTA.tsx            # Call-to-action buttons
│       ├── Sources.tsx        # Reference links with hover previews
│       └── ReturnToConversation.tsx  # Exit structured flow
├── data/
│   └── testScenarios.ts       # 12 test scenarios with expectations + evaluation
└── prompts/
    └── remedy-ux-assembly-lite.ts  # System prompt for JSON-structured responses
```

## System Architecture

### How It Works
1. User submits a health-related question
2. AI evaluates intent, risk level, and safety
3. AI returns structured JSON (not prose) with 9 sections:
   - `user_input` - Original question
   - `intent_detection` - Primary/secondary intents, risk level, reasoning
   - `ux_mode` - Selected mode and why
   - `guardrails` - What's allowed/blocked
   - `structured_response` - Content for each component
   - `component_selection` - Which components to include
   - `stacking_and_limits` - Order and rules
   - `final_ui` - Authoritative UI output
   - `exit_state` - Input state after response
4. Frontend renders appropriate UI components based on `final_ui`

### UX Modes
- **informational** - Low risk, standard response
- **clarification** - Ambiguous risk, needs more info
- **emergency** - High risk, urgent guidance

### Intents (Guardrails)
- Triage (Urgent)
- Medication Guidance
- Explain
- Navigate the Care System
- Planning & Prevention
- Chronic Condition Management

### UI Components (MVP)
- `summary` - Main response text
- `safety_alert` - Warning/caution messages (informational/caution/emergency)
- `clarifying_question` - Follow-up question with options
- `checklist` - Action items (2-5 items)
- `cta` - Call-to-action buttons (primary + optional secondary)
- `sources` - Reference links (2-4 max)
- `return_to_conversation` - Exit structured flow

### Safety Alert Levels
- **informational** - Gray background, horizontal layout, no title
- **caution** - Amber background/border, vertical layout with title
- **emergency** - Red background/border, red title text

### Key Rules
- Max 1 primary CTA, secondary only outside triage
- No CTA when clarifying question is present
- Emergency mode suppresses non-essential UI
- Clarifying questions disable free text input

## Test Scenarios
14 pre-built test scenarios validate the UX assembly system across all modes and intents.

### Test Categories
- **Informational Mode** - Basic explanations, light safety notes
- **Medication Guidance** - Drug safety, contraindications
- **Clarification Mode** - Ambiguous symptoms, vague inputs
- **Emergency Mode** - Urgent triage, de-escalation
- **Navigation** - Care system routing
- **Prevention** - Wellness and prevention
- **Chronic Care** - Ongoing condition management
- **Stress Test** - Hybrid/complex questions

### Test Evaluation
Each test validates:
- UX mode selection (informational/clarification/emergency)
- Risk level assessment (low/medium/high)
- Primary intent detection
- Required components present
- Forbidden components absent
- Safety alert level and position
- Free text input state

Results show as: **Pass** (green), **Partial** (amber), **Fail** (red)

## Debug Panel
A collapsible panel on the right side shows system analysis:
- **Analysis Tab** - Intent detection, UX mode, guardrails, component selection
- **Rules Engine Tab** - Applied stacking rules and constraints
- **Full JSON Tab** - Complete API response
- **Test Results Tab** - Evaluation against test expectations (only visible when running a test)

### Debug Features
- Response time tracking (ms)
- Collapsible sections for each analysis area
- Color-coded risk levels and test results
- Panel icon indicates open/closed state

## Environment Variables
- `OPENAI_API_KEY` - Required. Get from https://platform.openai.com/api-keys

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## Repository
https://github.com/PaulLoots/project-remedy-ux-assembly-demo

## Figma Design
https://www.figma.com/design/icvB7zuoFgdjk0aAvYKaHH/Loblaw-Digital---Project-Remedy?node-id=2148-1141

## UI Features
- **Test Scenarios Landing** - Single column on mobile, 2-column grid on desktop
- **Reset Chat Button** - Clears conversation and returns to test scenarios (stops loading if active)
- **Response Loader** - Skeleton animation while waiting for AI response
- **Inline Citations** - Numbered references in summary text linking to sources
- **Source Hover Previews** - Tooltip showing source details on citation hover
- **Footer** - "Keep Confidential · Made by LCA" with link to latecheckout.agency (desktop only)

## Mobile Responsiveness
The app is fully responsive with mobile-first design:
- **Header** - Stacked title on mobile, inline on desktop; gradient fade background
- **Debug Panel** - Full-screen overlay on mobile with backdrop, floating panel on desktop
- **Debug Toggle** - Lab flask icon on mobile, "Debug" text + panel icon on desktop
- **Reset Button** - Icon-only on mobile, icon + text on desktop
- **Components** - All remedy components use responsive breakpoints (md: prefix)
- **Test Scenarios** - Full-width cards on mobile for better readability
- **Buttons** - Smaller padding and rounded corners on mobile
