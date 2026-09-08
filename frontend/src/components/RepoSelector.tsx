/**
 * ===============================================================================
 * FILE: frontend/src/components/RepoSelector.tsx
 * COMPONENT: Active Codebase Switcher Dropdown
 * 
 * WHAT THIS FILE DOES:
 * --------------------
 * 1. Displays all repositories stored in the local SQLite metadata database.
 * 2. Allows developers to switch the active context between different indexed repos.
 * 3. Shows repository metadata badges (total AST chunks and indexing date).
 * 
 * WHY IT MATTERS:
 * ----------------
 * In a multi-repo development workflow, users want to switch between asking
 * questions about `requests`, `fastapi`, or their own internal project without
 * re-indexing every time. This leverages our persistent ChromaDB + SQLite architecture.
 * ===============================================================================
 */

"use client";

import React from "react";
import { RepoMetadata } from "../services/api";

interface RepoSelectorProps {
  repositories: RepoMetadata[];
  selectedRepo: string;
  onSelectRepo: (repoName: string) => void;
  isLoading: boolean;
}

export default function RepoSelector({
  repositories,
  selectedRepo,
  onSelectRepo,
  isLoading,
}: RepoSelectorProps) {
  const currentRepo = repositories.find((r) => r.repo_name === selectedRepo);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300">
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
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>
        <div>
          <span className="text-xs font-medium text-zinc-400">Target Codebase:</span>
          <div className="text-sm font-semibold text-white">
            {currentRepo ? currentRepo.repo_name : "No repository selected"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <select
          value={selectedRepo}
          onChange={(e) => onSelectRepo(e.target.value)}
          disabled={isLoading || repositories.length === 0}
          className="w-full sm:w-64 px-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors disabled:opacity-50"
        >
          {repositories.length === 0 ? (
            <option value="">No indexed repos found</option>
          ) : (
            repositories.map((repo) => (
              <option key={repo.repo_name} value={repo.repo_name}>
                {repo.repo_name} ({repo.total_chunks} chunks)
              </option>
            ))
          )}
        </select>

        {currentRepo && (
          <span className="text-[11px] px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-cyan-400 font-mono hidden md:inline-block">
            {currentRepo.total_chunks} chunks
          </span>
        )}
      </div>
    </div>
  );
}
