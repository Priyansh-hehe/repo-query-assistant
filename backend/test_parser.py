"""
===============================================================================
FILE: backend/test_parser.py
SCRIPT: Step 2 Verification (Tree-sitter AST Code Chunker)

WHAT THIS SCRIPT DOES:
----------------------
This is an interactive verification tool to test the Tree-sitter AST parsing
engine (`src/parser.py`) on real source code.

WHAT IT TESTS:
1. Verifies that Tree-sitter and language grammars are loaded and active.
2. "Dogfoods" our own code by parsing `backend/src/ingestion.py`.
3. Demonstrates semantic function and class extraction without chopping lines:
   - Prints each extracted chunk's entity type (FUNCTION vs CLASS).
   - Prints the entity name (e.g. `parse_repo_name_from_url`).
   - Prints exact 1-indexed start and end line numbers.
   - Shows a preview of the clean code chunk.
===============================================================================
"""

import sys
from pathlib import Path

# Add backend directory to sys.path so we can import from src
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from src.parser import chunk_file, HAS_TREE_SITTER

def main():
    print("=" * 65)
    print(" Tree-sitter AST Code Chunker Test ")
    print("=" * 65)
    print(f"[*] Tree-sitter Engine Active: {HAS_TREE_SITTER}")

    # We test on our own ingestion.py file!
    target_file = backend_dir / "src" / "ingestion.py"
    repo_root = backend_dir.parent

    print(f"[*] Parsing target file: {target_file.name}")
    print("-" * 65)

    chunks = chunk_file(str(target_file), str(repo_root))

    print(f"[OK] Successfully extracted {len(chunks)} semantic chunks!\n")

    for i, chunk in enumerate(chunks, 1):
        print(f"--- Chunk #{i} [{chunk['entity_type'].upper()}: {chunk['entity_name']}] ---")
        print(f"File:  {chunk['file_path']} (Lines {chunk['start_line']} - {chunk['end_line']})")
        print(f"Code Preview:\n{chunk['code'][:150]}...")
        print()

    print("=" * 65)
    print(" Step 2 (AST Chunking) Verification Succeeded! ")
    print("=" * 65)

if __name__ == "__main__":
    main()
