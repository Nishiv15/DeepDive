import sys
from pathlib import Path

backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from routes import router

app = FastAPI(
    title="DeepDive RAG API",
    description="Upload documents and chat with them using Gemini + ChromaDB.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


# Health Check & Root

@app.get("/")
@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "ok", "message": "DeepDive RAG API is running"}


# Favicon endpoints to prevent 404 logs
@app.get("/favicon.ico", include_in_schema=False)
@app.get("/favicon.png", include_in_schema=False)
async def favicon():
    return Response(status_code=204)


# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
