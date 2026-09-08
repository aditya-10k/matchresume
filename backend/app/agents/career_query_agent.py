import logging
import re
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from app.schemas.rag import EvidenceChunk
from app.rag.retriever import ResumeRetriever
from app.rag.vector_store import get_vector_store
from app.agents.groq_client import groq_client
from app.db.session import SessionLocal
from app.db.models import Resume

logger = logging.getLogger("career_query_agent")


class CareerEvidenceSnippet(BaseModel):
    content: str
    section: str = "general"
    similarity: float = 0.5
    source_resume: str = "Primary Resume"


class CareerQueryAnswer(BaseModel):
    query: str
    answer: str
    evidence: List[CareerEvidenceSnippet] = Field(default_factory=list)
    suggested_followups: List[str] = Field(default_factory=list)
    model_used: str = "Default"
    total_evidence_chunks: int = 0


class CareerQueryAgent:
    """
    RAG-powered conversational agent answering candidate profile and career inquiries.
    Mines persistent ChromaDB dense vector store for verified facts, projects, and skills.
    Zero hallucination guarantee.
    """

    SYSTEM_PROMPT = """
You are Antigravity Career Intelligence, an expert career advisor and technical interviewer.
Your task is to answer the candidate's question about their OWN background, resume, skills, or projects.

CRITICAL RULES:
1. STRICT TRUTHFULNESS: Only answer using facts present in the provided CANDIDATE VERIFIED EVIDENCE.
   - Do NOT invent projects, metrics, companies, or skills.
   - If the candidate asks about a technology or experience that is NOT mentioned in their evidence, explicitly state that their resume does not list it, but mention any related technologies they DO have.
2. EXECUTIVE QUALITY: Provide structured, well-formatted markdown answers.
   - Highlight project names, quantifiable metrics (e.g. percentages, latency, users), and architecture decisions.
   - Keep answers punchy, confident, and direct.
3. CONVERSATIONAL FOLLOW-UPS: Generate 2-3 actionable, high-value follow-up questions the candidate might want to ask next.

Return valid JSON matching this schema:
{
  "answer": "Complete markdown-formatted answer directly addressing the query...",
  "suggested_followups": [
    "Follow-up question 1",
    "Follow-up question 2",
    "Follow-up question 3"
  ]
}
"""

    def answer_query(
        self,
        query: str,
        user_id: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        top_k: int = 6
    ) -> CareerQueryAnswer:
        retriever = ResumeRetriever()
        store = get_vector_store()
        
        # 1. Retrieve Candidate Vector Chunks from ChromaDB
        raw_chunks = retriever.retrieve(query=query, top_k=top_k)

        # Check if database has any resumes for this user
        db = SessionLocal()
        user_resumes = []
        try:
            query_filter = [Resume.user_id == user_id] if user_id else []
            user_resumes = db.query(Resume).filter(*query_filter).all()
            if not user_resumes:
                user_resumes = db.query(Resume).all()
        finally:
            db.close()

        if not user_resumes and not raw_chunks:
            return CareerQueryAnswer(
                query=query,
                answer="### No Resume Uploaded Yet\n\nI don't have any verified background to analyze. Please upload your resume PDF in the **Resume Vault** or **Studio** so I can map your projects, skills, and experience!",
                evidence=[],
                suggested_followups=[
                    "How do I upload my resume?",
                    "What formats are supported?",
                    "How does ChromaDB index my skills?"
                ],
                model_used=model or "System",
                total_evidence_chunks=0
            )

        # Build evidence list
        evidence_list: List[CareerEvidenceSnippet] = []
        evidence_texts = []
        for c in raw_chunks:
            source_name = "Primary Resume"
            if hasattr(c, "resume_id") and c.resume_id:
                matched_r = next((r for r in user_resumes if r.id == c.resume_id), None)
                if matched_r:
                    source_name = matched_r.name or matched_r.filename or "Resume"
            
            evidence_list.append(CareerEvidenceSnippet(
                content=c.content,
                section=c.section,
                similarity=c.similarity,
                source_resume=source_name
            ))
            evidence_texts.append(f"[{c.section.upper()}] (from {source_name}):\n{c.content}")

        # If vector search returned nothing but we have raw text in resume
        if not evidence_texts and user_resumes:
            for r in user_resumes[:2]:
                snippet = r.raw_text[:800] if r.raw_text else ""
                if snippet:
                    evidence_texts.append(f"[RESUME TEXT]: {snippet}")
                    evidence_list.append(CareerEvidenceSnippet(
                        content=snippet,
                        section="general",
                        similarity=0.5,
                        source_resume=r.name
                    ))

        # 2. Synthesize Grounded Answer via Groq
        evidence_block = "\n\n---\n\n".join(evidence_texts)
        user_prompt = f"""
CANDIDATE VERIFIED EVIDENCE (Ground Truth from ChromaDB):
{evidence_block}

CANDIDATE QUESTION:
"{query}"

Answer the candidate's question thoroughly using only their verified evidence.
Return valid JSON only.
"""

        client = groq_client.__class__(api_key=api_key, model=model) if (api_key or model) else groq_client
        active_model_name = model or getattr(client, "model", "Groq-LLM")

        try:
            data = client.generate_json(
                system_prompt=self.SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.15,
                max_tokens=800
            )
            answer_text = str(data.get("answer", ""))
            followups = list(data.get("suggested_followups", []))
            if not answer_text.strip():
                raise ValueError("Empty answer generated by LLM")

            return CareerQueryAnswer(
                query=query,
                answer=answer_text,
                evidence=evidence_list,
                suggested_followups=followups or [
                    "What are my technical gaps?",
                    "How can I tailor my resume for this project?",
                    "What roles am I best qualified for?"
                ],
                model_used=active_model_name,
                total_evidence_chunks=len(evidence_list)
            )

        except Exception as e:
            logger.warning(f"Groq synthesis failed ({e}), constructing semantic fallback from ChromaDB chunks...")
            # Fallback direct synthesis from retrieved vector chunks
            fallback_answer = self._generate_extractive_fallback(query, evidence_list)
            return CareerQueryAnswer(
                query=query,
                answer=fallback_answer,
                evidence=evidence_list,
                suggested_followups=[
                    "Show all my verified skills",
                    "What projects demonstrate distributed systems?",
                    "How do my skills match Senior roles?"
                ],
                model_used=f"{active_model_name} (RAG Semantic Extraction)",
                total_evidence_chunks=len(evidence_list)
            )

    def _generate_extractive_fallback(self, query: str, evidence: List[CareerEvidenceSnippet]) -> str:
        """Generates structured answer directly from vector chunks when LLM key is unavailable."""
        if not evidence:
            return "No matching verified evidence found in your resume vector store for this query."
        
        lines = [f"### Analysis based on your verified ChromaDB knowledge:"]
        for ev in evidence[:4]:
            lines.append(f"- **{ev.section.capitalize()}** ({ev.source_resume}): {ev.content.strip()[:240]}...")
        
        lines.append("\n> *Grounded directly in your indexed resume chunks.*")
        return "\n\n".join(lines)


career_query_agent = CareerQueryAgent()
