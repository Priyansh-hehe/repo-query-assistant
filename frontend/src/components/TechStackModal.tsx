/**
 * ===============================================================================
 * FILE: frontend/src/components/TechStackModal.tsx
 * COMPONENT: Architecture & Tech Stack Modal Dialog
 * 
 * WHAT THIS FILE DOES:
 * --------------------
 * 1. Isolates all technical explanations, framework details, and architectural
 *    highlights into a sleek, on-demand modal triggered from the Navbar.
 * 2. Keeps the main UI clean, professional, and uncluttered (less "AI-demo" like).
 * 3. Explains the zero-cost architecture (Tree-sitter AST, ChromaDB ONNX, SQLite,
 *    Gemini 3.6 Flash, and FastAPI).
 * ===============================================================================
 */

"use client";

import React from "react";

interface TechStackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TechStackModal({ isOpen, onClose }: TechStackModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 transition-colors">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Engine Architecture & Tech Stack
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                A decoupled, production-grade zero-cost Code RAG system
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body: Tech Specs Grid */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Card 1: Tree-sitter AST & Call Graph */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-base text-zinc-900 dark:text-zinc-200">
                Tree-sitter AST & Call Graph Extraction
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-medium">
                Parsing & Graph Layer
              </span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Extracts complete functions, methods, and classes along with exact 1-indexed line ranges.
              Recursively traces AST call expressions (<code className="font-mono text-zinc-800 dark:text-zinc-300">CALLS</code>) and module imports (<code className="font-mono text-zinc-800 dark:text-zinc-300">IMPORTS</code>) across files.
            </p>
          </div>

          {/* Card 2: GraphRAG & SQLite */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-base text-zinc-900 dark:text-zinc-200">
                Hybrid GraphRAG & SQLite Metadata
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-medium">
                Topological Graph & Cache
              </span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Stores 1-hop topological call graphs in indexed SQLite tables.
              Enriches retrieved vector chunks with exact caller-callee chains so Gemini knows which files invoke or import each function without guessing.
            </p>
          </div>

          {/* Card 3: Local ONNX ChromaDB */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-base text-zinc-900 dark:text-zinc-200">
                ChromaDB + Local ONNX Vectors
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                Vector Store
              </span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Uses the <code className="font-mono text-zinc-800 dark:text-zinc-300">all-MiniLM-L6-v2</code> ONNX
              model running locally on CPU. Embeds 800+ chunks in ~3-5 seconds with zero API costs, zero cloud rate limits, and multi-user concurrency.
            </p>
          </div>

          {/* Card 4: Gemini Flash-Lite */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-base text-zinc-900 dark:text-zinc-200">
                Google Gemini Flash + Guardrails
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono font-medium">
                Generative AI
              </span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Official native Google GenAI SDK integration with dual-mode prompt guardrails:
              Balanced Conversational Mode & Strict Zero-Hallucination Mode with verified line citations, AST call graphs, and direct GitHub permalinks.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
