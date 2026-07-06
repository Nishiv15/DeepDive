import os, requests
from dotenv import load_dotenv

load_dotenv(override=True)
api_key     = os.getenv("GEMINI_API_KEY", "")
embed_model = os.getenv("EMBEDDING_MODEL", "gemini-embedding-001")
gen_model   = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

print(f"Using embed_model : {embed_model}")
print(f"Using gen_model   : {gen_model}")
print()

# Embedding
url = f"https://generativelanguage.googleapis.com/v1beta/models/{embed_model}:batchEmbedContents"
payload = {"requests": [{"model": f"models/{embed_model}", "content": {"parts": [{"text": "test"}]}, "taskType": "RETRIEVAL_DOCUMENT"}]}
r = requests.post(url, params={"key": api_key}, json=payload, timeout=15)
if r.ok:
    print(f"Embedding OK — dim={len(r.json()['embeddings'][0]['values'])}")
else:
    print(f"Embedding FAILED: {r.text}")

# Generation
from google import genai
client = genai.Client(api_key=api_key)
result = client.models.generate_content(model=gen_model, contents="Say OK.")
print(f"Generation OK — response: {result.text.strip()}")
