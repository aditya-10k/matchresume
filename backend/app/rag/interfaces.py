from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from app.schemas.rag import ResumeChunk, EvidenceChunk, IngestionResult


class BaseResumeChunker(ABC):
    """Interface for chunking parsed resume text into semantic chunks."""

    @abstractmethod
    def chunk(self, text: str, resume_id: str, metadata: Optional[Dict[str, Any]] = None) -> List[ResumeChunk]:
        """Splits raw resume text into section-aware semantic chunks with metadata."""
        pass


class BaseEmbeddingModel(ABC):
    """Interface for generating dense vector embeddings."""

    @abstractmethod
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generates embedding vectors for a list of text strings."""
        pass

    @abstractmethod
    def embed_query(self, query: str) -> List[float]:
        """Generates an embedding vector for a search query string."""
        pass


class BaseVectorStore(ABC):
    """Interface for vector database operations (e.g., ChromaDB)."""

    @abstractmethod
    def add_chunks(self, chunks: List[ResumeChunk], embeddings: List[List[float]]) -> None:
        """Stores chunks, embeddings, and metadata into the vector collection."""
        pass

    @abstractmethod
    def query(
        self,
        query_embedding: List[float],
        top_k: int = 8,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Searches vector collection with optional metadata filters."""
        pass


class BaseRetriever(ABC):
    """Interface for the high-level RAG retrieval pipeline."""

    @abstractmethod
    def retrieve(
        self,
        query: str,
        resume_id: Optional[str] = None,
        section: Optional[str] = None,
        top_k: int = 8
    ) -> List[EvidenceChunk]:
        """Retrieves structured evidence relevant to the query."""
        pass
