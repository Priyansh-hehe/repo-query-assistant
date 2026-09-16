/**
 * ===============================================================================
 * FILE: frontend/src/components/Navbar.tsx
 * COMPONENT: Modern Navigation Bar & Quick Controls
 * 
 * WHAT THIS FILE DOES:
 * --------------------
 * 1. Provides a 3-bar hamburger navigation button on the left to toggle the
 *    repository slide-out drawer.
 * 2. Displays the clean application branding ("Intelligent Code Query Engine").
 * 3. Incorporates the "Tech Stack" button that triggers the architectural modal.
 * 4. Integrates the compact Zero-Hallucination Strict Mode toggle directly
 *    in the header for instant accessibility without cluttering the page.
 * 5. Replaces verbose backend status text with a sleek, minimalist status dot.
 * 6. Includes Dark / Light theme switcher with local storage persistence.
 * ===============================================================================
 */

"use client";

import React from "react";
import ThemeToggle from "./ThemeToggle";
import StrictToggle from "./StrictToggle";

interface NavbarProps {
  isBackendOnline: boolean | null;
  onToggleSidebar: () => void;
  onOpenTechStack: () => void;
  strictMode: boolean;
  onToggleStrictMode: (val: boolean) => void;
  isQuerying?: boolean;
}

export default function Navbar({
  isBackendOnline,
  onToggleSidebar,
  onOpenTechStack,
  strictMode,
  onToggleStrictMode,
  isQuerying = false,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Section: 3-Bar Hamburger + Brand */}
        <div className="flex items-center gap-3">
          {/* 3-Bar Navigation Drawer Button */}
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Open repository menu"
            className="p-2 rounded-xl text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Brand Name */}
          <div>
            <h1 className="font-bold text-lg sm:text-xl text-black dark:text-white tracking-tight leading-normal">
              Intelligent Code Query Engine
            </h1>
          </div>
        </div>

        {/* Right Section: Tech Stack, Strict Mode Toggle, Theme Switcher & Minimal Status Dot */}
        <div className="flex items-center gap-3">
          {/* Tech Stack Button */}
          <button
            type="button"
            onClick={onOpenTechStack}
            className="px-3.5 py-1.5 rounded-full text-sm font-semibold bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <svg
              className="w-4 h-4 text-cyan-600 dark:text-cyan-400"
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
            <span>Tech Stack</span>
          </button>

          {/* Hallucination / Strict Mode Compact Toggle */}
          <StrictToggle
            strictMode={strictMode}
            onToggle={onToggleStrictMode}
            disabled={isQuerying}
            compact={true}
          />

          {/* Dark / Light Theme Toggle */}
          <ThemeToggle />

          {/* Minimal Connectivity Status Indicator (No "FastAPI Online" text) */}
          <div
            title={
              isBackendOnline === null
                ? "Connecting to backend..."
                : isBackendOnline
                ? "Backend connected"
                : "Backend disconnected"
            }
            className="flex items-center justify-center p-2 rounded-full"
          >
            {isBackendOnline === null ? (
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            ) : isBackendOnline ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-rose-500" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
