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
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Chat.tsx               # Main chat interface
│   ├── DebugPanel.tsx         # Collapsible debug panel for system analysis
│   └── remedy/
│       ├── index.ts           # Component exports
│       ├── types.ts           # TypeScript interfaces
│       ├── ResponseRenderer.tsx  # Assembles UI from JSON response
│       ├── Button.tsx         # Reusable button component
│       ├── Summary.tsx        # Main response text
│       ├── SafetyAlert.tsx    # Warning messages (informational/caution/emergency)
│       ├── ClarifyingQuestion.tsx  # Follow-up questions with options
│       ├── Checklist.tsx      # Action items list
│       ├── CTA.tsx            # Call-to-action buttons
│       ├── Sources.tsx        # Reference links
│       └── ReturnToConversation.tsx  # Exit structured flow
└── prompts/
    └── remedy-ux-assembly.ts  # System prompt for JSON-structured responses
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

## Debug Panel
A collapsible panel on the right side shows system analysis:
- **User Input** - The question asked
- **Intent Detection** - Primary intent, secondary intents, risk level (color-coded), reasoning
- **UX Mode** - Selected mode and why
- **Guardrails** - Boolean flags and allowed/blocked components
- **Full JSON** - Complete API response

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
