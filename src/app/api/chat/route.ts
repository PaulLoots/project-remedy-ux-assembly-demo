import { NextRequest, NextResponse } from "next/server";
import { REMEDY_UX_ASSEMBLY_PROMPT } from "@/prompts/remedy-ux-assembly";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // Get the latest user message
    const userMessages = messages.filter((m: { role: string }) => m.role === "user");
    const latestUserMessage = userMessages[userMessages.length - 1]?.content || "";

    // Build the system prompt with the user's question
    const systemPrompt = REMEDY_UX_ASSEMBLY_PROMPT.replace(
      '"<USER QUESTION HERE>"',
      `"${latestUserMessage}"`
    );

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: latestUserMessage },
        ],
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
    let parsedResponse = null;
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

    return NextResponse.json({
      success: !!parsedResponse,
      structured: parsedResponse,
      rawContent: rawContent,
      parseError: parseError,
      debug: {
        finishReason: data.choices?.[0]?.finish_reason || "unknown",
        model: data.model,
        usage: data.usage,
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
