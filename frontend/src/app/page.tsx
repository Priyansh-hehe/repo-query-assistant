/**
 * ===============================================================================
 * FILE: frontend/src/app/page.tsx
 * COMPONENT: Main Application Dashboard & RAG Orchestrator
 * 
 * WHAT THIS FILE DOES:
 * --------------------
 * This is the central control center that orchestrates the entire user experience:
 * 1. Manages global UI state:
 *    - `isSidebarOpen`: Controls the 3-bar slide-out drawer on the left.
 *    - `isTechStackOpen`: Controls the on-demand architecture modal.
 *    - `isBackendOnline`: Health pulse from FastAPI (`GET /api/health`).
 *    - `repositories`: List of indexed repos loaded from SQLite (`GET /api/repos`).
 *    - `selectedRepo`: The currently active repository targeted by the user.
 *    - `strictMode`: Zero-Hallucination guardrail toggle (passed to Navbar).
 *    - `messages`: Chronological conversation history with citations.
 *    - `isQuerying`: Loading spinner status during Gemini Flash RAG synthesis.
 * 2. Glues all modular UI components together in a clean, uncluttered layout:
 *    - Navbar with 3-bar menu trigger, Tech Stack modal button & Strict Mode toggle.
 *    - Slide-out Sidebar with smooth CSS transitions.
 *    - Full-width centered GitHub URL input covering the major part of the screen.
 *    - Centered Chat Window with citations and instant SQLite caching.
 * ===============================================================================
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import TechStackModal from "../components/TechStackModal";
import RepoInput from "../components/RepoInput";
import ChatWindow, { ChatMessage } from "../components/ChatWindow";
import {
  checkHealth,
  getRepositories,
  queryCodebase,
  RepoMetadata,
} from "../services/api";

export default function Home() {
  // Global State
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [repositories, setRepositories] = useState<RepoMetadata[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [strictMode, setStrictMode] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState<boolean>(true);

  // Navigation Drawers & Modals
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isTechStackOpen, setIsTechStackOpen] = useState<boolean>(false);

  // 1. Check Backend Health on Mount & periodically
  const verifyBackendHealth = useCallback(async () => {
    try {
      await checkHealth();
      setIsBackendOnline(true);
    } catch {
      setIsBackendOnline(false);
    }
  }, []);

  // 2. Fetch Indexed Repositories from SQLite
  const loadRepositories = useCallback(async (autoSelectLatest?: string) => {
    setIsLoadingRepos(true);
    try {
      const response = await getRepositories();
      setRepositories(response.repositories);

      if (autoSelectLatest) {
        setSelectedRepo(autoSelectLatest);
      } else if (response.repositories.length > 0 && !selectedRepo) {
        // Default to the first indexed repo
        setSelectedRepo(response.repositories[0].repo_name);
      }
    } catch (err) {
      console.error("Failed to load repositories:", err);
    } finally {
      setIsLoadingRepos(false);
    }
  }, [selectedRepo]);

  // Initial load
  useEffect(() => {
    verifyBackendHealth();
    loadRepositories();

    // Heartbeat check every 30 seconds
    const interval = setInterval(verifyBackendHealth, 30000);
    return () => clearInterval(interval);
  }, [verifyBackendHealth, loadRepositories]);

  // Callback when a new repo is indexed in RepoInput
  const handleIndexComplete = (newRepoName: string) => {
    loadRepositories(newRepoName);
    setSelectedRepo(newRepoName);
    // Smoothly reveal the 3-bar drawer so user sees the newly indexed repository
    setIsSidebarOpen(true);
  };

  // Callback when the user sends a question in ChatWindow
  const handleSendMessage = async (question: string) => {
    if (!selectedRepo) return;

    const userMessageId = `user-${Date.now()}`;
    const userTimestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newUserMsg: ChatMessage = {
      id: userMessageId,
      sender: "user",
      text: question,
      timestamp: userTimestamp,
    };

    // Optimistic UI update: display user question immediately
    setMessages((prev) => [...prev, newUserMsg]);
    setIsQuerying(true);

    try {
      const result = await queryCodebase(selectedRepo, question, strictMode, 8);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: result.answer,
        citations: result.citations,
        cached: result.cached,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate answer.";
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: "assistant",
        text: `⚠️ Error: ${errorMessage}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsQuerying(false);
    }
  };

  const activeRepoMeta = repositories.find((r) => r.repo_name === selectedRepo);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <Navbar
        isBackendOnline={isBackendOnline}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenTechStack={() => setIsTechStackOpen(true)}
        strictMode={strictMode}
        onToggleStrictMode={setStrictMode}
        isQuerying={isQuerying}
      />

      {/* 3-Bar Slide-Out Pull Window (Drawer) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        repositories={repositories}
        selectedRepo={selectedRepo}
        onSelectRepo={setSelectedRepo}
        isLoading={isLoadingRepos}
      />

      {/* Tech Stack Modal Dialog */}
      <TechStackModal
        isOpen={isTechStackOpen}
        onClose={() => setIsTechStackOpen(false)}
      />

      {/* Main Content Dashboard: Centered, Focused Developer Layout */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Backend Warning Banner if Offline */}
        {isBackendOnline === false && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-sm flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold">Backend server is not reachable</p>
                <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-0.5">
                  Ensure the server is running by executing:{" "}
                  <code className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-900 font-mono text-zinc-800 dark:text-zinc-200">
                    python backend/main.py
                  </code>
                </p>
              </div>
            </div>
            <button
              onClick={verifyBackendHealth}
              className="px-3 py-1.5 rounded-lg bg-amber-200 dark:bg-amber-500/20 hover:bg-amber-300 dark:hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-medium border border-amber-300 dark:border-amber-500/30 transition-colors flex-shrink-0"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* 1. Centered Hero Link Pasting Space (Covers Major Width) */}
        <section className="w-full">
          <RepoInput onIndexComplete={handleIndexComplete} />
        </section>

        {/* 2. Active Repository Status Strip */}
        <section className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 shadow-sm text-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-black dark:text-zinc-300 font-semibold">Target Codebase:</span>
            {selectedRepo ? (
              <div className="flex items-center gap-2.5 truncate">
                <span className="font-bold text-black dark:text-white truncate font-mono text-sm sm:text-base">
                  {selectedRepo}
                </span>
                {activeRepoMeta && (
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-medium hidden sm:inline">
                    {activeRepoMeta.total_chunks} chunks
                  </span>
                )}
              </div>
            ) : (
              <span className="text-zinc-600 dark:text-zinc-400 italic font-medium">None selected</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1.5 font-medium flex-shrink-0"
          >
            <span>Browse Repos ({repositories.length})</span>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </section>

        {/* 3. Central Chat Window Feed */}
        <section className="w-full">
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isQuerying}
            selectedRepo={selectedRepo}
            strictMode={strictMode}
          />
        </section>
      </main>
    </div>
  );
}
