"use client";

import { useState, useRef, useEffect } from "react";
import { ResponseRenderer, ResponseLoader } from "./remedy";
import { DebugPanel } from "./DebugPanel";
import { TestScenarios } from "./TestScenarios";

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
  [key: string]: unknown;
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
  const [lastLoadTime, setLastLoadTime] = useState<number | null>(null);
  const [activeTestId, setActiveTestId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadStartTimeRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    // Use a small delay to ensure DOM has fully updated, then scroll
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  };

  // Scroll when messages change or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || inputDisabled) return;

    // Clear test results if this is a follow-up message (not the initial test)
    if (messages.length > 0) {
      setActiveTestId(null);
    }

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLatestUserQuestion(input.trim());
    setIsLoading(true);
    loadStartTimeRef.current = Date.now();

    try {
      // Format messages with structured data for conversation history
      const formattedMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content,
        structured: m.structured ? {
          ux_mode: m.structured.ux_mode,
          response_content: m.structured,
        } : undefined,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: formattedMessages, isNewConversation: true }),
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
          content: "Sorry, something went wrong. Please try again.",
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
      if (loadStartTimeRef.current) {
        setLastLoadTime(Date.now() - loadStartTimeRef.current);
      }
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    console.log("Option selected:", option);
    setInputDisabled(false);
    // Clear test results after first response (follow-up is no longer the test scenario)
    setActiveTestId(null);
    // Send the selected option as a new message
    const userMessage: Message = { role: "user", content: option };
    setMessages([...messages, userMessage]);
    // Trigger a new API call with the selected option
    handleOptionSubmit(option);
  };

  const handleOptionSubmit = async (option: string) => {
    setIsLoading(true);
    loadStartTimeRef.current = Date.now();
    const newMessages = [...messages, { role: "user" as const, content: option }];

    try {
      // Format messages with structured data for conversation history
      const formattedMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content,
        structured: m.structured ? {
          ux_mode: m.structured.ux_mode,
          response_content: m.structured,
        } : undefined,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: formattedMessages, isNewConversation: false }),
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
          content: "Sorry, something went wrong. Please try again.",
          structured: null,
        };
        setMessages([...newMessages, assistantMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      const assistantMessage: Message = {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        structured: null,
      };
      setMessages([...newMessages, assistantMessage]);
    } finally {
      if (loadStartTimeRef.current) {
        setLastLoadTime(Date.now() - loadStartTimeRef.current);
      }
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

  const handleResetChat = () => {
    setMessages([]);
    setInput("");
    setIsLoading(false);
    setInputDisabled(false);
    setLatestUserQuestion("");
    setLastLoadTime(null);
    setActiveTestId(null);
    loadStartTimeRef.current = null;
  };

  const handleSelectTest = (testInput: string, testId: number) => {
    setActiveTestId(testId);
    setInput(testInput);
    // Auto-submit after a brief delay to show the input
    setTimeout(() => {
      // Manually trigger the submit logic
      const userMessage: Message = { role: "user", content: testInput };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput("");
      setLatestUserQuestion(testInput);
      setIsLoading(true);
      loadStartTimeRef.current = Date.now();

      // Call API
      (async () => {
        try {
          const formattedMessages = newMessages.map(m => ({
            role: m.role,
            content: m.content,
            structured: m.structured ? {
              ux_mode: m.structured.ux_mode,
              response_content: m.structured,
            } : undefined,
          }));

          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: formattedMessages, isNewConversation: true }),
          });

          const data = await response.json();
          console.log("API Response:", JSON.stringify(data, null, 2));

          if (!response.ok) {
            throw new Error(data.error || "Failed to get response");
          }

          if (data.success && data.structured) {
            const structured = data.structured as StructuredResponse;
            if (structured.exit_state?.waiting_for_structured_input) {
              setInputDisabled(true);
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
              content: "Sorry, something went wrong. Please try again.",
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
          if (loadStartTimeRef.current) {
            setLastLoadTime(Date.now() - loadStartTimeRef.current);
          }
          setIsLoading(false);
        }
      })();
    }, 100);
  };

  // Get the latest structured response for debug panel
  const latestStructuredResponse = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.structured)?.structured || null;

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex">
      {/* Main Chat Area - shifts left when panel is open on desktop */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          debugPanelOpen ? "md:mr-[418px]" : "mr-0"
        }`}
      >
        {/* Header - Fixed within chat area, shifts with content when debug panel opens */}
        <div className={`fixed top-0 left-0 z-20 transition-all duration-300 ${
          debugPanelOpen ? "right-[418px]" : "right-0"
        } max-md:right-0`}>
          <div className="px-4 py-3 md:px-6 md:py-4 bg-gradient-to-b from-[#f5f5f5] via-[#f5f5f5] to-transparent">
            <div className="flex items-center justify-between">
              {/* Left side - Title: stacked on mobile, inline on desktop */}
              <div className="flex flex-col md:flex-row md:items-baseline md:gap-2">
                <p className="text-black font-bold text-xs md:text-base uppercase tracking-wide">
                  Project Remedy
                </p>
                <span className="hidden md:inline text-black/30 text-base">·</span>
                <p className="text-black/50 font-medium text-xs md:text-base">Assembled UI Demo</p>
              </div>

              {/* Right side - Action buttons */}
              <div className="flex items-center gap-1 md:gap-2">
                {/* Reset button - only show when there are messages or loading */}
                {(messages.length > 0 || isLoading) && (
                  <button
                    onClick={handleResetChat}
                    className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="md:w-4 md:h-4"
                    >
                      <path
                        d="M2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C5.87827 2 4.0066 3.12058 3 4.80385"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M3 2V5H6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="hidden md:inline">Reset</span>
                  </button>
                )}

                {/* Debug toggle button */}
                <button
                  onClick={() => setDebugPanelOpen(!debugPanelOpen)}
                  className={`flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-lg transition-colors ${
                    debugPanelOpen
                      ? "text-black bg-black/5"
                      : "text-black/60 hover:text-black hover:bg-black/5"
                  }`}
                >
                  {/* Mobile: Lab flask icon */}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="md:hidden"
                  >
                    <path
                      d="M9 3V8.4C9 8.84 8.78 9.25 8.43 9.52L3.71 13.19C2.65 13.99 2 15.22 2 16.52V18C2 20.21 3.79 22 6 22H18C20.21 22 22 20.21 22 18V16.52C22 15.22 21.35 13.99 20.29 13.19L15.57 9.52C15.22 9.25 15 8.84 15 8.4V3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M8 3H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M6 15H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="10" cy="18" r="1" fill="currentColor" />
                    <circle cx="14" cy="17" r="0.75" fill="currentColor" />
                  </svg>
                  {/* Desktop: Debug text + panel icon */}
                  <span className="hidden md:inline">Debug</span>
                  <svg
                    width="16"
                    height="14"
                    viewBox="0 0 20 16"
                    fill="none"
                    className="hidden md:block"
                  >
                    <path
                      d={debugPanelOpen ? "M8 3L13 8L8 13" : "M10 3L5 8L10 13"}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M17 2V14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area - Full screen with padding for header and input */}
        <div className="flex-1 scrollbar-stable flex flex-col gap-4 md:gap-6 justify-end px-0 pt-[60px] md:pt-[100px] pb-[100px] md:pb-[120px]">
          {/* Show test scenarios when no messages */}
          {messages.length === 0 && !isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <TestScenarios onSelectTest={handleSelectTest} />
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className="w-full max-w-[520px] mx-auto px-3 md:px-0 animate-fade-in-up opacity-0"
              style={{ animationFillMode: "forwards" }}
            >
              {message.role === "user" ? (
                // User message - right aligned with bubble
                <div className="flex flex-col items-end px-2 md:px-5">
                  <div className="bg-black/5 border border-black/10 rounded-[22px] px-4 py-2 max-w-[85%] md:max-w-[380px]">
                    <p className="text-[#1e1e1e] text-sm md:text-base leading-[1.2] tracking-[-0.32px]">
                      {message.content}
                    </p>
                  </div>
                </div>
              ) : message.structured?.final_ui ? (
                // Assistant structured response - left aligned, no bubble
                <div className="flex flex-col items-start max-w-full md:max-w-[380px]">
                  <ResponseRenderer
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    finalUI={message.structured.final_ui as any}
                    onOptionSelect={handleOptionSelect}
                    onCTAClick={handleCTAClick}
                    onReturnToConversation={handleReturnToConversation}
                  />
                </div>
              ) : (
                // Fallback text response
                <div className="flex flex-col items-start px-2 md:px-5 max-w-full md:max-w-[380px]">
                  <p className="text-black text-sm md:text-base whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div
              className="w-full max-w-[520px] mx-auto px-3 md:px-0 animate-fade-in-up opacity-0"
              style={{ animationFillMode: "forwards" }}
            >
              <div className="flex flex-col items-start max-w-full md:max-w-[380px]">
                <ResponseLoader
                  isLoading={isLoading}
                  onLoadTimeUpdate={setLastLoadTime}
                />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-1 shrink-0" />
        </div>

        {/* Prompt Bar - Fixed at bottom, centered in main area */}
        <div
          className={`fixed bottom-4 md:bottom-8 w-full max-w-[520px] px-3 md:px-4 transition-all duration-300 ${
            debugPanelOpen
              ? "md:left-[calc(50%-200px)] md:-translate-x-1/2 left-1/2 -translate-x-1/2"
              : "left-1/2 -translate-x-1/2"
          }`}
        >
          <form
            onSubmit={handleSubmit}
            className={`bg-white border border-black/20 rounded-[28px] md:rounded-[34px] p-1.5 md:p-2 shadow-sm transition-opacity duration-300 ${
              inputDisabled ? "opacity-40" : "opacity-100"
            }`}
          >
            <div className="flex items-center gap-2 pl-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  inputDisabled
                    ? "Please select an option above"
                    : messages.length === 0
                    ? "Ask a health-related question"
                    : "Ask a follow-up"
                }
                className="flex-1 py-1.5 md:py-2 text-sm md:text-base font-medium text-black placeholder:text-[#a6a6a6] bg-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || inputDisabled}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim() || inputDisabled}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                aria-label="Send message"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="md:w-5 md:h-5"
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
        loadTimeMs={lastLoadTime}
        activeTestId={activeTestId}
      />

      {/* Footer - Bottom right (hidden on mobile) */}
      <div className={`hidden md:block fixed bottom-4 z-10 text-xs text-black/40 transition-all duration-300 ${
        debugPanelOpen ? "right-[430px]" : "right-4"
      }`}>
        <span>Keep Confidential · Made by </span>
        <a
          href="https://www.latecheckout.agency/#hero"
          target="_blank"
          rel="noopener noreferrer"
          className="text-black/50 hover:text-black/70 underline underline-offset-2 transition-colors"
        >
          LCA
        </a>
      </div>
    </div>
  );
}
