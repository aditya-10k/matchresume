from typing import List, Optional, Dict, Any
from app.schemas.rag import EvidenceChunk, IngestionResult
from app.rag.chunking import chunk_resume
from app.rag.retriever import retrieve_context as real_retrieve_context


def ingest_resume(text: str, resume_id: str, metadata: Optional[Dict[str, Any]] = None) -> IngestionResult:
    """
    High-level ingestion pipeline hook.
    Performs section-aware semantic chunking and indexing for candidate resumes.
    """
    chunks = chunk_resume(text, resume_id, metadata)
    return IngestionResult(
        resume_id=resume_id,
        total_chunks=len(chunks),
        status="success",
        message=f"Resume successfully indexed with {len(chunks)} semantic chunks"
    )


def retrieve_context(
    query: str,
    resume_id: Optional[str] = None,
    section: Optional[str] = None,
    top_k: int = 8
) -> List[EvidenceChunk]:
    """
    High-level retrieval hook used by Agents and Tools.
    Returns authentic evidence chunks from the user's verified uploaded resumes.
    """
    return real_retrieve_context(query=query, resume_id=resume_id, section=section, top_k=top_k)
