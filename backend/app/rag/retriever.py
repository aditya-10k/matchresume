import re
import math
from typing import List, Optional, Dict, Any
from app.schemas.rag import EvidenceChunk
from app.rag.interfaces import BaseRetriever
from app.rag.chunking import chunk_resume
from app.db.session import SessionLocal
from app.db.models import Resume


def tokenize(text: str) -> List[str]:
    """Extract clean lowercase alphanumeric tokens."""
    return re.findall(r"\b[a-zA-Z0-9_\-\.]{2,}\b", text.lower())


def compute_bm25_similarity(query_tokens: List[str], doc_tokens: List[str], doc_len: int, avg_doc_len: float) -> float:
    """Computes BM25 / term-overlap similarity score."""
    if not query_tokens or not doc_tokens:
        return 0.0

    k1 = 1.5
    b = 0.75
    score = 0.0
    doc_token_counts: Dict[str, int] = {}
    for t in doc_tokens:
        doc_token_counts[t] = doc_token_counts.get(t, 0) + 1

    query_set = set(query_tokens)
    for t in query_set:
        f = doc_token_counts.get(t, 0)
        if f > 0:
            tf = (f * (k1 + 1.0)) / (f + k1 * (1.0 - b + b * (doc_len / (avg_doc_len or 1.0))))
            score += tf

    # Normalize roughly to [0.0, 1.0] range
    return min(1.0, score / max(1.0, len(query_set) * 1.8))


import logging
from app.rag.embeddings import get_embedding_service
from app.rag.vector_store import get_vector_store

logger = logging.getLogger("retriever")


class ResumeRetriever(BaseRetriever):
    """
    Hybrid Semantic Retriever operating over candidate resume chunks.
    Uses dense vector similarity (384-d cosine) via ChromaDB with section-aware boosting,
    and falls back to BM25 token matching for zero-shot keywords.
    """

    def retrieve(
        self,
        query: str,
        resume_id: Optional[str] = None,
        section: Optional[str] = None,
        top_k: int = 8
    ) -> List[EvidenceChunk]:
        if not query or not query.strip():
            return []

        # 1. Attempt Dense Vector Retrieval via ChromaDB
        try:
            store = get_vector_store()
            if store.collection.count() > 0:
                embed_service = get_embedding_service()
                q_vec = embed_service.embed_query(query)

                filters = {}
                if resume_id:
                    filters["resume_id"] = resume_id
                if section:
                    filters["section"] = section

                raw_results = store.query(query_embedding=q_vec, top_k=top_k * 2, filters=filters)
                if raw_results:
                    scored = []
                    for item in raw_results:
                        sim = float(item.get("similarity", 0.5))
                        sec = str(item.get("section", "")).lower()
                        # Section relevance weighting
                        if sec in ["experience", "projects", "skills"]:
                            sim = min(1.0, sim * 1.15)
                        scored.append((item, sim))

                    scored.sort(key=lambda x: x[1], reverse=True)

                    results: List[EvidenceChunk] = []
                    seen_texts = set()
                    for item, sim in scored[:top_k]:
                        clean_txt = item["content"].strip()
                        if clean_txt in seen_texts:
                            continue
                        seen_texts.add(clean_txt)
                        results.append(EvidenceChunk(
                            content=clean_txt,
                            resume_id=item.get("resume_id", resume_id or "unknown"),
                            section=item.get("section", "general"),
                            similarity=round(float(sim), 3),
                            metadata=item.get("metadata", {})
                        ))
                    if results:
                        logger.info(f"Retrieved {len(results)} vector chunks from ChromaDB for query: '{query[:40]}'")
                        return results
        except Exception as e:
            logger.warning(f"Vector search failed ({e}); falling back to lexical BM25 retrieval.")

        # 2. Fallback: Lexical BM25 retrieval from SQLite
        query_tokens = tokenize(query)
        if not query_tokens:
            return []

        db = SessionLocal()
        try:
            query_filter = db.query(Resume)
            if resume_id:
                query_filter = query_filter.filter(Resume.id == resume_id)
            resumes = query_filter.all()
        finally:
            db.close()

        if not resumes:
            return []

        all_chunks = []
        for r in resumes:
            if not r.raw_text:
                continue
            r_meta = {"source": r.file_path or f"{r.name}.pdf", "resume_name": r.name, "resume_id": r.id}
            chunks = chunk_resume(r.raw_text, resume_id=r.id, metadata=r_meta)
            for c in chunks:
                if section and c.section.lower() != section.lower():
                    continue
                all_chunks.append(c)

        if not all_chunks:
            return []

        all_doc_tokens = [tokenize(c.content) for c in all_chunks]
        avg_len = sum(len(dt) for dt in all_doc_tokens) / max(1, len(all_doc_tokens))

        scored_chunks = []
        for c, dt in zip(all_chunks, all_doc_tokens):
            sim = compute_bm25_similarity(query_tokens, dt, len(dt), avg_len)
            if c.section in ["experience", "projects", "skills"]:
                sim = min(1.0, sim * 1.15)
            if sim > 0.05 or len(scored_chunks) < top_k:
                scored_chunks.append((c, sim))

        scored_chunks.sort(key=lambda x: x[1], reverse=True)

        results: List[EvidenceChunk] = []
        seen_texts = set()
        for c, sim in scored_chunks[:top_k]:
            clean_txt = c.content.strip()
            if clean_txt in seen_texts:
                continue
            seen_texts.add(clean_txt)
            results.append(EvidenceChunk(
                content=clean_txt,
                resume_id=c.metadata.get("resume_id", resume_id or "unknown"),
                section=c.section,
                similarity=round(float(sim), 3),
                metadata=c.metadata
            ))

        return results


def retrieve_context(
    query: str,
    resume_id: Optional[str] = None,
    section: Optional[str] = None,
    top_k: int = 8
) -> List[EvidenceChunk]:
    """
    Canonical retrieval entrypoint.
    Returns verified, grounded evidence chunks from ChromaDB or BM25 fallback.
    """
    retriever = ResumeRetriever()
    return retriever.retrieve(query=query, resume_id=resume_id, section=section, top_k=top_k)
