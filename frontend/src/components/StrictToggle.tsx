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
 * 3. Supports a `compact` mode specifically designed to sit gracefully inside
 *    the top navigation bar without taking up main screen real estate.
 * ===============================================================================
 */

"use client";

import React from "react";

interface StrictToggleProps {
  strictMode: boolean;
  onToggle: (newValue: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function StrictToggle({
  strictMode,
  onToggle,
  disabled = false,
  compact = false,
}: StrictToggleProps) {
  // Compact navbar pill representation
  if (compact) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={strictMode}
        disabled={disabled}
        onClick={() => onToggle(!strictMode)}
        title={
          strictMode
            ? "Strict Zero-Hallucination Mode: Active (Refuses speculation, strictly grounded)"
            : "Balanced Mode: Conversational reasoning with grounded citations"
        }
        className={`px-3.5 py-1.5 rounded-full text-sm font-medium border flex items-center gap-2 transition-all ${
          strictMode
            ? "bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400 shadow-sm"
            : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`h-2.5 w-2.5 rounded-full transition-colors ${
            strictMode ? "bg-amber-500 animate-pulse" : "bg-zinc-400 dark:bg-zinc-600"
          }`}
        />
        <span>Strict Mode</span>
      </button>
    );
  }

  // Full card representation
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg transition-colors ${
            strictMode
              ? "bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
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
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Strict Zero-Hallucination Mode
            </span>
            {strictMode && (
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                Guarded
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
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
          strictMode ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-700"
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
