import logging
from typing import List
from chromadb.utils import embedding_functions
from app.rag.interfaces import BaseEmbeddingModel

logger = logging.getLogger("embeddings")


class EmbeddingService(BaseEmbeddingModel):
    """
    Production-grade dense vector embedding service using ChromaDB's ONNX
    implementation of all-MiniLM-L6-v2.
    Produces 384-dimensional dense vectors with sub-millisecond local latency.
    """

    _instance = None
    _fn = None

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        if EmbeddingService._fn is None:
            logger.info("Initializing ONNX embedding engine (all-MiniLM-L6-v2)...")
            EmbeddingService._fn = embedding_functions.DefaultEmbeddingFunction()

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generates 384-d dense vector embeddings for a list of text strings."""
        if not texts:
            return []
        raw_embeddings = EmbeddingService._fn(texts)
        # Convert numpy arrays to standard python float lists
        return [[float(val) for val in vec] for vec in raw_embeddings]

    def embed_query(self, query: str) -> List[float]:
        """Generates a 384-d dense vector embedding for a single search query string."""
        if not query or not query.strip():
            return [0.0] * 384
        res = self.embed_texts([query])
        return res[0] if res else [0.0] * 384


def get_embedding_service() -> EmbeddingService:
    """Singleton factory for EmbeddingService."""
    if EmbeddingService._instance is None:
        EmbeddingService._instance = EmbeddingService()
    return EmbeddingService._instance
