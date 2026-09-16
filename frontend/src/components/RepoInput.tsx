/**
 * ===============================================================================
 * FILE: frontend/src/components/RepoInput.tsx
 * COMPONENT: Prominent Repository URL Ingestion Bar
 * 
 * WHAT THIS FILE DOES:
 * --------------------
 * 1. Provides a prominent, full-width input space in the center of the application
 *    for developers to paste any public GitHub repository URL.
 * 2. Invokes the backend `POST /api/index` endpoint via our typed `api.ts` client.
 * 3. Shows animated loading states while the backend clones, parses AST, and
 *    embeds the codebase into ChromaDB.
 * 4. Displays real-time indexing statistics upon completion and notifies parent
 *    components to register the new repo in the 3-bar sidebar drawer.
 * 
 * USER EXPERIENCE HIGHLIGHTS:
 * ----------------------------
 * - Clean, non-gimmicky developer aesthetics (no distracting AI badges).
 * - High-contrast focus rings and keyboard-friendly submission.
 * - Clear error states for malformed or inaccessible GitHub URLs.
 * ===============================================================================
 */

"use client";

import React, { useState } from "react";
import { indexRepository, IndexStats } from "../services/api";

interface RepoInputProps {
  onIndexComplete: (newRepoName: string) => void;
}

export default function RepoInput({ onIndexComplete }: RepoInputProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latestStats, setLatestStats] = useState<IndexStats | null>(null);

  const handleIndexSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = repoUrl.trim();

    if (!cleanUrl) {
      setErrorMessage("Please enter a valid GitHub repository URL.");
      return;
    }

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      setErrorMessage("Repository URL must begin with https:// (e.g. https://github.com/psf/requests).");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLatestStats(null);

    try {
      const response = await indexRepository(cleanUrl);
      setLatestStats(response.stats);
      setRepoUrl("");
      onIndexComplete(response.stats.repo_name);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unknown error occurred while indexing.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-xl backdrop-blur-sm">
      <form onSubmit={handleIndexSubmit} className="space-y-3">
        {/* Prominent Wide Input Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black dark:text-white">
              {/* GitHub Link Icon */}
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
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="Paste public GitHub repository link (e.g. https://github.com/psf/requests)..."
              disabled={isLoading}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-black dark:text-white placeholder:text-black dark:placeholder:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all disabled:opacity-50 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !repoUrl.trim()}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-shrink-0"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Indexing Repository...</span>
              </>
            ) : (
              <>
                <span>Index Repo</span>
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
              </>
            )}
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-2.5">
            <svg
              className="w-4 h-4 flex-shrink-0 text-rose-500 dark:text-rose-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert with Indexing Stats */}
        {latestStats && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <svg
                className="w-4 h-4 flex-shrink-0 text-emerald-500 dark:text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>
                Indexed <strong className="text-zinc-900 dark:text-white font-mono">{latestStats.repo_name}</strong> into local vector store.
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs text-emerald-700 dark:text-emerald-400">
              <span>{latestStats.total_chunks} chunks</span>
              {typeof latestStats.duration_seconds === "number" && (
                <>
                  <span>&bull;</span>
                  <span>{latestStats.duration_seconds.toFixed(1)}s</span>
                </>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
