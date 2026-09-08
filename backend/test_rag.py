"""
===============================================================================
FILE: backend/test_rag.py
SCRIPT: Step 5 Verification (End-to-End Grounded RAG Chat Engine)

WHAT THIS SCRIPT DOES:
----------------------
This script is an interactive terminal chat test for our complete RAG pipeline.
It lets you ask natural-language questions about any indexed repository,
fetches the relevant code from ChromaDB, and passes it to Gemini 2.5 Flash
to generate grounded, cited answers in real-time.

WHAT IT TESTS:
1. SQLite: Lists all currently indexed repositories to choose from.
2. ChromaDB: Retrieves the top 5 nearest-neighbor code chunks.
3. Google Gemini 2.5 Flash: Generates answers citing exact files and line ranges.
4. Anti-Hallucination: Verifies that if you ask something completely unrelated,
   Gemini cleanly states that it is not present in the codebase.
===============================================================================
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from src.db import list_repos
from src.rag_engine import answer_question

def main():
    print("=" * 65)
    print(" Grounded Code RAG Chat Engine Test ")
    print("=" * 65)

    # 1. Check which repositories are indexed in SQLite
    repos = list_repos()
    if not repos:
        print("[!] No repositories indexed yet!")
        print("    Please run 'python backend/test_indexer.py' first to index a repo.")
        return

    print("\n[*] Currently Indexed Repositories:")
    for i, r in enumerate(repos, 1):
        print(f"  [{i}] {r['repo_name']} ({r['total_chunks']} chunks, indexed at {r['indexed_at']})")

    # Pick repository
    choice = input(f"\nSelect repository number [1-{len(repos)}, Press Enter for 1]: ").strip()
    idx = int(choice) - 1 if choice.isdigit() and 1 <= int(choice) <= len(repos) else 0
    selected_repo = repos[idx]["repo_name"]

    print(f"\n[*] Active Repository: {selected_repo}")
    print("[*] Type your questions below.")
    print("[*] Tip: Type ':strict' to toggle Strict Zero-Hallucination Mode on/off!")
    print("[*] Type 'exit' or 'q' to quit.")
    print("-" * 65)

    strict_mode = False

    while True:
        try:
            mode_badge = "[STRICT MODE]" if strict_mode else "[BALANCED MODE]"
            question = input(f"\n{mode_badge} [Ask a Question] > ").strip()
            if not question:
                continue
            if question.lower() in ("exit", "quit", "q"):
                print("\nGoodbye!")
                break
            if question.lower() == ":strict":
                strict_mode = not strict_mode
                status = "ACTIVATED (Codebase only, zero hallucinations)" if strict_mode else "DEACTIVATED (Conversational + codebase citations)"
                print(f"\n>>> Strict Mode is now: {status}")
                continue

            print(f"\n[*] Searching ChromaDB & Generating answer ({mode_badge})...")
            result = answer_question(selected_repo, question, top_k=5, strict_mode=strict_mode)

            print("\n" + "=" * 65)
            print(" GEMINI ANSWER (Grounded & Cited):")
            print("=" * 65)
            print(result["answer"])

            print("\n" + "-" * 65)
            print(f" SOURCES CITED ({len(result['citations'])} Chunks Retrieved from ChromaDB):")
            print("-" * 65)
            for j, c in enumerate(result["citations"], 1):
                print(f"  [{j}] {c['file_path']} (Lines {c['start_line']} - {c['end_line']}) | {c['entity_type']}: {c['entity_name']}")

        except KeyboardInterrupt:
            print("\n\nSession ended.")
            break
        except Exception as e:
            print(f"\n[Error] {e}")

if __name__ == "__main__":
    main()
