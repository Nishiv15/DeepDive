from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    document_id: str
    filename: str
    chunks_stored: int
    pages_detected: int


class ChatRequest(BaseModel):
    document_id: str
    query: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)
    include_citations: bool = True


class Citation(BaseModel):
    chunk_index: int
    page: int | None
    score: float
    snippet: str


class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation] = []


class DocumentListResponse(BaseModel):
    documents: list[str]


class DeleteResponse(BaseModel):
    deleted: bool
    document_id: str
