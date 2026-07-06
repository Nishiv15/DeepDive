from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str
    gemini_model: str = "gemini-3.1-flash-lite"
    embedding_model: str = "gemini-embedding-001"
    chroma_persist_dir: str = "./chroma_db"
    chunk_size: int = 800
    chunk_overlap: int = 150
    top_k_results: int = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings(_env_file=".env", _env_file_encoding="utf-8")
