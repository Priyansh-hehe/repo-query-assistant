/**
 * ===============================================================================
 * FILE: frontend/src/components/RepoInput.tsx
 * COMPONENT: GitHub Repository Ingestion & Indexing Bar
 * 
 * WHAT THIS FILE DOES:
 * --------------------
 * 1. Provides a clean input bar for developers to paste any public GitHub URL.
 * 2. Invokes the backend `POST /api/index` endpoint via our typed `api.ts` client.
 * 3. Shows animated loading states while the backend clones, parses AST, and
 *    embeds the codebase into ChromaDB.
 * 4. Displays real-time indexing statistics (number of AST chunks parsed and
 *    seconds elapsed) upon completion.
 * 
 * DESIGN HIGHLIGHTS:
 * -------------------
 * - Micro-indicators highlighting zero-cost architecture (Tree-sitter, Local ONNX).
 * - Graceful error handling for invalid URLs or network failures.
 * - Auto-triggers refresh of the repository list once indexing succeeds.
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
    <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col gap-3">
        {/* Header Title & Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
              Ingest & Index Codebase
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
            <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60">
              ⚡ Shallow Clone (--depth 1)
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60">
              🌳 Tree-sitter AST
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 hidden sm:inline">
              🧠 Local ONNX Vectors
            </span>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleIndexSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
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
              placeholder="https://github.com/psf/requests"
              disabled={isLoading}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !repoUrl.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-medium shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[150px]"
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
                <span>Indexing Code...</span>
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
        </form>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0 text-rose-400"
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
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0 text-emerald-400"
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
                Successfully indexed{" "}
                <strong className="text-white">{latestStats.repo_name}</strong> into ChromaDB!
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-emerald-400/90">
              <span>{latestStats.total_chunks} chunks</span>
              <span>&bull;</span>
              <span>{latestStats.duration_seconds.toFixed(1)}s</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
