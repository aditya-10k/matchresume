from typing import List
from app.rag.interfaces import BaseEmbeddingModel


class EmbeddingService(BaseEmbeddingModel):
    """
    [USER IMPLEMENTATION REQUIRED]
    Implement vector embedding generation here (e.g. using sentence-transformers, fastembed, or HuggingFace).
    
    Guidelines from 03_RAG.md:
    - Generate dense vectors for text chunks and queries.
    - Return list of float vectors.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        # Leave implementation to user
        raise NotImplementedError("EmbeddingService.embed_texts() must be implemented by the user.")

    def embed_query(self, query: str) -> List[float]:
        # Leave implementation to user
        raise NotImplementedError("EmbeddingService.embed_query() must be implemented by the user.")


def get_embedding_service() -> EmbeddingService:
    """Helper factory for EmbeddingService."""
    return EmbeddingService()
