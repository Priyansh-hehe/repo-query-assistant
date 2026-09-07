"""
===============================================================================
FILE: backend/src/config.py
MODULE: Configuration & Environment Settings

WHAT THIS FILE DOES:
--------------------
This module serves as the central source of truth for all paths, model names,
and environment variables across the entire backend application.

KEY RESPONSIBILITIES:
1. Path Resolution: Automatically discovers the absolute paths to the project
   root, backend directory, cloned repositories folder (data/repos), local ChromaDB
   vector storage (data/chroma_db), and SQLite database (data/metadata.db).
2. Directory Creation: Ensures essential storage folders exist on startup.
3. Secret Management: Loads the GOOGLE_API_KEY from the local `.env` file using
   python-dotenv, keeping credentials safely isolated from source code.
4. Model Constants: Centralizes the exact model identifiers:
   - Embedding Model: 'gemini-embedding-001' (turns code chunks into 768-dim vectors)
   - Chat Reasoning Model: 'gemini-2.5-flash' (synthesizes answers with citations)
   - Batch Size: 50 chunks per request (to optimize network calls and stay within free-tier quotas).
===============================================================================
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Define base paths
# config.py lives in backend/src/, so parent is backend/src, parent.parent is backend/
SRC_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SRC_DIR.parent
DATA_DIR = BACKEND_DIR / "data"

# Sub-directories for storage
REPOS_DIR = DATA_DIR / "repos"
CHROMA_DIR = DATA_DIR / "chroma_db"
SQLITE_DB_PATH = DATA_DIR / "metadata.db"

# Ensure essential directories exist
REPOS_DIR.mkdir(parents=True, exist_ok=True)
CHROMA_DIR.mkdir(parents=True, exist_ok=True)

# Load environment variables from backend/.env
ENV_FILE = BACKEND_DIR / ".env"
load_dotenv(dotenv_path=ENV_FILE)

# Google AI Studio API Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()

# Model Names
# Embeddings run 100% locally via ChromaDB ONNX (Zero API limits, instant indexing)
EMBEDDING_PROVIDER = "local_onnx"
EMBEDDING_MODEL = "all-MiniLM-L6-v2 (Local ONNX)"

# Chat reasoning model uses Google Gemini 2.5 Flash
GENERATION_MODEL = "gemini-2.5-flash"

# Local ONNX batch size (can process large batches locally with zero network latency)
EMBEDDING_BATCH_SIZE = 100
