"""
===============================================================================
FILE: backend/src/rag_engine.py
MODULE: Grounded RAG Generation Engine & Prompt Orchestrator

WHAT THIS FILE DOES:
--------------------
This is the core RAG intelligence layer where Retrieval meets Generative AI.
It takes a user's question, fetches the most relevant code chunks from ChromaDB,
assembles them into an augmented open-book prompt, enforces strict citation
and anti-hallucination rules, and calls Google Gemini 2.5 Flash to synthesize
an accurate, cited explanation.

KEY RESPONSIBILITIES & IMPLEMENTATIONS:
1. Prompt Construction (`build_rag_prompt`):
   - Formats retrieved chunks with their exact file path, entity type, name,
     and 1-indexed line ranges.
   - Enforces strict citation rules: the model MUST cite files and lines.
   - Enforces anti-hallucination: if code is missing, it must say "not found".
2. Query Orchestration (`answer_question`):
   - Validates the repository exists in SQLite (`get_repo`).
   - Retrieves top-5 nearest neighbor code chunks from ChromaDB.
   - Calls Google Gemini 2.5 Flash using the official `google-genai` SDK.
   - Returns both the generated markdown answer AND structured source citations
     so the frontend can display interactive code preview cards!
===============================================================================
"""

from typing import List, Dict, Any
from google import genai
from src.config import GOOGLE_API_KEY, GENERATION_MODEL
from src.indexer import query_similar_chunks
from src.db import get_repo


def build_rag_prompt(question: str, chunks: List[Dict[str, Any]], strict_mode: bool = False) -> str:
    """Formats the retrieved code chunks into an open-book exam prompt."""
    context_sections = []
    
    for i, chunk in enumerate(chunks, 1):
        context_sections.append(
            f"--- SOURCE CHUNK #{i} ---\n"
            f"File: {chunk['file_path']} (Lines {chunk['start_line']} - {chunk['end_line']})\n"
            f"Entity: {chunk['entity_type']} {chunk['entity_name']}\n"
            f"Code:\n{chunk['code']}\n"
        )
    
    context_text = "\n".join(context_sections)

    if strict_mode:
        instructions = """STRICT ZERO-HALLUCINATION MODE IS ACTIVE:
1. EXCLUSIVE GROUNDING: Answer using ONLY the exact facts and logic visible in the code snippets below. You are strictly forbidden from using outside knowledge, extrapolating, or guessing.
2. MANDATORY CITATIONS: Every factual statement or explanation MUST cite the exact file path and line numbers (e.g. `requests/sessions.py`, lines 40-75).
3. STRICT REFUSAL: If the question cannot be answered completely from the provided snippets, state ONLY:
   "Strict Mode: This information is not found in the indexed codebase context."
4. NO CHITCHAT: Disregard greetings or conversational remarks. Focus exclusively on verified code evidence."""
    else:
        instructions = """BALANCED CONVERSATIONAL MODE:
1. GENERAL QUESTIONS & CHAT:
   - For general questions (greetings, general coding concepts, "what is HTTP?", "explain cookies", advice, or simple conversation), respond naturally, helpfully, and conversationally using your broad software engineering knowledge.
2. REPOSITORY & CODEBASE QUESTIONS:
   - When the user asks about THIS specific codebase (how something is implemented, architecture, where functions live, or requests citations), ground your answer in the provided code snippets below.
   - For every claim about this repository's code, cite the relevant file path and line numbers (e.g. `requests/sessions.py`, lines 40-75).
   - If a specific feature is not visible in the snippets, explain what you found or clarify that it wasn't in the retrieved snippets, while still being helpful."""

    return f"""You are an expert software engineering assistant with access to an indexed code repository.

{instructions}

RETRIEVED CODE CONTEXT:
{context_text}

USER QUESTION:
{question}

RESPONSE:
"""


def answer_question(repo_name: str, question: str, top_k: int = 5, strict_mode: bool = False) -> Dict[str, Any]:
    """
    Orchestrates the entire RAG pipeline:
    1. Validates repo in SQLite
    2. Retrieves top-K chunks from ChromaDB
    3. Assembles prompt (Balanced vs Strict mode)
    4. Calls Gemini Flash
    """
    # 1. Verify repo exists in SQLite
    repo = get_repo(repo_name)
    if not repo:
        raise ValueError(f"Repository '{repo_name}' is not indexed yet!")

    # 2. Retrieve top-K chunks from ChromaDB
    chunks = query_similar_chunks(repo_name, question, top_k=top_k)
    if not chunks:
        return {
            "answer": "No relevant code snippets were found in this repository.",
            "citations": []
        }

    # 3. Assemble prompt with strict citation constraints
    prompt = build_rag_prompt(question, chunks, strict_mode=strict_mode)

    # 4. Call Gemini 2.5 Flash via official Google GenAI SDK
    client = genai.Client(api_key=GOOGLE_API_KEY)
    response = client.models.generate_content(
        model=GENERATION_MODEL,
        contents=prompt
    )

    # 5. Return both the answer and the cited source chunks for the UI!
    return {
        "answer": response.text,
        "citations": [
            {
                "file_path": c["file_path"],
                "entity_type": c["entity_type"],
                "entity_name": c["entity_name"],
                "start_line": c["start_line"],
                "end_line": c["end_line"],
                "code": c["code"],
                "distance": c["distance"]
            }
            for c in chunks
        ]
    }
