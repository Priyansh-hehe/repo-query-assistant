import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from src.config import GOOGLE_API_KEY, ENV_FILE
from src.indexer import index_repository, query_similar_chunks
from src.db import list_repos

def main():
    print("=" * 65)
    print(" ChromaDB + Google Embeddings Indexer Test ")
    print("=" * 65)

    # Check for Google API key
    if not GOOGLE_API_KEY:
        print("[!] GOOGLE_API_KEY is missing!")
        print(f"    Please open the file: {ENV_FILE}")
        print("    And add your free Google AI Studio key:")
        print("    GOOGLE_API_KEY=AIzaSy...")
        print("\n    Get your free key at: https://aistudio.google.com/")
        print("=" * 65)
        return

    print("[*] GOOGLE_API_KEY detected successfully!")

    default_url = "https://github.com/octocat/Hello-World"
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
        test_query = "What does this repository do?"

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
