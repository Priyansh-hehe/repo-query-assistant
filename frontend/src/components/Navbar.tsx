/**
 * ===============================================================================
 * FILE: frontend/src/components/Navbar.tsx
 * COMPONENT: Navigation Header, Health Monitor & Theme Switcher
 * 
 * WHAT THIS FILE DOES:
 * --------------------
 * 1. Displays the clean application branding: "Intelligent Code Query Engine".
 * 2. Provides a Live Backend Health Monitor for the FastAPI server (:8000).
 * 3. Includes an interactive Dark / Light mode switcher with local persistence.
 * 4. Links to the interactive Swagger UI API documentation.
 * ===============================================================================
 */

"use client";

import React from "react";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  isBackendOnline: boolean | null; // null = checking, true = healthy, false = disconnected
}

export default function Navbar({ isBackendOnline }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Name */}
        <div>
          <h1 className="font-bold text-lg sm:text-xl text-zinc-900 dark:text-white tracking-tight">
            Intelligent Code Query Engine
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono hidden sm:block">
            Grounded Retrieval-Augmented Generation with Verified Citations
          </p>
        </div>

        {/* Status, Theme Switcher & Links */}
        <div className="flex items-center gap-3">
          {/* Live Backend Connectivity Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium transition-colors">
            {isBackendOnline === null ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-zinc-500 dark:text-zinc-400">Checking API...</span>
              </>
            ) : isBackendOnline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">FastAPI Online :8000</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-rose-600 dark:text-rose-400">Backend Disconnected</span>
              </>
            )}
          </div>

          {/* Dark / Light Theme Toggle */}
          <ThemeToggle />

          {/* Swagger UI link */}
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors hidden md:flex items-center gap-1"
          >
            <span>Docs</span>
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
