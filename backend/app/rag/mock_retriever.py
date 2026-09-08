from typing import List, Optional, Dict, Any
from app.schemas.rag import ResumeChunk, EvidenceChunk, IngestionResult
from app.rag.interfaces import BaseRetriever, BaseResumeChunker


class MockResumeChunker(BaseResumeChunker):
    """Fallback chunker providing dummy chunks for development/testing."""

    def chunk(self, text: str, resume_id: str, metadata: Optional[Dict[str, Any]] = None) -> List[ResumeChunk]:
        meta = metadata or {}
        chunks = []
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        
        # Simple line groupings for mock purposes
        for i in range(0, len(lines), 4):
            chunk_text = " ".join(lines[i:i+4])
            chunks.append(ResumeChunk(
                id=f"{resume_id}-chunk-{len(chunks)}",
                content=chunk_text,
                section="general",
                metadata={**meta, "chunk_index": len(chunks)}
            ))
        return chunks


class MockRetriever(BaseRetriever):
    """Fallback retriever providing mock evidence chunks for development/testing."""

    def retrieve(
        self,
        query: str,
        resume_id: Optional[str] = None,
        section: Optional[str] = None,
        top_k: int = 8
    ) -> List[EvidenceChunk]:
        return [
            EvidenceChunk(
                content=f"Demonstrated deep experience with {query} and scalable software architecture.",
                resume_id=resume_id or "resume_mock",
                section=section or "experience",
                similarity=0.92,
                metadata={"source": "mock_resume.pdf", "role": "Senior Engineer"}
            ),
            EvidenceChunk(
                content="Engineered high-throughput REST APIs with FastAPI and integrated vector search systems.",
                resume_id=resume_id or "resume_mock",
                section="projects",
                similarity=0.88,
                metadata={"source": "mock_resume.pdf", "project": "RAG Assistant"}
            )
        ]


def mock_ingest_resume(text: str, resume_id: str, metadata: Optional[Dict[str, Any]] = None) -> IngestionResult:
    """Mock ingestion function."""
    chunker = MockResumeChunker()
    chunks = chunker.chunk(text, resume_id, metadata)
    return IngestionResult(
        resume_id=resume_id,
        total_chunks=len(chunks),
        status="success",
        message=f"[Mock Mode] Indexed {len(chunks)} chunks for resume {resume_id}"
    )
