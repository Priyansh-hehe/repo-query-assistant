"""
===============================================================================
FILE: backend/main.py
MODULE: FastAPI Web Server & REST API Gateway

WHAT THIS FILE DOES:
--------------------
This is the official public interface and entry point for the backend.
It exposes our Python AI engine (Ingestion, Tree-sitter, ChromaDB, SQLite, and
Gemini Flash RAG) as high-performance, asynchronous REST API endpoints.

KEY RESPONSIBILITIES & IMPLEMENTATIONS:
1. Application Lifecycle & Middleware:
   - Configures FastAPI with metadata, interactive docs, and OpenAPI schema.
   - Sets up `CORSMiddleware` (Cross-Origin Resource Sharing) allowing the
     Next.js frontend (http://localhost:3000) to communicate without browser security blocks.
2. Pydantic Request Validation:
   - `IndexRepoRequest`: Validates incoming GitHub URLs.
   - `QueryCodebaseRequest`: Validates query payloads (repo_name, question, strict_mode, top_k).
3. Public REST Endpoints:
   - `GET /`: Friendly root status with a link to interactive documentation.
   - `GET /api/health`: Health-check endpoint for cloud monitoring and deployment.
   - `GET /api/repos`: Retrieves all indexed repositories from SQLite for frontend dropdowns.
   - `POST /api/index`: Triggers full shallow clone, AST parsing, and ChromaDB vector indexing.
   - `POST /api/query`: Executes grounded RAG retrieval, Gemini generation, and returns citations.
4. Interactive Swagger UI:
   - Automatically available at: http://localhost:8000/docs
===============================================================================
"""

import sys
from pathlib import Path
from typing import List, Dict, Any, Optional

# Add backend directory to sys.path so we can import from src
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.append(str(backend_dir))

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.db import list_repos, get_repo, init_db
from src.indexer import index_repository
from src.rag_engine import answer_question

# Initialize SQLite tables on startup
init_db()

# Create FastAPI application
app = FastAPI(
    title="Codebase Intelligence RAG API",
    description="A production-grade, zero-cost Code RAG backend powered by Tree-sitter, ChromaDB, and Google Gemini.",
    version="1.0.0"
)

# -----------------------------------------------------------------------------
# CORS Middleware Configuration
# Allows Next.js (port 3000) and any local client to send requests
# -----------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------------
# Pydantic Schemas for Request & Response Validation
# -----------------------------------------------------------------------------
class IndexRepoRequest(BaseModel):
    repo_url: str = Field(
        ...,
        description="Public GitHub repository URL to clone and index",
        example="https://github.com/psf/requests"
    )


class QueryCodebaseRequest(BaseModel):
    repo_name: str = Field(
        ...,
        description="Identifier of the indexed repository (e.g. 'psf_requests')",
        example="psf_requests"
    )
    question: str = Field(
        ...,
        description="Natural language question about the codebase",
        example="How does session management handle cookies?"
    )
    strict_mode: bool = Field(
        default=False,
        description="If True, strictly limits answers to 100% verified code evidence and refuses speculation"
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=15,
        description="Number of relevant code chunks to retrieve from ChromaDB"
    )


# -----------------------------------------------------------------------------
# REST API Endpoints
# -----------------------------------------------------------------------------
@app.get("/", tags=["Root"])
def root_endpoint():
    """Returns a welcome message and points developers to the Swagger UI."""
    return {
        "message": "Welcome to the Codebase Intelligence RAG API!",
        "interactive_docs": "/docs",
        "health_check": "/api/health"
    }


@app.get("/api/health", tags=["System"])
def health_check():
    """Health check endpoint for deployment monitoring."""
    return {"status": "healthy", "service": "codebase-rag-backend"}


@app.get("/api/repos", tags=["Repositories"])
def get_indexed_repositories():
    """
    Retrieves the list of all currently indexed repositories from SQLite.
    Used by the frontend to populate repository selector dropdowns.
    """
    try:
        repos = list_repos()
        return {"count": len(repos), "repositories": repos}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch repositories: {str(e)}"
        )


@app.post("/api/index", tags=["Repositories"])
def index_new_repository(request: IndexRepoRequest):
    """
    Clones a public GitHub repository, parses its AST syntax into functions
    and classes via Tree-sitter, embeds the chunks into local ChromaDB, and
    records metadata in SQLite.
    """
    repo_url = request.repo_url.strip()
    if not repo_url.startswith("http"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid repository URL. Please provide a valid HTTP/HTTPS GitHub URL."
        )

    try:
        stats = index_repository(repo_url)
        return {
            "status": "success",
            "message": f"Successfully indexed repository: {stats['repo_name']}",
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Indexing failed: {str(e)}"
        )


@app.post("/api/query", tags=["RAG Intelligence"])
def query_repository_codebase(request: QueryCodebaseRequest):
    """
    Executes grounded RAG question-answering:
    1. Validates repository exists in SQLite.
    2. Retrieves top-K nearest code chunks from local ChromaDB.
    3. Assembles an open-book evidence prompt.
    4. Calls Google Gemini Flash to synthesize a cited, grounded explanation.
    """
    # Verify repository is indexed
    existing_repo = get_repo(request.repo_name)
    if not existing_repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository '{request.repo_name}' has not been indexed yet. Please call /api/index first."
        )

    try:
        result = answer_question(
            repo_name=request.repo_name,
            question=request.question,
            top_k=request.top_k,
            strict_mode=request.strict_mode
        )

        # Construct direct GitHub line anchors for every citation
        clean_repo_url = existing_repo.get("repo_url", "").rstrip("/")
        if clean_repo_url.endswith(".git"):
            clean_repo_url = clean_repo_url[:-4]

        enriched_citations = []
        for c in result.get("citations", []):
            start = c.get("start_line", 1)
            end = c.get("end_line", 1)
            line_anchor = f"#L{start}-L{end}" if start != end else f"#L{start}"
            github_url = f"{clean_repo_url}/blob/HEAD/{c.get('file_path', '')}{line_anchor}" if clean_repo_url else None
            code_text = c.get("code") or c.get("snippet", "")

            enriched_citations.append({
                **c,
                "snippet": code_text,
                "code": code_text,
                "github_url": github_url
            })

        return {
            "repo_name": request.repo_name,
            "question": request.question,
            "strict_mode": request.strict_mode,
            "answer": result["answer"],
            "citations": enriched_citations,
            "cached": result.get("cached", False)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to answer question: {str(e)}"
        )


# -----------------------------------------------------------------------------
# Standalone Execution Support (e.g. `python backend/main.py`)
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI server on http://localhost:8000 ...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
