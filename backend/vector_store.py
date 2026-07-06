import chromadb
from chromadb.config import Settings as ChromaSettings
from google import genai

from config import settings

_genai_client = genai.Client(api_key=settings.gemini_api_key)

_chroma_client = None
_collection_cache: dict = {}


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
    safe_id = document_id.replace(" ", "_").replace(".", "_")
    if safe_id not in _collection_cache:
        _collection_cache[safe_id] = client.get_or_create_collection(
            name=safe_id,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection_cache[safe_id]


# Embeddings

def embed_texts(texts: list[str]) -> list[list[float]]:
    result = _genai_client.models.embed_content(
        model=settings.embedding_model,
        contents=texts,
        config={"task_type": "retrieval_document"},
    )
    return [e.values for e in result.embeddings]


def embed_query(query: str) -> list[float]:
    result = _genai_client.models.embed_content(
        model=settings.embedding_model,
        contents=query,
        config={"task_type": "retrieval_query"},
    )
    return result.embeddings[0].values


# Store & Retrieve

def store_chunks(document_id: str, chunks: list[dict]) -> int:
    collection = get_or_create_collection(document_id)
    texts = [c["text"] for c in chunks]
    embeddings = embed_texts(texts)
    ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
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
    safe_id = document_id.replace(" ", "_").replace(".", "_")
    try:
        client.delete_collection(safe_id)
        _collection_cache.pop(safe_id, None)
        return True
    except Exception:
        return False
