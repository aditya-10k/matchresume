import logging
from typing import List
from chromadb.utils import embedding_functions
from app.rag.interfaces import BaseEmbeddingModel

import os
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")

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
        """Generates 384-d dense vector embeddings for a list of text strings with chunk batching."""
        if not texts:
            return []
        batch_size = 8
        all_embeddings: List[List[float]] = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            raw_embeddings = EmbeddingService._fn(batch)
            all_embeddings.extend([[float(val) for val in vec] for vec in raw_embeddings])
        return all_embeddings

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
