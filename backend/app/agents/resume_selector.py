import re
from typing import List, Dict, Any, Tuple, Optional
from app.schemas.application import JDRequirements, RecommendedResume
from app.schemas.rag import EvidenceChunk
from app.db.models import Resume
from app.rag import retrieve_context
from app.agents.groq_client import groq_client


class ResumeSelectorAgent:
    """
    Evaluates available candidate resumes against JD requirements using retrieved RAG evidence.
    Computes match scores, strengths, gaps, and recommendation rationale.
    """

    SYSTEM_PROMPT = """
You are a technical resume evaluation agent.
Analyze the candidate resumes and their retrieved evidence against the job description requirements.
Determine which resume is the best match.
Calculate a match score (0-100), identify strong matching areas, missing gaps, and provide a clear explanation.

Return JSON in this format:
{
  "resume_id": "id of the best resume",
  "match_score": 85,
  "strengths": ["List", "of", "matching", "skills/projects"],
  "gaps": ["List", "of", "missing", "or", "weak", "skills"],
  "reason": "Explanation of why this resume was selected."
}
"""

    def select_best_resume(
        self,
        requirements: JDRequirements,
        available_resumes: List[Resume],
        all_evidence: List[EvidenceChunk],
        api_key: Optional[str] = None,
        model: Optional[str] = None
    ) -> RecommendedResume:
        resumes = available_resumes or []
        if not resumes:
            return RecommendedResume(
                resume_id="none",
                resume_name="No Resume Available",
                match_score=0,
                strengths=[],
                gaps=(requirements.required_skills or []) if requirements else [],
                reason="No resumes found in the knowledge base. Please upload a resume first."
            )

        req_skills = (requirements.required_skills if requirements else None) or []
        pref_skills = (requirements.preferred_skills if requirements else None) or []

        # If JD has no extracted requirements, score is 0
        if not req_skills and not pref_skills:
            first_resume = resumes[0]
            return RecommendedResume(
                resume_id=first_resume.id,
                resume_name=first_resume.name,
                match_score=0,
                strengths=[],
                gaps=[],
                reason="No technical skills or requirements were identified in the job description to evaluate against."
            )

        # Format candidates for LLM evaluation
        candidates_summary = [
            {
                "id": r.id,
                "name": r.name,
                "text_excerpt": (r.raw_text or "")[:1200]
            }
            for r in resumes
        ]

        user_prompt = f"""
Target Position & Requirements:
{requirements.model_dump_json(indent=2)}

Available Candidate Resumes:
{candidates_summary}

Retrieved RAG Evidence Snippets:
{[e.model_dump() for e in (all_evidence or [])[:6]]}

Instructions:
Evaluate the candidate resumes against the job description requirements and retrieved evidence.
Select the candidate whose background best aligns with the role.
Return a valid JSON object matching the schema.
"""

        client = groq_client.__class__(api_key=api_key, model=model) if (api_key or model) else groq_client
        llm_eval = client.generate_json(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.0,
            max_tokens=800
        )

        chosen_id = llm_eval.get("resume_id")
        chosen_resume = next((r for r in available_resumes if r.id == chosen_id), available_resumes[0])

        return RecommendedResume(
            resume_id=chosen_resume.id,
            resume_name=chosen_resume.name,
            match_score=int(llm_eval.get("match_score", 0)),
            strengths=llm_eval.get("strengths") or [],
            gaps=llm_eval.get("gaps") or [],
            reason=llm_eval.get("reason") or "LLM candidate evaluation complete."
        )


resume_selector = ResumeSelectorAgent()
