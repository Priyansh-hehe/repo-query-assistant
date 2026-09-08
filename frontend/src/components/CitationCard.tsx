/**
 * ===============================================================================
 * FILE: frontend/src/components/CitationCard.tsx
 * COMPONENT: Grounded AST Citation Accordion
 * 
 * WHAT THIS FILE DOES:
 * --------------------
 * 1. Renders the exact source-code citations retrieved from ChromaDB that the
 *    Gemini model used to construct its answer.
 * 2. Displays the file path, entity name (function/class), and line range (1-indexed).
 * 3. Provides an interactive collapsible accordion so developers can audit the
 *    raw code snippet without cluttering the chat flow.
 * 
 * WHY CITATIONS ELIMINATE HALLUCINATION:
 * --------------------------------------
 * In production engineering, a developer cannot trust an AI response unless
 * they can verify the exact file and line number where the logic lives.
 * Tree-sitter guarantees 100% accurate 1-indexed line numbers.
 * ===============================================================================
 */

"use client";

import React, { useState } from "react";
import { Citation } from "../services/api";

interface CitationCardProps {
  citation: Citation;
  index: number;
}

export default function CitationCard({ citation, index }: CitationCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-950/70 overflow-hidden text-xs transition-all hover:border-zinc-700">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-colors"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono text-[10px] font-semibold border border-cyan-500/20">
            Citation #{index + 1}
          </span>
          <span className="font-mono text-zinc-300 truncate">
            {citation.file_path}
          </span>
          {citation.entity_name && (
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px] hidden sm:inline">
              {citation.entity_name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 font-mono text-[10px]">
            L{citation.start_line} - L{citation.end_line}
          </span>
          <svg
            className={`w-3.5 h-3.5 text-zinc-400 transform transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Collapsible Code Content */}
      {isOpen && (
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 font-mono text-[11px] overflow-x-auto text-zinc-300 max-h-64 leading-relaxed">
          <pre>
            <code>{citation.snippet}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
