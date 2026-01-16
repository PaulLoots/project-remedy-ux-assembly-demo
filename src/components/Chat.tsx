"use client";

import { useState, useRef, useEffect } from "react";
import { ResponseRenderer } from "./remedy";
import { DebugPanel } from "./DebugPanel";

// Types for the structured response
interface FinalUI {
  components: Array<{
    type: string;
    content: unknown;
  }>;
}

interface StructuredResponse {
  final_ui?: FinalUI;
  exit_state?: {
    waiting_for_structured_input: boolean;
    returns_to_free_text: boolean;
  };
  ux_mode?: {
    mode: string;
    reason: string;
  };
}

interface Message {
  role: "user" | "assistant";
  content: string;
  structured?: StructuredResponse | null;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [latestUserQuestion, setLatestUserQuestion] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || inputDisabled) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLatestUserQuestion(input.trim());
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      console.log("API Response:", JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Check if we got a successful structured response
      if (data.success && data.structured) {
        const structured = data.structured as StructuredResponse;
        console.log("Structured response:", structured);

        // Check if input should be disabled (clarifying question present)
        if (structured.exit_state?.waiting_for_structured_input) {
          setInputDisabled(true);
        }

        const assistantMessage: Message = {
          role: "assistant",
          content: "", // No text content, using structured UI
          structured: structured,
        };
        setMessages([...newMessages, assistantMessage]);
      } else {
        // Fallback if JSON parsing failed
        console.warn("Parse error:", data.parseError);
        console.log("Raw content:", data.rawContent);

        const assistantMessage: Message = {
          role: "assistant",
          content: data.rawContent || "Failed to parse response",
          structured: null,
        };
        setMessages([...newMessages, assistantMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
          structured: null,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    console.log("Option selected:", option);
    setInputDisabled(false);
    // Send the selected option as a new message
    const userMessage: Message = { role: "user", content: option };
    setMessages([...messages, userMessage]);
    // Trigger a new API call with the selected option
    handleOptionSubmit(option);
  };

  const handleOptionSubmit = async (option: string) => {
    setIsLoading(true);
    const newMessages = [...messages, { role: "user" as const, content: option }];

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      console.log("API Response:", JSON.stringify(data, null, 2));

      if (data.success && data.structured) {
        const structured = data.structured as StructuredResponse;
        if (structured.exit_state?.waiting_for_structured_input) {
          setInputDisabled(true);
        } else {
          setInputDisabled(false);
        }

        const assistantMessage: Message = {
          role: "assistant",
          content: "",
          structured: structured,
        };
        setMessages([...newMessages, assistantMessage]);
      } else {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.rawContent || "Failed to parse response",
          structured: null,
        };
        setMessages([...newMessages, assistantMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnToConversation = () => {
    console.log("Returning to conversation");
    setInputDisabled(false);
  };

  const handleCTAClick = (type: "primary" | "secondary") => {
    console.log("CTA clicked:", type);
  };

  // Get the latest structured response for debug panel
  const latestStructuredResponse = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.structured)?.structured || null;

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex">
      {/* Main Chat Area - shifts left when panel is open */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          debugPanelOpen ? "mr-[400px]" : "mr-0"
        }`}
      >
        {/* Header - Fixed top left */}
        <div className="fixed top-8 left-8 z-10">
          <p className="text-black font-bold text-base uppercase tracking-wide">
            Project Remedy
          </p>
          <p className="text-black font-bold text-4xl">Assembled UI Demo</p>
        </div>

        {/* Messages Area - Full screen with padding for header and input */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-6 justify-end px-0 pt-[160px] pb-[120px]">
          {messages.length === 0 && (
            <div className="text-center text-black/40 px-5">
              Ask a health-related question
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className="w-full max-w-[520px] mx-auto">
              {message.role === "user" ? (
                // User message - right aligned with bubble
                <div className="flex flex-col items-end px-5">
                  <div className="bg-black/5 border border-black/10 rounded-[22px] px-4 py-2 max-w-[380px]">
                    <p className="text-[#1e1e1e] text-base leading-[1.2] tracking-[-0.32px]">
                      {message.content}
                    </p>
                  </div>
                </div>
              ) : message.structured?.final_ui ? (
                // Assistant structured response - left aligned, no bubble
                <div className="flex flex-col items-start max-w-[380px]">
                  <ResponseRenderer
                    finalUI={
                      message.structured.final_ui as FinalUI & {
                        components: Array<{
                          type:
                            | "summary"
                            | "safety_alert"
                            | "clarifying_question"
                            | "checklist"
                            | "cta"
                            | "sources"
                            | "return_to_conversation";
                          content: unknown;
                        }>;
                      }
                    }
                    onOptionSelect={handleOptionSelect}
                    onCTAClick={handleCTAClick}
                    onReturnToConversation={handleReturnToConversation}
                  />
                </div>
              ) : (
                // Fallback text response
                <div className="flex flex-col items-start px-5 max-w-[380px]">
                  <p className="text-black text-base whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="w-full max-w-[520px] mx-auto">
              <div className="flex flex-col items-start px-5">
                <div className="flex space-x-2 py-4">
                  <div className="w-2 h-2 bg-black/30 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-black/30 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-2 h-2 bg-black/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Bar - Fixed at bottom, centered in main area */}
        <div
          className={`fixed bottom-8 w-full max-w-[520px] px-4 transition-all duration-300 ${
            debugPanelOpen
              ? "left-[calc(50%-200px)] -translate-x-1/2"
              : "left-1/2 -translate-x-1/2"
          }`}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-black/20 rounded-[34px] p-2 shadow-sm"
          >
            <div className="flex items-center gap-2 pl-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  inputDisabled
                    ? "Please select an option above"
                    : "How can we help?"
                }
                className="flex-1 py-2 text-base font-medium text-black placeholder:text-[#a6a6a6] bg-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || inputDisabled}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim() || inputDisabled}
                className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                aria-label="Send message"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 15.8333V4.16667"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4.16667 10L10 4.16667L15.8333 10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Debug Panel */}
      <DebugPanel
        isOpen={debugPanelOpen}
        onToggle={() => setDebugPanelOpen(!debugPanelOpen)}
        latestResponse={latestStructuredResponse}
        userQuestion={latestUserQuestion}
      />
    </div>
  );
}
