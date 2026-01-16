import { NextRequest, NextResponse } from "next/server";
import { REMEDY_UX_ASSEMBLY_LITE_PROMPT } from "@/prompts/remedy-ux-assembly-lite";
import { buildFinalUI, AIResponse } from "@/lib/buildFinalUI";

// Types for conversation messages
interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  structured?: {
    ux_mode?: { mode: string };
    response_content?: {
      summary?: string;
      clarifying_question?: {
        question: string;
        options: string[];
      };
    };
  };
}

interface ChatRequest {
  messages: ConversationMessage[];
  isNewConversation?: boolean;
}

/**
 * Count consecutive clarifying questions in the conversation history.
 * Walks backwards from the end, counting assistant responses with ux_mode === "clarification".
 * Stops when it hits a non-clarifying response or the start of conversation.
 */
function countConsecutiveClarifyingQuestions(messages: ConversationMessage[]): number {
  let count = 0;

  // Walk backwards through messages
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];

    if (msg.role === "assistant") {
      // Check if this was a clarification mode response
      if (msg.structured?.ux_mode?.mode === "clarification") {
        count++;
      } else {
        // Found a non-clarifying assistant response, stop counting
        break;
      }
    }
    // User messages (answers to clarifying questions) don't break the count
  }

  return count;
}

/**
 * Build conversation history for OpenAI from the message array.
 * Extracts meaningful content from structured responses.
 */
function buildConversationHistory(messages: ConversationMessage[]): Array<{ role: "user" | "assistant"; content: string }> {
  return messages.map((msg) => {
    if (msg.role === "user") {
      return { role: "user" as const, content: msg.content };
    }

    // For assistant messages, extract meaningful content from structured data
    if (msg.structured) {
      const parts: string[] = [];

      // Include summary if present
      if (msg.structured.response_content?.summary) {
        parts.push(msg.structured.response_content.summary);
      }

      // Include clarifying question if present
      if (msg.structured.response_content?.clarifying_question) {
        const cq = msg.structured.response_content.clarifying_question;
        parts.push(`I asked: "${cq.question}" with options: ${cq.options.join(", ")}`);
      }

      return {
        role: "assistant" as const,
        content: parts.join("\n\n") || "[structured response]",
      };
    }

    // Fallback for messages without structured data
    return {
      role: "assistant" as const,
      content: msg.content || "[response]",
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const { messages, isNewConversation = true }: ChatRequest = await request.json();

    // Get the latest user message
    const userMessages = messages.filter((m) => m.role === "user");
    const latestUserMessage = userMessages[userMessages.length - 1]?.content || "";

    // Count consecutive clarifying questions (reset if new conversation)
    const clarifyingCount = isNewConversation ? 0 : countConsecutiveClarifyingQuestions(messages);
    const clarifyingExhausted = clarifyingCount >= 2;

    // Build the system prompt with context injection
    let systemPrompt = REMEDY_UX_ASSEMBLY_LITE_PROMPT.replace(
      '"<USER QUESTION HERE>"',
      `"${latestUserMessage}"`
    );

    // Inject clarifying question context
    const contextInjection = `

## CURRENT CONVERSATION CONTEXT
- Clarifying questions asked so far: ${clarifyingCount}/2
${clarifyingExhausted ? `
**CRITICAL: CLARIFYING_QUESTIONS_EXHAUSTED**
You have already asked 2 clarifying questions. You MUST provide a definitive answer NOW.
Do NOT include a clarifying_question in your response. Provide your best assessment with the information gathered.
` : ""}`;

    systemPrompt += contextInjection;

    // Build conversation history for multi-turn context
    const conversationHistory = buildConversationHistory(messages);

    // Build OpenAI messages array
    const openAIMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: openAIMessages,
        max_completion_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || "API request failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    let parsedResponse: AIResponse | null = null;
    let parseError = null;

    try {
      // Try direct JSON parse first
      parsedResponse = JSON.parse(rawContent);
    } catch {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[1].trim());
        } catch (e) {
          parseError = `Failed to parse JSON from code block: ${e}`;
        }
      } else {
        // Try to find JSON object in the response
        const jsonObjectMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          try {
            parsedResponse = JSON.parse(jsonObjectMatch[0]);
          } catch (e) {
            parseError = `Failed to parse extracted JSON: ${e}`;
          }
        } else {
          parseError = "No valid JSON found in response";
        }
      }
    }

    // If we got a valid AI response, apply frontend rules to build final UI
    let buildResult = null;
    if (parsedResponse && parsedResponse.intent_detection && parsedResponse.ux_mode && parsedResponse.response_content) {
      // Pass clarifying count for safety net enforcement
      buildResult = buildFinalUI(parsedResponse, clarifyingCount);
    }

    return NextResponse.json({
      success: !!parsedResponse && !!buildResult,
      // Include both AI response and frontend-computed results
      structured: parsedResponse ? {
        // Original AI analysis (for debug panel)
        intent_detection: parsedResponse.intent_detection,
        ux_mode: parsedResponse.ux_mode,
        response_content: parsedResponse.response_content,
        // Frontend-computed (for rendering and debug)
        ...(buildResult || {}),
        // Add clarifying question tracking info
        clarifying_context: {
          count: clarifyingCount + (parsedResponse.ux_mode?.mode === "clarification" ? 1 : 0),
          max: 2,
          exhausted: clarifyingExhausted,
        },
      } : null,
      rawContent: rawContent,
      parseError: parseError,
      debug: {
        finishReason: data.choices?.[0]?.finish_reason || "unknown",
        model: data.model,
        usage: data.usage,
        promptVersion: "lite",
        conversationTurns: messages.length,
        clarifyingQuestionsAsked: clarifyingCount,
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
