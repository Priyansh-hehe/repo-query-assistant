"""
===============================================================================
FILE: backend/check_models.py
SCRIPT: Google AI Studio Account Model Inspector

WHAT THIS SCRIPT DOES:
----------------------
This diagnostic utility connects to Google AI Studio using your GOOGLE_API_KEY
and queries Google's `ModelService.ListModels` endpoint.

WHY IT'S USEFUL:
It prints the exact, authoritative list of every Gemini model and Embedding model
enabled on your Google account so you never have to guess model names or API
identifiers.
===============================================================================
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from src.config import GOOGLE_API_KEY
from google import genai

def main():
    client = genai.Client(api_key=GOOGLE_API_KEY)
    print("Listing all models available for your API key:")
    print("=" * 60)
    try:
        models = client.models.list()
        for m in models:
            print(f"- {m.name}")
    except Exception as e:
        print(f"Error listing models: {e}")

if __name__ == "__main__":
    main()
