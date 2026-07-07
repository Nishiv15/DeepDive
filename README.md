# DeepDive

DeepDive is a document-based Retrieval-Augmented Generation (RAG) chat application. It allows you to upload documents of various formats, process and index them into a local vector database, and have an interactive, context-aware chat conversation powered by Gemini AI with precise source citations.

---

## What the Project is About

DeepDive enables deep exploration of document contents by combining semantic search and LLM generation. When you upload a file, the application:
1. **Parses the Document**: Extracts text content and retains page number metadata.
2. **Chunk & Embed**: Splits the document into optimized chunks and computes semantic embeddings.
3. **Vector Storage**: Saves the document chunks and vectors in a ChromaDB database.
4. **Context Retrieval**: Performs vector search using cosine similarity to retrieve the most relevant sections of your documents based on your query.
5. **RAG-Powered Chat**: Feeds the context to Gemini to generate accurate answers complete with citations pointing back to specific pages and source snippets.

---

## Tech Stack

### Backend
- **FastAPI**: A high-performance web framework for building APIs with Python.
- **Google GenAI SDK**: Integrates Gemini models (e.g., `gemini-3.1-flash-lite`) for text generation and `gemini-embedding-001` for vector embedding.
- **ChromaDB**: An open-source, developer-friendly vector database to store and query document embeddings.
- **Document Parsers**:
  - **PyMuPDF (fitz)**: For fast and accurate PDF parsing.
  - **python-docx**: For extraction of DOCX (Word) documents.
  - **openpyxl**: For processing XLSX (Excel) spreadsheets.
- **Pydantic & Pydantic Settings**: For data validation and environment configuration.
- **Uvicorn**: An ASGI web server implementation for Python.

### Frontend
- **React (Vite)**: A fast, modern frontend build tool and React framework.
- **TailwindCSS**: A utility-first CSS framework for clean, responsive UI styling.
- **Lucide React**: Modern and minimal icons for the user interface.
- **Axios**: A promise-based HTTP client for API communication.