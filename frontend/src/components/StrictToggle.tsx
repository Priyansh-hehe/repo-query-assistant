/**
 * ===============================================================================
 * FILE: frontend/src/components/StrictToggle.tsx
 * COMPONENT: Zero-Hallucination Guardrail Toggle Switch
 * 
 * WHAT THIS FILE DOES:
 * --------------------
 * 1. Provides an intuitive UI switch allowing developers to toggle between
 *    Balanced Conversational Mode and Strict Zero-Hallucination Mode.
 * 2. Visualizes the exact operational behavior of the underlying Gemini prompt.
 * 
 * INTERVIEW & ARCHITECTURAL HIGHLIGHT:
 * -------------------------------------
 * Standard LLMs often hallucinate method signatures or invent plausible-sounding
 * logic when queried about internal codebases. Our dual-mode system gives developers
 * full control:
 * - Balanced: Natural conversational flow, polite greetings, and cited repository QA.
 * - Strict: Hardcoded zero-hallucination boundary. The LLM is forbidden from
 *   speculating and must strictly ground all statements in verified AST chunks.
 * ===============================================================================
 */

"use client";

import React from "react";

interface StrictToggleProps {
  strictMode: boolean;
  onToggle: (newValue: boolean) => void;
  disabled?: boolean;
}

export default function StrictToggle({
  strictMode,
  onToggle,
  disabled = false,
}: StrictToggleProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
      <div className="flex items-center gap-2.5">
        <div
          className={`p-1.5 rounded-lg transition-colors ${
            strictMode
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-zinc-800 text-zinc-400"
          }`}
        >
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
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-200">
              Strict Zero-Hallucination Mode
            </span>
            {strictMode && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Guarded
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400">
            {strictMode
              ? "Refuses speculation. Only answers from verified code chunks."
              : "Balanced mode: Conversational reasoning with grounded citations."}
          </p>
        </div>
      </div>

      {/* Pill Toggle Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={strictMode}
        disabled={disabled}
        onClick={() => onToggle(!strictMode)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          strictMode ? "bg-amber-500" : "bg-zinc-700"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            strictMode ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
