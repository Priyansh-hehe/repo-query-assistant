import os
from pathlib import Path
from dotenv import load_dotenv

# Define base paths
# config.py lives in backend/src/, so parent is backend/src, parent.parent is backend/
SRC_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SRC_DIR.parent
DATA_DIR = BACKEND_DIR / "data"

# Sub-directories for storage
REPOS_DIR = DATA_DIR / "repos"
CHROMA_DIR = DATA_DIR / "chroma_db"
SQLITE_DB_PATH = DATA_DIR / "metadata.db"

# Ensure essential directories exist
REPOS_DIR.mkdir(parents=True, exist_ok=True)
CHROMA_DIR.mkdir(parents=True, exist_ok=True)

# Load environment variables from backend/.env
ENV_FILE = BACKEND_DIR / ".env"
load_dotenv(dotenv_path=ENV_FILE)

# Google AI Studio API Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()

# Model Names
EMBEDDING_MODEL = "text-embedding-004"
GENERATION_MODEL = "gemini-2.0-flash"

# Batching to stay well within Google free-tier limits
EMBEDDING_BATCH_SIZE = 50
