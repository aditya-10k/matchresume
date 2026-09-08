from typing import List, Optional, Dict, Any
from app.schemas.rag import ResumeChunk
from app.rag.interfaces import BaseVectorStore
from app.config import settings


class ChromaStore(BaseVectorStore):
    """
    [USER IMPLEMENTATION REQUIRED]
    Implement ChromaDB initialization, chunk ingestion, and vector search here.
    
    Guidelines from 02_Architecture.md & 03_RAG.md:
    - Initialize persistent ChromaDB client using settings.CHROMA_PERSIST_DIR.
    - Store chunks, embeddings, and metadata.
    - Support querying with metadata filtering (e.g. by resume_id, section).
    """

    def __init__(self, collection_name: str = "resume_knowledge"):
        self.collection_name = collection_name
        self.persist_dir = settings.CHROMA_PERSIST_DIR

    def add_chunks(self, chunks: List[ResumeChunk], embeddings: List[List[float]]) -> None:
        # Leave implementation to user
        raise NotImplementedError("ChromaStore.add_chunks() must be implemented by the user.")

    def query(
        self,
        query_embedding: List[float],
        top_k: int = 8,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        # Leave implementation to user
        raise NotImplementedError("ChromaStore.query() must be implemented by the user.")


def get_vector_store() -> ChromaStore:
    """Helper factory for ChromaStore."""
    return ChromaStore()
