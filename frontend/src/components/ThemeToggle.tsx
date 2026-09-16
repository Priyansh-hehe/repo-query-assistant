/**
 * ===============================================================================
 * FILE: frontend/src/components/ThemeToggle.tsx
 * COMPONENT: Dark & Light Mode Switcher
 * 
 * WHAT THIS FILE DOES:
 * --------------------
 * 1. Enables instant switching between modern Dark Mode and sleek Light Mode.
 * 2. Toggles the `dark` class on the root `<html>` element for Tailwind CSS v4.
 * 3. Persists the user's preferred theme in `localStorage` so it remains active
 *    across browser refreshes.
 * ===============================================================================
 */

"use client";

import React, { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check saved preference or default to dark
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      // Default to dark mode for developer aesthetics
      document.documentElement.classList.add("dark");
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);

    // Temporarily disable all transitions for 100% instant snap
    document.documentElement.classList.add("no-transitions");

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Force synchronous browser layout reflow without transitions
    void document.documentElement.offsetHeight;

    // Restore transitions for interactive clicks on next frame
    requestAnimationFrame(() => {
      document.documentElement.classList.remove("no-transitions");
    });
  };

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-cyan-500 dark:hover:text-cyan-400 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm flex items-center justify-center"
    >
      {theme === "dark" ? (
        // Sun icon for switching to light mode
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
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon icon for switching to dark mode
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
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
