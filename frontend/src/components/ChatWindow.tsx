/**
 * ===============================================================================
 * FILE: frontend/src/components/ChatWindow.tsx
 * COMPONENT: Conversational Codebase Chat Feed & Prompt Input
 * 
 * WHAT THIS FILE DOES:
 * --------------------
 * 1. Manages and displays the conversation message history (user queries + AI answers).
 * 2. Formats AI responses with clean markdown-style spacing, code styling, and
 *    collapsible citations.
 * 3. Shows animated thinking shimmers while Gemini Flash performs retrieval & synthesis.
 * 4. Provides empty-state starter prompt suggestions so developers can immediately
 *    test the codebase without typing long prompts manually.
 * 
 * USER EXPERIENCE HIGHLIGHTS:
 * ----------------------------
 * - Auto-scrolls to the newest message upon submission.
 * - Supports keyboard shortcut: Enter to submit, Shift+Enter for multiline.
 * - Displays exact line citations at the bottom of each answer.
 * ===============================================================================
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import CitationCard from "./CitationCard";
import { Citation } from "../services/api";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  citations?: Citation[];
  timestamp: string;
  cached?: boolean;
}

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (question: string) => void;
  isLoading: boolean;
  selectedRepo: string;
  strictMode: boolean;
}

const STARTER_PROMPTS = [
  "How does session management handle cookie persistence?",
  "Where is the HTTP adapter configured?",
  "How are retries handled for connection errors?",
  "Explain the entry point of the application.",
];

export default function ChatWindow({
  messages,
  onSendMessage,
  isLoading,
  selectedRepo,
  strictMode,
}: ChatWindowProps) {
  const [inputQuestion, setInputQuestion] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when a new message arrives or loading begins
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrompt = inputQuestion.trim();
    if (!cleanPrompt || isLoading) return;

    onSendMessage(cleanPrompt);
    setInputQuestion("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      className={`flex flex-col bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden backdrop-blur-sm transition-[height] duration-500 ease-in-out ${
        messages.length === 0 ? "h-[370px]" : "h-[650px]"
      }`}
    >
      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="h-11 w-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                Ready to explore{" "}
                <span className="text-cyan-600 dark:text-cyan-400 font-mono">
                  {selectedRepo || "codebase"}
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mt-1 font-normal">
                Ask architectural questions, trace function executions, or audit
                logic with grounded line citations.
              </p>
            </div>

            {/* Quick Starter Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg pt-1">
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSendMessage(prompt)}
                  disabled={isLoading}
                  className="text-left text-xs sm:text-sm p-3 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-cyan-500/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors font-normal shadow-xs cursor-pointer"
                >
                  &ldquo;{prompt}&rdquo;
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center gap-2 mb-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                <span className="font-semibold">{msg.sender === "user" ? "You" : "Code Query AI"}</span>
                <span>&bull;</span>
                <span>{msg.timestamp}</span>
                {msg.cached && (
                  <>
                    <span>&bull;</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                      <span>⚡ Cached (&lt;1ms)</span>
                    </span>
                  </>
                )}
              </div>

              {/* Message Body */}
              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 text-sm sm:text-base leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/10"
                    : "bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/90 text-black dark:text-white shadow-sm"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-sm sm:text-base leading-relaxed">
                  {msg.text}
                </div>

                {/* Grounded Citations Drawer */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3.5 border-t border-zinc-200 dark:border-zinc-800/80 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>Verified Citations ({msg.citations.length})</span>
                    </div>

                    <div className="space-y-2">
                      {msg.citations.map((cit, idx) => (
                        <CitationCard
                          key={`${cit.file_path}-${cit.start_line}-${idx}`}
                          citation={cit}
                          index={idx}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading Shimmer while reasoning */}
        {isLoading && (
          <div className="flex flex-col items-start space-y-2">
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
              <span className="font-semibold">Code Query AI</span>
              <span>&bull;</span>
              <span className="text-cyan-600 dark:text-cyan-400 animate-pulse">
                {strictMode
                  ? "Strict retrieval & AST validation..."
                  : "Searching ChromaDB & synthesizing..."}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white text-sm flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 dark:bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-600 dark:bg-cyan-500"></span>
              </span>
              <span>Analyzing retrieved code chunks with Gemini Flash-Lite...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Query Input Box */}
      <form
        onSubmit={handleSubmit}
        className="p-3.5 sm:p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center gap-3"
      >
        <textarea
          rows={1}
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedRepo
              ? `Ask anything about ${selectedRepo}... (Enter to send)`
              : "Please select or index a repository first..."
          }
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 resize-none font-normal"
        />

        <button
          type="submit"
          disabled={isLoading || !inputQuestion.trim() || !selectedRepo}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm sm:text-base font-semibold shadow-md shadow-cyan-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
        >
          <span>Ask</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
