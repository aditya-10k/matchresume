from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.rag import EvidenceChunk


class ApplicationCreate(BaseModel):
    jd_text: str = Field(..., description="Raw text of the job description")
    company: Optional[str] = Field(None, description="Company name")
    role_title: Optional[str] = Field(None, description="Job title / role name")
    agent_enabled: bool = Field(True, description="Toggle between Agentic workflow and deterministic RAG workflow")


class JDRequirements(BaseModel):
    role: Optional[str] = None
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)


class RecommendedResume(BaseModel):
    resume_id: str
    resume_name: str
    match_score: int
    strengths: List[str] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)
    reason: str


class AnalysisResponse(BaseModel):
    application_id: str
    requirements: JDRequirements
    recommendation: RecommendedResume
    relevant_evidence: List[EvidenceChunk] = Field(default_factory=list)


class GenerateResumeResponse(BaseModel):
    application_id: str
    latex: str
    version: int
    notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: str
    company: Optional[str]
    role_title: Optional[str]
    jd_text: str
    jd_analysis: Optional[Dict[str, Any]]
    selected_resume_id: Optional[str]
    agent_enabled: bool
    match_score: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
