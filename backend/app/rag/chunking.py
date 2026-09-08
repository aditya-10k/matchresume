from typing import List, Optional, Dict, Any
from app.schemas.rag import ResumeChunk
from app.rag.interfaces import BaseResumeChunker


class ResumeChunker(BaseResumeChunker):
    """
    [USER IMPLEMENTATION REQUIRED]
    Implement section-aware semantic chunking for resumes here.
    
    Guidelines from 03_RAG.md:
    - Split resume text into meaningful sections (e.g. Summary, Skills, Experience, Projects).
    - Attach metadata (user_id, resume_id, section, project/company, skills list).
    - Avoid treating the entire resume as a single block.
    """

    def chunk(self, text: str, resume_id: str, metadata: Optional[Dict[str, Any]] = None) -> List[ResumeChunk]:
        # Leave implementation to user
        raise NotImplementedError("ResumeChunker.chunk() must be implemented by the user.")


def chunk_resume(text: str, resume_id: str, metadata: Optional[Dict[str, Any]] = None) -> List[ResumeChunk]:
    """Helper function to chunk a resume using ResumeChunker."""
    chunker = ResumeChunker()
    return chunker.chunk(text, resume_id, metadata)
