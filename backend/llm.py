from google import genai
from google.genai import types
from config import settings

_client = genai.Client(api_key=settings.gemini_api_key)

SYSTEM_PROMPT = (
    "You are a helpful document assistant. "
    "Answer the user's question using ONLY the provided context excerpts. "
    "If the context does not contain enough information, say so clearly. "
    "Be concise and factual."
)


# LLM Call

def build_prompt(query: str, context_chunks: list[dict]) -> str:
    context_block = "\n\n".join(
        f"[Page {c['page']}] {c['text']}" for c in context_chunks
    )
    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"### Context\n{context_block}\n\n"
        f"### Question\n{query}\n\n"
        f"### Answer"
    )


def generate_answer(query: str, context_chunks: list[dict]) -> str:
    prompt = build_prompt(query, context_chunks)
    response = _client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
    )
    return response.text.strip()
