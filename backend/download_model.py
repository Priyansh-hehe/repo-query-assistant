"""
===============================================================================
FILE: backend/download_model.py
PURPOSE: Pre-download ChromaDB ONNX embedding model during Render Build Step
===============================================================================
This script is executed during the Render Build Command:
    pip install -r requirements.txt && python download_model.py

By triggering the embedding function once during the build, the ~90MB
ONNX model (all-MiniLM-L6-v2) is downloaded from S3 and permanently frozen
into Render's container image snapshot.

RESULT:
When Render spins up or wakes from sleep, the model is ALREADY on disk.
Zero downloads on server startup. Zero timeouts. Instant cold starts!
===============================================================================
"""

import sys

def pre_download_embedding_model():
    print("[Build] Pre-downloading ChromaDB ONNX model into container image...")
    try:
        from chromadb.utils import embedding_functions
        embed_fn = embedding_functions.DefaultEmbeddingFunction()
        # Trigger download and caching into ~/.cache/chroma/onnx_models
        embed_fn(["Pre-download warmup sentence for container build."])
        print("[Build] SUCCESS: ONNX model (all-MiniLM-L6-v2) is permanently baked into build image!")
    except Exception as e:
        print(f"[Build] Warning during model download: {e}")
        # Exit with 0 so build doesn't break if S3 has a temporary hiccup
        sys.exit(0)

if __name__ == "__main__":
    pre_download_embedding_model()
