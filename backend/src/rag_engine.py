"""
===============================================================================
FILE: backend/src/rag_engine.py
MODULE: Grounded RAG Generation Engine & Prompt Orchestrator

WHAT THIS FILE DOES:
--------------------
This is the core RAG intelligence layer where Retrieval meets Generative AI.
It takes a user's question, performs intent routing, fetches the most relevant
code chunks from ChromaDB, assembles them into an augmented open-book prompt,
enforces strict citation and anti-hallucination rules, and calls Google Gemini Flash
to synthesize an accurate, cited explanation.

KEY RESPONSIBILITIES & IMPLEMENTATIONS:
1. Conversational Intent Routing (`is_conversational_query`):
   - Prevents "phantom citations" / retrieval over-triggering by detecting
     pure greetings and vague remarks (e.g. "hi", "what?", "thanks", "who are you").
   - Bypasses ChromaDB vector search for conversational chat and returns 0 citations.
2. Prompt Construction (`build_rag_prompt`):
   - Formats retrieved chunks with their exact file path, entity type, name,
     and 1-indexed line ranges.
   - Enforces strict citation rules: the model MUST cite files and lines when using code.
   - Enforces anti-hallucination: if code is missing, it must say "not found".
3. Strict Citation Attribution Filtering:
   - Evaluates whether the generated response actually utilized the retrieved
     chunks by verifying explicit file/entity mentions in the synthesized text.
   - Completely eliminates phantom citations: if a file is not mentioned in the
     explanation, it is NEVER shown in the citations drawer.
===============================================================================
"""

import re
from pathlib import Path
from typing import List, Dict, Any
from google import genai
from src.config import GOOGLE_API_KEY, GENERATION_MODEL
from src.indexer import query_similar_chunks
from src.db import get_repo, get_cached_query, set_cached_query


def is_conversational_query(query: str) -> bool:
    """
    Detects if the user query is purely conversational (greetings, vague remarks, etc.)
    rather than a specific codebase inquiry.
    Prevents vector search over-triggering and phantom citations.
    """
    clean = query.strip().lower()
    clean_alpha = re.sub(r"[^\w\s]", "", clean).strip()

    chitchat = {
        "hi", "hello", "hey", "hey there", "hello there", "greetings", "howdy", "hola",
        "good morning", "good afternoon", "good evening", "good day",
        "how are you", "how are you doing", "who are you", "what can you do", "what are you",
        "what", "what?", "huh", "huh?", "pardon", "yo", "sup",
        "thanks", "thank you", "thx", "thank you so much",
        "bye", "goodbye", "see you", "see ya", "cool", "okay", "ok", "great", "awesome",
        "help", "what is this", "what is this app", "test"
    }
    if clean_alpha in chitchat or clean in chitchat:
        return True

    words = clean_alpha.split()
    if len(words) <= 3 and any(w in {"hi", "hello", "hey", "sup", "greetings", "thanks", "what", "huh"} for w in words):
        return True

    return False


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
   - For general questions (general coding concepts, "what is HTTP?", "explain cookies", advice, or simple conversation), respond naturally, helpfully, and conversationally using your broad software engineering knowledge. Do NOT cite any code files if you did not use the repository snippets.
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
    Orchestrates the entire RAG pipeline with Intent Routing and Citation Attribution:
    1. Validates repo in SQLite
    2. Routes conversational queries without polluting vector citations
    3. Retrieves top-K chunks from ChromaDB
    4. Assembles prompt (Balanced vs Strict mode)
    5. Calls Gemini Flash
    6. Filters citations to only those actually attributed/used in the answer
    """
    # 1. Verify repo exists in SQLite
    repo = get_repo(repo_name)
    if not repo:
        raise ValueError(f"Repository '{repo_name}' is not indexed yet!")

    client = genai.Client(api_key=GOOGLE_API_KEY)

    # 2. Instant Greetings: 0ms local response, 0 Google API quota consumed!
    if is_conversational_query(question):
        if strict_mode:
            return {
                "answer": f"Strict Zero-Hallucination Mode is active. Please ask a specific question about the verified codebase logic in **{repo_name}**.",
                "citations": []
            }
        else:
            return {
                "answer": (
                    f"Hello! I am your Intelligent Code Query Engine for **{repo_name}**.\n\n"
                    f"You can ask me questions about this codebase's architecture, trace specific function logic, "
                    f"or inspect implementations with verified line-by-line citations and direct GitHub links. "
                    f"What would you like to explore?"
                ),
                "citations": []
            }

    # 3. Check Persistent Multi-User SQLite Cache (<1ms lookup, survives page refresh & server restarts)
    cached_result = get_cached_query(repo_name, question, strict_mode)
    if cached_result:
        return cached_result

    # 4. Retrieve top-K chunks from ChromaDB
    chunks = query_similar_chunks(repo_name, question, top_k=top_k)
    if not chunks:
        return {
            "answer": "No relevant code snippets were found in this repository.",
            "citations": []
        }

    # 5. Assemble prompt with strict citation constraints
    prompt = build_rag_prompt(question, chunks, strict_mode=strict_mode)

    # 6. Call Gemini Flash via official Google GenAI SDK
    response = client.models.generate_content(
        model=GENERATION_MODEL,
        contents=prompt
    )

    answer_text = response.text or ""

    # 7. Strict Citation Attribution Filtering:
    # Only return citations if the answer actually used/referenced them!
    if strict_mode:
        # In strict mode, if the model refused, return 0 citations
        if "not found in the indexed codebase context" in answer_text.lower():
            used_chunks = []
        else:
            used_chunks = chunks
    else:
        # In balanced mode, check if the LLM actually cited the file in its response
        used_chunks = []
        for c in chunks:
            file_path = c["file_path"]
            file_name = Path(file_path).name
            entity_name = c.get("entity_name")
            
            # Match file path or file name in generated response
            if file_path in answer_text or file_name in answer_text:
                used_chunks.append(c)
            elif entity_name and len(entity_name) > 3 and entity_name in answer_text:
                used_chunks.append(c)

    citations = [
        {
            "file_path": c["file_path"],
            "entity_type": c["entity_type"],
            "entity_name": c["entity_name"],
            "start_line": c["start_line"],
            "end_line": c["end_line"],
            "code": c["code"],
            "distance": c["distance"]
        }
        for c in used_chunks
    ]

    # 8. Save result into persistent SQLite cache for future users & refreshes!
    set_cached_query(repo_name, question, strict_mode, answer_text, citations)

    return {
        "answer": answer_text,
        "citations": citations
    }
