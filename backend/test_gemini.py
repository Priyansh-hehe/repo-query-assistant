import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from src.config import GOOGLE_API_KEY
from google import genai

def main():
    print("Testing Gemini model connectivity...")
    client = genai.Client(api_key=GOOGLE_API_KEY)

    candidate_models = [
        "gemini-2.5-flash",
        "models/gemini-2.5-flash",
        "gemini-flash-latest",
        "models/gemini-flash-latest",
        "gemini-2.0-flash",
        "gemini-1.5-flash"
    ]

    for model_name in candidate_models:
        print(f"Trying model: {model_name} ...", end=" ")
        try:
            response = client.models.generate_content(
                model=model_name,
                contents="Say 'Hello from Gemini' in 5 words."
            )
            print(f"[SUCCESS] -> Response: {response.text.strip()}")
            print(f"\n===> The working model string is: '{model_name}'")
            return
        except Exception as e:
            err_first_line = str(e).splitlines()[0] if str(e) else "Error"
            print(f"[FAILED] -> {err_first_line[:80]}")

if __name__ == "__main__":
    main()
