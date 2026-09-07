import os
import subprocess
import re
from pathlib import Path
from typing import List, Dict, Any

# Directories we always want to ignore when scanning a repository
IGNORED_DIRECTORIES = {
    ".git",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
    "env",
    "dist",
    "build",
    ".next",
    ".idea",
    ".vscode",
    "target",
    "vendor",
    "coverage",
    ".turbo",
}

# File extensions we recognize as code or text worth reading
SUPPORTED_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx",
    ".go", ".java", ".rs", ".c", ".cpp",
    ".h", ".hpp", ".cs", ".rb", ".php",
    ".html", ".css", ".sql", ".sh",
    ".json", ".yaml", ".yml", ".md", ".txt"
}

# Skip any individual file larger than 1MB (avoids minified bundles, big datasets)
MAX_FILE_SIZE_BYTES = 1024 * 1024  # 1 MB


def parse_repo_name_from_url(repo_url: str) -> str:
    """
    Extracts a clean folder-safe name from a GitHub URL.
    Example: 'https://github.com/octocat/Hello-World.git' -> 'octocat_Hello-World'
    """
    cleaned_url = repo_url.strip().rstrip("/")
    if cleaned_url.endswith(".git"):
        cleaned_url = cleaned_url[:-4]
    
    # Extract owner and repository name using regex
    match = re.search(r"github\.com[/:]([\w.-]+)/([\w.-]+)", cleaned_url)
    if match:
        owner, repo = match.group(1), match.group(2)
        return f"{owner}_{repo}"
    
    # Fallback to the last segment of the URL
    parts = cleaned_url.split("/")
    return parts[-1] if parts else "unknown_repo"


def clone_repository(repo_url: str, destination_dir: Path) -> Path:
    """
    Clones a GitHub repository using Git's '--depth 1' shallow clone.
    '--depth 1' downloads ONLY the latest snapshot of code, skipping 
    years of commit history. This makes it 10x-100x faster!
    """
    repo_name = parse_repo_name_from_url(repo_url)
    target_path = destination_dir / repo_name

    # If already cloned, reuse the existing folder
    if target_path.exists() and any(target_path.iterdir()):
        print(f"[Ingestion] Repo already exists at: {target_path}")
        return target_path

    print(f"[Ingestion] Cloning {repo_url} into: {target_path} ...")
    target_path.mkdir(parents=True, exist_ok=True)

    try:
        # Run the git command: git clone --depth 1 <url> <target_path>
        result = subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, str(target_path)],
            check=True,
            capture_output=True,
            text=True
        )
        print(f"[Ingestion] Successfully cloned repository!")
        return target_path
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.strip() if e.stderr else str(e)
        raise RuntimeError(f"Git clone failed: {error_msg}")


def discover_code_files(repo_path: Path) -> List[Dict[str, Any]]:
    """
    Walks through the cloned repository and discovers valid source code files,
    ignoring clutter like .git, node_modules, images, and huge files.
    """
    discovered_files = []

    for root, dirs, files in os.walk(repo_path):
        # In-place modify dirs to avoid descending into ignored folders
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRECTORIES and not d.startswith(".")]

        for file_name in files:
            file_path = Path(root) / file_name
            ext = file_path.suffix.lower()

            # Only accept supported code extensions
            if ext not in SUPPORTED_EXTENSIONS:
                continue

            try:
                file_size = file_path.stat().st_size
                # Skip files larger than 1MB
                if file_size > MAX_FILE_SIZE_BYTES or file_size == 0:
                    continue

                rel_path = file_path.relative_to(repo_path).as_posix()
                discovered_files.append({
                    "relative_path": rel_path,
                    "absolute_path": str(file_path),
                    "extension": ext,
                    "size_bytes": file_size
                })
            except (OSError, PermissionError):
                continue

    return discovered_files
