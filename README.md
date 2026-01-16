# Project Remedy - UX Assembly Demo

A medical guidance chatbot that uses AI-driven modular UI components to provide structured health responses. Instead of generating long-form prose, the AI decides which UI components to display based on user intent, risk level, and safety considerations.

**Built by [Late Checkout Agency](https://www.latecheckout.agency)**

## Overview

Traditional chatbots return walls of text. Project Remedy takes a different approach: the AI analyzes each user question and returns a structured JSON response that maps to specific UI components. This creates focused, actionable responses that are safer and easier to consume for health-related queries.

## How It Works

```
User Question → API Route → OpenAI (with rules) → Structured JSON → UI Components
```

### Data Flow

1. **User submits a question** (Frontend: `Chat.tsx`)
   - Collects the message + full conversation history
   - Sends to `/api/chat` with `isNewConversation` flag

2. **API processes the request** (Backend: `/api/chat/route.ts`)
   - Counts consecutive clarifying questions (max 2 allowed)
   - Builds OpenAI messages array with system prompt + conversation history
   - Injects context (clarifying question count, limit warnings)
   - Calls OpenAI with JSON response format enforced

3. **OpenAI returns structured JSON** with 9 sections:
   - `intent_detection` - Primary intent, risk level, reasoning
   - `ux_mode` - informational / clarification / emergency
   - `guardrails` - What's allowed/blocked
   - `structured_response` - Content for each component
   - `component_selection` - Which components to include
   - `final_ui` - The authoritative UI output
   - `exit_state` - Input state after response

4. **API validates and processes** (`buildFinalUI.ts`)
   - Safety net: Removes clarifying questions if limit exceeded
   - Validates component rules
   - Returns processed response to frontend

5. **Frontend renders UI components** (`ResponseRenderer.tsx`)
   - Maps `final_ui.components` array to React components
   - No business logic—just renders what the API tells it

### Key Design Decisions

- **Frontend is "dumb"**: All intelligence lives in the prompt and API
- **AI fills out a form**: Instead of writing prose, AI populates structured fields
- **Rules engine as safety net**: `buildFinalUI` catches anything the AI misses
- **Conversation context preserved**: Full history sent to maintain multi-turn coherence

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI Provider:** OpenAI (gpt-4o-mini)
- **Deployment:** Vercel

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts     # API orchestration layer
│   ├── globals.css           # Global styles + animations
│   └── page.tsx
├── components/
│   ├── Chat.tsx              # Main chat interface
│   ├── DebugPanel.tsx        # System analysis panel
│   ├── TestScenarios.tsx     # Test scenario grid
│   └── remedy/
│       ├── ResponseRenderer.tsx  # Maps JSON to components
│       ├── Summary.tsx           # Main response text
│       ├── SafetyAlert.tsx       # Warning messages
│       ├── ClarifyingQuestion.tsx # Follow-up questions
│       ├── Checklist.tsx         # Action items
│       ├── CTA.tsx               # Call-to-action buttons
│       ├── Sources.tsx           # Reference links
│       └── Button.tsx            # Reusable button
├── lib/
│   └── buildFinalUI.ts       # Rules engine / safety net
├── data/
│   └── testScenarios.ts      # Test cases with expectations
└── prompts/
    └── remedy-ux-assembly-lite.ts  # System prompt
```

## UX Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Informational** | Low risk queries | Standard response with optional safety note |
| **Clarification** | Ambiguous symptoms | Ask follow-up question before answering |
| **Emergency** | High risk indicators | Immediate guidance, urgent CTAs, suppress extras |

## UI Components

| Component | Purpose |
|-----------|---------|
| `summary` | Main response text with inline citations |
| `safety_alert` | Warning messages (informational/caution/emergency) |
| `clarifying_question` | Follow-up question with selectable options |
| `checklist` | Action items (2-5 items) |
| `cta` | Call-to-action buttons (primary + optional secondary) |
| `sources` | Reference links with previews |
| `return_to_conversation` | Exit structured flow |

## Key Rules

- Max **2 clarifying questions** per conversation, then must answer
- Max **1 primary CTA**, secondary only outside triage
- **No CTA** when clarifying question is present
- **Emergency mode** suppresses non-essential UI components
- Clarifying questions **disable free text input**

## Debug Panel

The debug panel shows real-time system analysis:

- **Overview Tab**: Intent detection, risk level, UX mode, component selection
- **JSON Tab**: Full API response
- **Test Results Tab**: Pass/fail evaluation when running test scenarios

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/PaulLoots/project-remedy-ux-assembly-demo.git
cd project-remedy-ux-assembly-demo

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

```
OPENAI_API_KEY=your_openai_api_key_here
```

## Test Scenarios

14 pre-built test scenarios validate the system across all modes:

- **Informational Mode** - Basic explanations
- **Medication Guidance** - Drug safety queries
- **Clarification Mode** - Ambiguous symptoms
- **Emergency Mode** - Urgent triage
- **Navigation** - Care system routing
- **Prevention** - Wellness guidance
- **Chronic Care** - Ongoing condition management
- **Stress Test** - Complex/hybrid questions

Each test validates: UX mode, risk level, intent detection, required components, forbidden components, and input state.

## Architecture Considerations

### What This POC Demonstrates

- AI classification → structured JSON → component rendering pipeline
- Multi-turn conversation with context preservation
- Rules-based guardrails (clarifying question limits, component rules)
- Intent and risk-based UI adaptation

### Production Considerations

For production deployment, consider:

- **Intent stability rules**: Confidence thresholds to prevent abrupt mode switching
- **Context window limits**: Cap conversation history to manage costs
- **Fallback UI**: Graceful degradation when AI returns malformed responses
- **Retry logic**: Handle API failures
- **Latency monitoring**: Track p50/p95 response times
- **Separate orchestration service**: Decouple from Next.js for scalability

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Links

- **Repository**: https://github.com/PaulLoots/project-remedy-ux-assembly-demo
- **Figma Design**: [Project Remedy Design](https://www.figma.com/design/icvB7zuoFgdjk0aAvYKaHH/Loblaw-Digital---Project-Remedy?node-id=2148-1141)
- **Built by**: [Late Checkout Agency](https://www.latecheckout.agency)

## License

Confidential - For demonstration purposes only.
