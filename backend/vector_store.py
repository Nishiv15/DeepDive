import re
import requests
import chromadb
from chromadb.config import Settings as ChromaSettings

from config import settings

_chroma_client = None
_collection_cache: dict = {}

EMBED_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:batchEmbedContents"
EMBED_BATCH_SIZE = 100


def sanitize_name(name: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9._-]", "_", name)
    safe = re.sub(r"^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$", "", safe)
    safe = re.sub(r"_+", "_", safe)
    if len(safe) < 3:
        safe = safe.ljust(3, "0")
    return safe[:512]


# ChromaDB Client

def get_chroma_client() -> chromadb.ClientAPI:
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _chroma_client


def get_or_create_collection(document_id: str) -> chromadb.Collection:
    client = get_chroma_client()
    safe_id = sanitize_name(document_id)
    if safe_id not in _collection_cache:
        _collection_cache[safe_id] = client.get_or_create_collection(
            name=safe_id,
            metadata={"hnsw:space": "cosine", "original_id": document_id},
        )
    return _collection_cache[safe_id]


# Embeddings via REST API

def _batch_embed_rest(texts: list[str], task_type: str) -> list[list[float]]:
    url = EMBED_API_URL.format(model=settings.embedding_model)
    payload = {
        "requests": [
            {
                "model": f"models/{settings.embedding_model}",
                "content": {"parts": [{"text": t}]},
                "taskType": task_type,
            }
            for t in texts
        ]
    }
    resp = requests.post(url, params={"key": settings.gemini_api_key}, json=payload, timeout=60)
    if not resp.ok:
        raise RuntimeError(f"Embedding API error {resp.status_code}: {resp.text}")
    data = resp.json()
    return [e["values"] for e in data["embeddings"]]


def embed_texts(texts: list[str]) -> list[list[float]]:
    all_embeddings = []
    for i in range(0, len(texts), EMBED_BATCH_SIZE):
        batch = texts[i: i + EMBED_BATCH_SIZE]
        all_embeddings.extend(_batch_embed_rest(batch, "RETRIEVAL_DOCUMENT"))
    return all_embeddings


def embed_query(query: str) -> list[float]:
    return _batch_embed_rest([query], "RETRIEVAL_QUERY")[0]


# Store & Retrieve

def store_chunks(document_id: str, chunks: list[dict]) -> int:
    collection = get_or_create_collection(document_id)
    texts = [c["text"] for c in chunks]
    embeddings = embed_texts(texts)
    safe_id = sanitize_name(document_id)
    ids = [f"{safe_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"page": c["page"], "document_id": document_id} for c in chunks]

    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas,
    )
    return len(chunks)


def retrieve_chunks(document_id: str, query: str, top_k: int | None = None) -> list[dict]:
    k = top_k or settings.top_k_results
    collection = get_or_create_collection(document_id)
    query_embedding = embed_query(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(k, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        chunks.append({
            "text": doc,
            "page": meta.get("page"),
            "chunk_id": meta.get("document_id", document_id),
            "score": round(1 - dist, 4),
        })
    return chunks


def list_documents() -> list[str]:
    client = get_chroma_client()
    return [c.name for c in client.list_collections()]


def delete_document(document_id: str) -> bool:
    client = get_chroma_client()
    safe_id = sanitize_name(document_id)
    try:
        client.delete_collection(safe_id)
        _collection_cache.pop(safe_id, None)
        return True
    except Exception:
        return False
