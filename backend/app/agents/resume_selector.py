import re
from typing import List, Dict, Any, Tuple
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
        all_evidence: List[EvidenceChunk]
    ) -> RecommendedResume:
        """Determines the strongest candidate resume for the given requirements."""
        if not available_resumes:
            return RecommendedResume(
                resume_id="none",
                resume_name="No Resume Available",
                match_score=0,
                strengths=[],
                gaps=requirements.required_skills,
                reason="No resumes found in the knowledge base. Please upload a resume first."
            )

        # Build evidence map by resume_id
        resume_scores: List[Tuple[Resume, int, List[str], List[str], str]] = []

        all_req_skills = set([s.lower() for s in requirements.required_skills + requirements.preferred_skills])

        for resume in available_resumes:
            resume_text_lower = resume.raw_text.lower()
            matching_skills = []
            missing_skills = []

            for skill in requirements.required_skills + requirements.preferred_skills:
                pattern = rf"\b{re.escape(skill.lower())}\b"
                if re.search(pattern, resume_text_lower):
                    matching_skills.append(skill)
                else:
                    missing_skills.append(skill)

            # Heuristic score calculation
            total_reqs = len(requirements.required_skills) or 1
            matched_reqs = len([s for s in matching_skills if s in requirements.required_skills])
            
            base_score = int((matched_reqs / total_reqs) * 80)
            bonus_score = min(20, len([s for s in matching_skills if s in requirements.preferred_skills]) * 5)
            final_score = min(98, max(35, base_score + bonus_score))

            reason = (
                f"{resume.name} matches {len(matching_skills)} of the target skills "
                f"with strong coverage in {', '.join(matching_skills[:3]) if matching_skills else 'core competencies'}."
            )

            resume_scores.append((resume, final_score, matching_skills, missing_skills, reason))

        # Sort by match score descending
        resume_scores.sort(key=lambda x: x[1], reverse=True)
        best_resume, best_score, strengths, gaps, fallback_reason = resume_scores[0]

        # If Groq is available, ask LLM to refine reason and comparison
        if groq_client.is_configured:
            candidates_summary = [
                {
                    "id": r.id,
                    "name": r.name,
                    "matched_skills": m,
                    "unmatched_skills": g,
                    "preliminary_score": sc
                }
                for r, sc, m, g, _ in resume_scores
            ]
            user_prompt = f"""
JD Requirements:
{requirements.model_dump_json(indent=2)}

Candidate Resumes:
{candidates_summary}

Retrieved Evidence Snippets:
{[e.model_dump() for e in all_evidence[:6]]}
"""
            fallback_dict = {
                "resume_id": best_resume.id,
                "match_score": best_score,
                "strengths": strengths[:6],
                "gaps": gaps[:6],
                "reason": fallback_reason
            }
            try:
                llm_eval = groq_client.generate_json(
                    system_prompt=self.SYSTEM_PROMPT,
                    user_prompt=user_prompt,
                    fallback_data=fallback_dict
                )
                chosen_id = llm_eval.get("resume_id") or best_resume.id
                chosen_resume = next((r for r in available_resumes if r.id == chosen_id), best_resume)
                return RecommendedResume(
                    resume_id=chosen_resume.id,
                    resume_name=chosen_resume.name,
                    match_score=int(llm_eval.get("match_score", best_score)),
                    strengths=llm_eval.get("strengths", strengths[:6]),
                    gaps=llm_eval.get("gaps", gaps[:6]),
                    reason=llm_eval.get("reason", fallback_reason)
                )
            except Exception:
                pass

        return RecommendedResume(
            resume_id=best_resume.id,
            resume_name=best_resume.name,
            match_score=best_score,
            strengths=strengths[:6],
            gaps=gaps[:6],
            reason=fallback_reason
        )


resume_selector = ResumeSelectorAgent()
