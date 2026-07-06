import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException

from config import settings
from parser import extract_text, chunk_pages
from vector_store import store_chunks, retrieve_chunks, list_documents, delete_document
from llm import generate_answer
from schemas import (
    UploadResponse,
    ChatRequest,
    ChatResponse,
    Citation,
    DocumentListResponse,
    DeleteResponse,
)

router = APIRouter()

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


# Upload Endpoint

@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: PDF, DOCX, TXT, XLSX.",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        pages = extract_text(file_bytes, file.content_type)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    chunks = chunk_pages(pages, settings.chunk_size, settings.chunk_overlap)
    if not chunks:
        raise HTTPException(status_code=422, detail="No extractable text found in file.")

    document_id = f"{file.filename}_{uuid.uuid4().hex[:8]}"
    try:
        stored = store_chunks(document_id, chunks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding/storage failed: {e}")

    return UploadResponse(
        document_id=document_id,
        filename=file.filename,
        chunks_stored=stored,
        pages_detected=len(pages),
    )


# Chat Endpoint

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        chunks = retrieve_chunks(request.document_id, request.query, request.top_k)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Document not found or retrieval failed: {e}")

    if not chunks:
        raise HTTPException(status_code=404, detail="No relevant chunks found for the query.")

    answer = generate_answer(request.query, chunks)

    citations = []
    if request.include_citations:
        for i, c in enumerate(chunks):
            citations.append(Citation(
                chunk_index=i,
                page=c.get("page"),
                score=c.get("score", 0.0),
                snippet=c["text"][:200],
            ))

    return ChatResponse(answer=answer, citations=citations)


# Document Management Endpoints

@router.get("/documents", response_model=DocumentListResponse)
async def get_documents():
    return DocumentListResponse(documents=list_documents())


@router.delete("/documents/{document_id}", response_model=DeleteResponse)
async def remove_document(document_id: str):
    deleted = delete_document(document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found.")
    return DeleteResponse(deleted=True, document_id=document_id)
