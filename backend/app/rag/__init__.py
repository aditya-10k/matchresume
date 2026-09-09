import logging
from typing import List, Optional, Dict, Any
from app.schemas.rag import EvidenceChunk, IngestionResult
from app.rag.chunking import chunk_resume
from app.rag.embeddings import get_embedding_service
from app.rag.vector_store import get_vector_store
from app.rag.retriever import retrieve_context as real_retrieve_context

logger = logging.getLogger("rag")


def ingest_resume(text: str, resume_id: str, metadata: Optional[Dict[str, Any]] = None) -> IngestionResult:
    """
    High-level ingestion pipeline hook.
    Performs section-aware semantic chunking, dense vector embedding generation,
    and indexing into persistent ChromaDB.
    """
    if not text or not text.strip():
        return IngestionResult(
            resume_id=resume_id,
            total_chunks=0,
            status="failed",
            message="No text content to ingest"
        )

    meta = metadata or {}
    meta["resume_id"] = resume_id

    # 1. Chunk resume into section-aware semantic blocks
    chunks = chunk_resume(text, resume_id, meta)
    if not chunks:
        return IngestionResult(
            resume_id=resume_id,
            total_chunks=0,
            status="success",
            message="No valid chunks extracted"
        )

    # 2. Compute dense vector embeddings
    embed_service = get_embedding_service()
    texts_to_embed = [c.content for c in chunks]
    embeddings = embed_service.embed_texts(texts_to_embed)

    # 3. Upsert into persistent ChromaDB vector store
    store = get_vector_store()
    store.add_chunks(chunks, embeddings)

    logger.info(f"Successfully ingested resume {resume_id} ({len(chunks)} chunks) into ChromaDB.")
    return IngestionResult(
        resume_id=resume_id,
        total_chunks=len(chunks),
        status="success",
        message=f"Resume successfully indexed with {len(chunks)} semantic chunks into ChromaDB"
    )


def backfill_existing_resumes(user_id: Optional[str] = None) -> int:
    """
    Checks candidate resumes for a given user in the database.
    If a resume is not yet indexed in ChromaDB, chunks and indexes it.
    """
    if not user_id:
        return 0

    from app.db.session import SessionLocal
    from app.db.models import Resume

    db = SessionLocal()
    store = get_vector_store()
    backfilled_count = 0
    try:
        resumes = db.query(Resume).filter(Resume.user_id == user_id).all()
        for r in resumes:
            if not r.raw_text:
                continue
            existing = store.get_user_chunks(user_id=user_id, resume_id=r.id)
            if not existing:
                logger.info(f"Backfilling vector indexing for resume: {r.name} ({r.id})...")
                meta = {
                    "source": r.filename or f"{r.name}.pdf",
                    "name": r.name,
                    "user_id": user_id,
                    "resume_id": r.id
                }
                ingest_resume(r.raw_text, r.id, metadata=meta)
                backfilled_count += 1
            else:
                logger.debug(f"Resume {r.id} already has {len(existing)} indexed chunks in ChromaDB.")
    except Exception as e:
        logger.error(f"Error during resume backfill for user {user_id}: {e}")
    finally:
        db.close()
    return backfilled_count


from app.rag.retriever import retrieve_context as real_retrieve_context, retrieve_batch_context as real_retrieve_batch_context


def retrieve_context(
    query: str,
    user_id: Optional[str] = None,
    resume_id: Optional[str] = None,
    section: Optional[str] = None,
    top_k: int = 8
) -> List[EvidenceChunk]:
    """
    High-level retrieval hook used by Agents and Tools.
    Returns authentic evidence chunks from the user's verified uploaded resumes.
    """
    return real_retrieve_context(query=query, user_id=user_id, resume_id=resume_id, section=section, top_k=top_k)


def retrieve_batch_context(
    queries: List[str],
    user_id: Optional[str] = None,
    resume_id: Optional[str] = None,
    section: Optional[str] = None,
    top_k: int = 3
) -> List[EvidenceChunk]:
    """
    High-level batched retrieval hook used by multi-term Agent nodes.
    """
    return real_retrieve_batch_context(queries=queries, user_id=user_id, resume_id=resume_id, section=section, top_k=top_k)
