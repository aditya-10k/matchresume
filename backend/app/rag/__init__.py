from typing import List, Optional, Dict, Any
from app.config import settings
from app.schemas.rag import EvidenceChunk, IngestionResult


def ingest_resume(text: str, resume_id: str, metadata: Optional[Dict[str, Any]] = None) -> IngestionResult:
    """
    High-level ingestion pipeline hook.
    If USE_MOCK_RAG=True, uses mock ingestion for testing app scaffolding.
    Otherwise, delegates to user-implemented chunking, embedding, and ChromaStore.
    """
    if settings.USE_MOCK_RAG:
        from app.rag.mock_retriever import mock_ingest_resume
        return mock_ingest_resume(text=text, resume_id=resume_id, metadata=metadata)
    
    # Real pipeline (implemented by user)
    from app.rag.chunking import chunk_resume
    from app.rag.embeddings import get_embedding_service
    from app.rag.vector_store import get_vector_store

    chunks = chunk_resume(text, resume_id, metadata)
    embedder = get_embedding_service()
    embeddings = embedder.embed_texts([c.content for c in chunks])
    store = get_vector_store()
    store.add_chunks(chunks, embeddings)
    
    return IngestionResult(
        resume_id=resume_id,
        total_chunks=len(chunks),
        status="success",
        message="Resume successfully indexed into ChromaDB"
    )


def retrieve_context(
    query: str,
    resume_id: Optional[str] = None,
    section: Optional[str] = None,
    top_k: int = 8
) -> List[EvidenceChunk]:
    """
    High-level retrieval hook used by Agents and Tools.
    If USE_MOCK_RAG=True, returns sample evidence.
    Otherwise, calls user-implemented retrieve_context.
    """
    if settings.USE_MOCK_RAG:
        from app.rag.mock_retriever import MockRetriever
        return MockRetriever().retrieve(query=query, resume_id=resume_id, section=section, top_k=top_k)
    
    from app.rag.retriever import retrieve_context as user_retrieve
    return user_retrieve(query=query, resume_id=resume_id, section=section, top_k=top_k)
