import sys
from pathlib import Path

# Add backend directory to sys.path so we can import from src
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from src.ingestion import clone_repository, discover_code_files

def main():
    print("=" * 60)
    print(" GitHub Ingestion Test ")
    print("=" * 60)

    # A lightweight test repo by GitHub with a couple files
    default_url = "https://github.com/octocat/Hello-World"
    
    user_url = input(f"Enter GitHub repository URL [Press Enter for '{default_url}']: ").strip()
    repo_url = user_url if user_url else default_url

    data_dir = backend_dir / "data" / "repos"

    try:
        # Step 1: Clone the repo
        repo_path = clone_repository(repo_url, data_dir)
        print(f"\n[OK] Repository ready at: {repo_path}")

        # Step 2: Discover code files
        files = discover_code_files(repo_path)
        print(f"\n[OK] Discovered {len(files)} source code files:")
        for f in files:
            size_kb = f['size_bytes'] / 1024
            print(f"  - {f['relative_path']} ({size_kb:.1f} KB)")

        print("\n" + "=" * 60)
        print(" Step 1 (Ingestion) Verification Succeeded! ")
        print("=" * 60)

    except Exception as e:
        print(f"\n[ERROR] An error occurred: {e}")

if __name__ == "__main__":
    main()
