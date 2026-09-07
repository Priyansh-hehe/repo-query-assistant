"""
===============================================================================
FILE: backend/test_indexer.py
SCRIPT: Step 3 & 4 Verification (Local ONNX Embeddings, ChromaDB & SQLite)

WHAT THIS SCRIPT DOES:
----------------------
This script verifies the entire vector indexing and semantic retrieval pipeline
powered by ChromaDB's local ONNX embedding model (`all-MiniLM-L6-v2`).

WHAT IT TESTS:
1. Ingestion & AST Parsing: Downloads the target GitHub repo and extracts all
   semantic code chunks.
2. Local ONNX Embeddings: Converts code chunks into dense vectors locally on
   the CPU in seconds (with ZERO API keys and ZERO rate limits).
3. ChromaDB Storage: Persists all vectors, code text, and AST metadata into local
   vector storage (`backend/data/chroma_db/`).
4. SQLite Registry: Confirms repository records are saved in `backend/data/metadata.db`.
5. Interactive Vector Search: Asks the user for a natural-language question,
   converts the question into a vector, and queries ChromaDB to return the top 3
   closest code chunks with their cosine similarity distance!
===============================================================================
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from src.indexer import index_repository, query_similar_chunks
from src.db import list_repos

def main():
    print("=" * 65)
    print(" ChromaDB Local ONNX Indexer & Semantic Search Test ")
    print("=" * 65)
    print("[*] Embedding Engine: Local ONNX (all-MiniLM-L6-v2)")
    print("[*] Zero Rate Limits | Zero API Overhead | 100% Free")
    print("-" * 65)

    default_url = "https://github.com/bottlepy/bottle"
    user_url = input(f"\nEnter GitHub repository URL [Press Enter for '{default_url}']: ").strip()
    repo_url = user_url if user_url else default_url

    print("\n[*] Starting indexing pipeline...")
    stats = index_repository(repo_url, progress_callback=lambda msg: print(f"  -> {msg}"))

    print("\n[OK] Indexing completed!")
    print(f"  - Repository: {stats['repo_name']}")
    print(f"  - Files Processed: {stats['total_files']}")
    print(f"  - Chunks Embedded & Stored in ChromaDB: {stats['total_chunks']}")

    # Verify SQLite tracking
    print("\n[*] Verifying SQLite metadata table:")
    repos = list_repos()
    for r in repos:
        print(f"  - {r['repo_name']} | {r['total_chunks']} chunks | Indexed: {r['indexed_at']}")

    # Test Vector Similarity Query
    test_query = input("\nEnter a test question to search the codebase: ").strip()
    if not test_query:
        test_query = "How is routing or HTTP request handled?"

    print(f"\n[*] Running semantic similarity search for: '{test_query}'")
    matches = query_similar_chunks(stats['repo_name'], test_query, top_k=3)

    print(f"\n[OK] Found top {len(matches)} matching chunks from ChromaDB:")
    for i, m in enumerate(matches, 1):
        print(f"\n--- Result #{i} (Cosine Distance: {m['distance']:.4f}) ---")
        print(f"Location: {m['file_path']} (Lines {m['start_line']} - {m['end_line']})")
        print(f"Entity:   {m['entity_type']} {m['entity_name']}")
        print(f"Code Preview:\n{m['code'][:200]}...")

    print("\n" + "=" * 65)
    print(" Step 3 & 4 Verification Succeeded! ")
    print("=" * 65)

if __name__ == "__main__":
    main()
