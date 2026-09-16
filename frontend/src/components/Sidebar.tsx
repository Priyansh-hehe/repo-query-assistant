/**
 * ===============================================================================
 * FILE: frontend/src/components/Sidebar.tsx
 * COMPONENT: Animated 3-Bar Slide-Out Navigation Drawer
 * 
 * WHAT THIS FILE DOES:
 * --------------------
 * 1. Provides a smooth, animated slide-out pull window on the left-hand side
 *    triggered by the 3-bar hamburger navigation button in the Navbar.
 * 2. Lists all indexed repositories stored in SQLite, displaying their names,
 *    chunk counts, and indexing timestamps.
 * 3. Allows one-click switching between active codebases without re-indexing.
 * 4. Automatically reveals newly indexed repositories as soon as a GitHub URL
 *    is pasted and processed.
 * 
 * USER EXPERIENCE HIGHLIGHTS:
 * ----------------------------
 * - GPU-accelerated CSS sliding transition (`transition-transform duration-300 ease-in-out`).
 * - Backdrop overlay with glassmorphism blur and click-to-close behavior.
 * - Active repository highlighting with checkmark indicator.
 * ===============================================================================
 */

"use client";

import React from "react";
import { RepoMetadata } from "../services/api";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  repositories: RepoMetadata[];
  selectedRepo: string;
  onSelectRepo: (repoName: string) => void;
  isLoading: boolean;
}

export default function Sidebar({
  isOpen,
  onClose,
  repositories,
  selectedRepo,
  onSelectRepo,
  isLoading,
}: SidebarProps) {
  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide-Out Pull Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 sm:w-96 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-base text-black dark:text-white">
                Indexed Codebases
              </h2>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                {repositories.length} {repositories.length === 1 ? "repository" : "repositories"} available
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
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

        {/* Repositories List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-zinc-600 dark:text-zinc-300 animate-pulse">
              Loading repositories...
            </div>
          ) : repositories.length === 0 ? (
            <div className="p-6 text-center space-y-2 text-zinc-600 dark:text-zinc-300">
              <p className="text-sm font-semibold text-black dark:text-white">No repositories indexed yet.</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Paste a GitHub URL in the center bar to index your first codebase!
              </p>
            </div>
          ) : (
            repositories.map((repo) => {
              const isSelected = repo.repo_name === selectedRepo;
              return (
                <button
                  key={repo.repo_name}
                  type="button"
                  onClick={() => {
                    onSelectRepo(repo.repo_name);
                    onClose();
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-900 dark:text-cyan-200 shadow-sm"
                      : "bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/80 text-black dark:text-white hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900/80"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">
                        {repo.repo_name}
                      </span>
                      {isSelected && (
                        <span className="flex-shrink-0 h-2 w-2 rounded-full bg-cyan-500" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate mt-1 font-mono">
                      {repo.repo_url}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white font-medium">
                      {repo.total_chunks} chunks
                    </span>
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                      {repo.indexed_at ? repo.indexed_at.split(" ")[0] : ""}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
          <span className="text-xs">Active: <strong className="text-zinc-900 dark:text-zinc-200 font-mono">{selectedRepo || "None"}</strong></span>
          <span className="text-xs font-mono text-zinc-400">SQLite Registry</span>
        </div>
      </aside>
    </>
  );
}
