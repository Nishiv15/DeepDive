from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str
    gemini_model: str = "gemini-3.1-flash-lite"
    embedding_model: str = "text-embedding-004"
    chroma_persist_dir: str = "./chroma_db"
    chunk_size: int = 800
    chunk_overlap: int = 150
    top_k_results: int = 5

    class Config:
        env_file = ".env"


settings = Settings()
