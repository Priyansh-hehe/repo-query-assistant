/**
 * ===============================================================================
 * FILE: frontend/src/components/Navbar.tsx
 * COMPONENT: Navigation Header & Live Backend Health Monitor
 * 
 * WHAT THIS FILE DOES:
 * --------------------
 * 1. Displays the top-level application branding and identity: "Codebase RAG".
 * 2. Features an automated live backend health monitor that displays whether
 *    the FastAPI server on port 8000 is online or offline in real-time.
 * 
 * WHY IT MATTERS FOR DEVELOPER EXPERIENCE:
 * ----------------------------------------
 * In decoupled architectures (Next.js frontend on 3000, FastAPI backend on 8000),
 * developers often forget to start the backend or wonder why queries fail silently.
 * This component provides immediate visual feedback via a pulsating status dot.
 * ===============================================================================
 */

"use client";

import React from "react";

interface NavbarProps {
  isBackendOnline: boolean | null; // null = checking, true = healthy, false = disconnected
}

export default function Navbar({ isBackendOnline }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">
                Codebase<span className="text-cyan-400">RAG</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono">
                v1.0
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Tree-sitter AST &bull; ChromaDB ONNX &bull; Gemini 3.6 Flash
            </p>
          </div>
        </div>

        {/* Live Backend Connectivity Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium">
            {isBackendOnline === null ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-zinc-400">Connecting to API...</span>
              </>
            ) : isBackendOnline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400">FastAPI Online :8000</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-rose-400">Backend Disconnected</span>
              </>
            )}
          </div>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-400 hover:text-cyan-400 transition-colors hidden md:flex items-center gap-1"
          >
            <span>Swagger UI</span>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
