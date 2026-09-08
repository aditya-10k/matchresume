from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class ResumeChunk(BaseModel):
    """Represents a discrete semantic chunk extracted from a resume."""
    id: Optional[str] = None
    content: str = Field(..., description="Text content of the resume chunk")
    section: str = Field(..., description="Section name, e.g., projects, experience, skills, education, summary")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata tags (user_id, resume_id, project, skills, source)")


class EvidenceChunk(BaseModel):
    """Structured evidence retrieved from the vector knowledge base."""
    content: str
    resume_id: str
    section: str
    similarity: float = Field(default=0.0, description="Similarity score between 0.0 and 1.0")
    metadata: Dict[str, Any] = Field(default_factory=dict)


class IngestionResult(BaseModel):
    """Result of processing and indexing a resume into the RAG knowledge base."""
    resume_id: str
    total_chunks: int
    status: str = "success"
    message: str = "Resume indexed successfully"
