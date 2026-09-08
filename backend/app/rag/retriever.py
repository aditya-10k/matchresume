from typing import List, Optional
from app.schemas.rag import EvidenceChunk
from app.rag.interfaces import BaseRetriever


class ResumeRetriever(BaseRetriever):
    """
    [USER IMPLEMENTATION REQUIRED]
    Implement the core retrieval pipeline here.
    
    Guidelines from 03_RAG.md:
    1. Embed the query using EmbeddingService.
    2. Query ChromaStore using vector similarity and metadata filtering.
    3. Perform deduplication and optional reranking.
    4. Return structured EvidenceChunk list.
    """

    def retrieve(
        self,
        query: str,
        resume_id: Optional[str] = None,
        section: Optional[str] = None,
        top_k: int = 8
    ) -> List[EvidenceChunk]:
        # Leave implementation to user
        raise NotImplementedError("ResumeRetriever.retrieve() must be implemented by the user.")


def retrieve_context(
    query: str,
    resume_id: Optional[str] = None,
    section: Optional[str] = None,
    top_k: int = 8
) -> List[EvidenceChunk]:
    """
    Canonical retrieval entrypoint.
    Signature specified in 03_RAG.md:
    retrieve_context(query: str, resume_id: str | None = None, section: str | None = None, top_k: int = 8)
    """
    retriever = ResumeRetriever()
    return retriever.retrieve(query=query, resume_id=resume_id, section=section, top_k=top_k)
