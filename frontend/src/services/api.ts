/**
 * ===============================================================================
 * FILE: frontend/src/services/api.ts
 * MODULE: Centralized REST API Service Client
 * 
 * WHAT THIS FILE DOES:
 * --------------------
 * This module is the single source of truth for all network communication
 * between the Next.js React frontend and the FastAPI Python backend.
 * 
 * WHY WE USE A DEDICATED API CLIENT LAYER:
 * -----------------------------------------
 * 1. Separation of Concerns: UI components (Navbar, ChatWindow, RepoInput) stay
 *    focused purely on presentation and state, while networking and serialization
 *    logic live exclusively here.
 * 2. End-to-End Type Safety: TypeScript interfaces defined here mirror the backend's
 *    Pydantic models (IndexRepoRequest, QueryCodebaseRequest, etc.), catching schema
 *    mismatches at compile time rather than crashing at runtime.
 * 3. Centralized Base URL & Error Handling: If the backend port or domain changes,
 *    we update `API_BASE_URL` in this single file. All network errors are intercepted
 *    and converted into readable error messages.
 * ===============================================================================
 */

// Central backend URL: defaults to localhost:8000 for local development,
// or reads from environment variable when deployed to production.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// =============================================================================
// TypeScript Interfaces (Data Contracts mirroring FastAPI Pydantic Models)
// =============================================================================

export interface HealthResponse {
  status: string;
  service: string;
}

export interface RepoMetadata {
  repo_name: string;
  repo_url: string;
  total_chunks: number;
  indexed_at: string;
}

export interface RepoListResponse {
  count: number;
  repositories: RepoMetadata[];
}

export interface IndexStats {
  repo_name: string;
  total_chunks: number;
  duration_seconds: number;
}

export interface IndexResponse {
  status: string;
  message: string;
  stats: IndexStats;
}

export interface Citation {
  file_path: string;
  entity_name: string;
  start_line: number;
  end_line: number;
  snippet?: string;
  code?: string;
  github_url?: string;
}

export interface QueryResponse {
  repo_name: string;
  question: string;
  strict_mode: boolean;
  answer: string;
  citations: Citation[];
  cached?: boolean;
}

// =============================================================================
// Helper Function: Unified Fetch Handler
// =============================================================================

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      // Attempt to extract the FastAPI error detail if provided
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData?.detail) {
          errorMessage = errorData.detail;
        }
      } catch {
        // Response was not JSON, fallback to default status text
      }
      throw new Error(errorMessage);
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected network error occurred while contacting the server.");
  }
}

// =============================================================================
// Public API Methods
// =============================================================================

/**
 * 1. Health Check
 * Polls the backend status to confirm connectivity and display the live status dot.
 */
export async function checkHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/health", {
    method: "GET",
    // Do not cache health check results
    cache: "no-store",
  });
}

/**
 * 2. Get Indexed Repositories
 * Fetches the list of all indexed repositories stored in SQLite to populate the dropdown.
 */
export async function getRepositories(): Promise<RepoListResponse> {
  return request<RepoListResponse>("/api/repos", {
    method: "GET",
    cache: "no-store",
  });
}

/**
 * 3. Index New Repository
 * Sends a public GitHub URL to clone, parse AST, embed with ONNX, and index into ChromaDB.
 */
export async function indexRepository(repoUrl: string): Promise<IndexResponse> {
  return request<IndexResponse>("/api/index", {
    method: "POST",
    body: JSON.stringify({ repo_url: repoUrl }),
  });
}

/**
 * 4. Query Codebase Intelligence
 * Sends a natural language question + strict mode flag to retrieve citations & generate an answer.
 */
export async function queryCodebase(
  repoName: string,
  question: string,
  strictMode: boolean = false,
  topK: number = 5
): Promise<QueryResponse> {
  return request<QueryResponse>("/api/query", {
    method: "POST",
    body: JSON.stringify({
      repo_name: repoName,
      question: question,
      strict_mode: strictMode,
      top_k: topK,
    }),
  });
}
