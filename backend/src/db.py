"""
===============================================================================
FILE: backend/src/db.py
MODULE: SQLite Relational Metadata Manager

WHAT THIS FILE DOES:
--------------------
This module manages our local relational database (`backend/data/metadata.db`)
using Python's standard library `sqlite3` (100% free, zero external setup).
While ChromaDB handles high-dimensional vector search, SQLite acts as the
project registry, keeping track of which GitHub repositories have been cloned,
how many code chunks they contain, and when they were last indexed.

KEY RESPONSIBILITIES & IMPLEMENTATIONS:
1. Connection Lifecycle (`get_db_connection`):
   - Establishes a connection to `data/metadata.db`.
   - Uses `sqlite3.Row` so database records can be accessed like Python dictionaries.
2. Schema Migration (`init_db`):
   - Automatically creates the `repositories` table with:
     [id, repo_name, repo_url, local_path, total_chunks, indexed_at].
3. Upsert Logic (`register_or_update_repo`):
   - Uses `INSERT ... ON CONFLICT(repo_name) DO UPDATE` so re-indexing an existing
     repository updates its chunk count and timestamp instead of throwing an error.
4. Queries (`get_repo`, `list_repos`):
   - Fast lookup to verify if a repo is already indexed before re-running the
     cloning or vector embedding pipeline.
===============================================================================
"""

import sqlite3
from typing import List, Dict, Any, Optional
from pathlib import Path
from src.config import SQLITE_DB_PATH


def get_db_connection() -> sqlite3.Connection:
    """Creates a thread-safe connection to the local SQLite database."""
    conn = sqlite3.connect(str(SQLITE_DB_PATH))
    conn.row_factory = sqlite3.Row  # Returns rows as dictionary-like objects
    return conn


def init_db():
    """Initializes the SQLite database schema if it doesn't already exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS repositories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            repo_name TEXT UNIQUE NOT NULL,
            repo_url TEXT NOT NULL,
            local_path TEXT NOT NULL,
            total_chunks INTEGER DEFAULT 0,
            indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()


def register_or_update_repo(repo_name: str, repo_url: str, local_path: str, total_chunks: int):
    """Inserts a new repository record or updates the chunk count and timestamp."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO repositories (repo_name, repo_url, local_path, total_chunks, indexed_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(repo_name) DO UPDATE SET
            total_chunks = excluded.total_chunks,
            indexed_at = CURRENT_TIMESTAMP;
    """, (repo_name, repo_url, local_path, total_chunks))
    conn.commit()
    conn.close()


def get_repo(repo_name: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single repository record by name."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM repositories WHERE repo_name = ?", (repo_name,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def list_repos() -> List[Dict[str, Any]]:
    """Lists all repositories currently indexed in the system."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM repositories ORDER BY indexed_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
