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
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950/70 overflow-hidden text-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="flex-shrink-0 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-semibold border border-cyan-500/20">
            Citation #{index + 1}
          </span>
          <span className="font-mono text-zinc-800 dark:text-zinc-200 truncate font-medium text-xs sm:text-sm">
            {citation.file_path}
          </span>
          {citation.entity_name && (
            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-xs hidden sm:inline">
              {citation.entity_name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {citation.github_url && (
            <a
              href={citation.github_url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Jump to code on GitHub"
              className="px-2.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 hover:text-cyan-600 dark:text-zinc-300 dark:hover:text-cyan-400 font-mono text-xs flex items-center gap-1 transition-colors border border-zinc-200 dark:border-zinc-700"
            >
              <span>GitHub ↗</span>
            </a>
          )}
          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
            L{citation.start_line} - L{citation.end_line}
          </span>
          <svg
            className={`w-4 h-4 text-zinc-400 transform transition-transform duration-200 ${
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
        <div className="border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950">
          {/* AST Call Graph & Dependencies (GraphRAG) */}
          {citation.dependencies && (
            (citation.dependencies.calls?.length || 0) > 0 ||
            (citation.dependencies.called_by?.length || 0) > 0 ||
            (citation.dependencies.imports?.length || 0) > 0
          ) && (
            <div className="px-4 py-2.5 bg-zinc-100/60 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800/60 space-y-1.5 text-xs font-mono">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                AST Dependency & Call Graph
              </div>
              {citation.dependencies.calls && citation.dependencies.calls.length > 0 && (
                <div className="flex items-baseline flex-wrap gap-1.5">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Calls:</span>
                  {citation.dependencies.calls.slice(0, 6).map((c, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 text-[11px] border border-cyan-500/20">
                      {c}
                    </span>
                  ))}
                  {citation.dependencies.calls.length > 6 && (
                    <span className="text-zinc-400 text-[10px]">+{citation.dependencies.calls.length - 6} more</span>
                  )}
                </div>
              )}
              {citation.dependencies.called_by && citation.dependencies.called_by.length > 0 && (
                <div className="flex items-baseline flex-wrap gap-1.5">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Called by:</span>
                  {citation.dependencies.called_by.slice(0, 4).map((c, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-[11px] border border-emerald-500/20">
                      {c}
                    </span>
                  ))}
                </div>
              )}
              {citation.dependencies.imports && citation.dependencies.imports.length > 0 && (
                <div className="flex items-baseline flex-wrap gap-1.5">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Imports:</span>
                  {citation.dependencies.imports.slice(0, 4).map((m, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-300 text-[11px] border border-violet-500/20">
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-3.5 font-mono text-xs overflow-x-auto text-zinc-800 dark:text-zinc-300 max-h-64 leading-relaxed">
            <pre>
              <code>{citation.snippet || citation.code}</code>
            </pre>
          </div>
          {citation.github_url && (
            <div className="px-4 py-2.5 bg-zinc-100/80 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 font-mono text-xs truncate max-w-[260px] sm:max-w-none">
                {citation.file_path}#L{citation.start_line}-L{citation.end_line}
              </span>
              <a
                href={citation.github_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline font-medium font-mono text-xs"
              >
                <span>Jump to line on GitHub &rarr;</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
