import re
import time
from pathlib import Path
from typing import List, Dict, Any, Optional

import chromadb
from google import genai
from google.genai import types

from src.config import (
    CHROMA_DIR,
    GOOGLE_API_KEY,
    EMBEDDING_MODEL,
    EMBEDDING_BATCH_SIZE,
    REPOS_DIR
)
from src.ingestion import clone_repository, discover_code_files, parse_repo_name_from_url
from src.parser import chunk_file
from src.db import init_db, register_or_update_repo


def get_genai_client() -> genai.Client:
    """Initializes and returns the Google GenAI SDK client."""
    if not GOOGLE_API_KEY:
        raise ValueError(
            "GOOGLE_API_KEY is missing! Please add your key to 'backend/.env'.\n"
            "You can get a free key from: https://aistudio.google.com/"
        )
    return genai.Client(api_key=GOOGLE_API_KEY)


def get_chroma_client() -> chromadb.PersistentClient:
    """Returns a persistent local ChromaDB client pointing to backend/data/chroma_db."""
    return chromadb.PersistentClient(path=str(CHROMA_DIR))


def sanitize_collection_name(repo_name: str) -> str:
    """
    ChromaDB collection names must be 3-63 chars, alphanumeric with hyphens/underscores.
    """
    cleaned = re.sub(r"[^a-zA-Z0-9_-]", "_", repo_name)
    cleaned = cleaned[:50]
    return f"repo_{cleaned}"


def get_or_create_collection(repo_name: str):
    """Gets or creates a ChromaDB collection for a specific repository with cosine distance."""
    client = get_chroma_client()
    collection_name = sanitize_collection_name(repo_name)
    return client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"}
    )


def generate_embeddings_batch(texts: List[str], client: genai.Client) -> List[List[float]]:
    """
    Sends a batch of text chunks to Google text-embedding-004 API
    and returns a list of 768-dimensional float vectors.
    """
    # Truncate any overly massive single chunk to 8000 characters to prevent API limits
    clean_texts = [t[:8000] if len(t) > 8000 else t for t in texts]

    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=clean_texts
    )
    # response.embeddings is a list of ContentEmbedding objects with .values
    return [e.values for e in response.embeddings]


def index_repository(repo_url: str, progress_callback=None) -> Dict[str, Any]:
    """
    End-to-end Indexing Pipeline:
    1. Shallow clone repo locally
    2. Discover code files
    3. Parse syntax into AST chunks (classes & functions)
    4. Batch embed with Google text-embedding-004
    5. Save into ChromaDB vector database
    6. Record metadata in SQLite
    """
    init_db()
    genai_client = get_genai_client()

    # Step 1: Ingestion
    repo_name = parse_repo_name_from_url(repo_url)
    if progress_callback:
        progress_callback(f"Cloning {repo_url}...")
    repo_path = clone_repository(repo_url, REPOS_DIR)

    # Step 2: Discovery
    if progress_callback:
        progress_callback("Scanning code files...")
    code_files = discover_code_files(repo_path)
    if not code_files:
        raise ValueError("No valid source code files found in this repository.")

    # Step 3: AST Parsing
    if progress_callback:
        progress_callback(f"Parsing AST chunks across {len(code_files)} files...")
    all_chunks = []
    for file_info in code_files:
        file_chunks = chunk_file(file_info["absolute_path"], str(repo_path))
        all_chunks.extend(file_chunks)

    if not all_chunks:
        raise ValueError("Failed to extract any code chunks from the files.")

    # Step 4 & 5: Batch Embedding & ChromaDB Storage
    collection = get_or_create_collection(repo_name)
    total_chunks = len(all_chunks)

    if progress_callback:
        progress_callback(f"Embedding {total_chunks} chunks using Google {EMBEDDING_MODEL}...")

    # Process in batches of 50 to respect rate limits
    for i in range(0, total_chunks, EMBEDDING_BATCH_SIZE):
        batch = all_chunks[i:i + EMBEDDING_BATCH_SIZE]
        batch_texts = [c["code"] for c in batch]
        
        # Call Google embedding API
        vectors = generate_embeddings_batch(batch_texts, genai_client)

        # Upsert into ChromaDB
        collection.upsert(
            ids=[c["chunk_id"] for c in batch],
            embeddings=vectors,
            documents=batch_texts,
            metadatas=[{
                "file_path": c["file_path"],
                "entity_type": c["entity_type"],
                "entity_name": c["entity_name"],
                "start_line": c["start_line"],
                "end_line": c["end_line"]
            } for c in batch]
        )

        # Brief sleep between batches to remain well within free tier limits
        time.sleep(0.2)

    # Step 6: Save repo record in SQLite
    register_or_update_repo(
        repo_name=repo_name,
        repo_url=repo_url,
        local_path=str(repo_path),
        total_chunks=total_chunks
    )

    return {
        "repo_name": repo_name,
        "repo_path": str(repo_path),
        "total_files": len(code_files),
        "total_chunks": total_chunks
    }


def query_similar_chunks(repo_name: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Takes a natural-language question, embeds it with Google text-embedding-004,
    and returns the top 5 most semantically similar code chunks from ChromaDB.
    """
    genai_client = get_genai_client()
    collection = get_or_create_collection(repo_name)

    # Embed the query
    query_vector = generate_embeddings_batch([query], genai_client)[0]

    # Query ChromaDB
    results = collection.query(
        query_embeddings=[query_vector],
        n_results=top_k
    )

    matched_chunks = []
    if results["documents"] and results["documents"][0]:
        documents = results["documents"][0]
        metadatas = results["metadatas"][0]
        distances = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(documents)

        for doc, meta, dist in zip(documents, metadatas, distances):
            matched_chunks.append({
                "code": doc,
                "file_path": meta["file_path"],
                "entity_type": meta["entity_type"],
                "entity_name": meta["entity_name"],
                "start_line": meta["start_line"],
                "end_line": meta["end_line"],
                "distance": dist
            })

    return matched_chunks
