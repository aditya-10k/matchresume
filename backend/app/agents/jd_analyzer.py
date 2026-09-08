import re
from typing import Dict, Any, List
from app.schemas.application import JDRequirements
from app.agents.groq_client import groq_client


class JDAnalyzerAgent:
    """
    Analyzes raw job descriptions and converts them into structured requirements:
    role, required_skills, preferred_skills, responsibilities, keywords.
    """

    SYSTEM_PROMPT = """
You are an expert technical recruiter and JD analysis agent.
Your objective is to extract structured requirements from the provided job description.
Return a valid JSON object matching this exact schema:
{
  "role": "Title of the job/position",
  "required_skills": ["List", "of", "mandatory", "technical", "skills"],
  "preferred_skills": ["List", "of", "nice-to-have", "skills"],
  "responsibilities": ["Core", "daily", "responsibilities"],
  "keywords": ["Essential", "domain", "keywords", "for", "ATS", "matching"]
}
Keep skill items concise (1-3 words each, e.g. "Python", "RAG", "FastAPI", "PostgreSQL").
Do not hallucinate skills not mentioned or implied by the JD.
"""

    def analyze(self, jd_text: str) -> JDRequirements:
        """Extracts structured requirements from JD text."""
        fallback = self._heuristic_fallback(jd_text)
        
        user_prompt = f"Job Description:\n```\n{jd_text}\n```"
        try:
            data = groq_client.generate_json(
                system_prompt=self.SYSTEM_PROMPT,
                user_prompt=user_prompt,
                fallback_data=fallback,
                temperature=0.1
            )
            return JDRequirements(
                role=data.get("role") or fallback["role"],
                required_skills=data.get("required_skills") or fallback["required_skills"],
                preferred_skills=data.get("preferred_skills") or fallback["preferred_skills"],
                responsibilities=data.get("responsibilities") or fallback["responsibilities"],
                keywords=data.get("keywords") or fallback["keywords"],
            )
        except Exception:
            return JDRequirements(**fallback)

    def _heuristic_fallback(self, text: str) -> Dict[str, Any]:
        """Deterministic keyword parser used when Groq is unconfigured or unavailable."""
        common_tech = [
            "Python", "TypeScript", "JavaScript", "React", "Next.js", "FastAPI",
            "SQL", "PostgreSQL", "ChromaDB", "RAG", "LLMs", "Docker", "Kubernetes",
            "AWS", "GCP", "Azure", "PyTorch", "TensorFlow", "Git", "REST APIs",
            "Tailwind", "GraphQL", "Redis", "Kafka", "Linux", "CI/CD"
        ]
        
        found_skills = []
        for tech in common_tech:
            pattern = rf"\b{re.escape(tech)}\b"
            if re.search(pattern, text, re.IGNORECASE):
                found_skills.append(tech)

        first_line = text.strip().split("\n")[0][:80]
        role_guess = first_line if "Engineer" in first_line or "Developer" in first_line else "Software Engineer"

        return {
            "role": role_guess,
            "required_skills": found_skills[:6] if found_skills else ["Python", "FastAPI", "SQL"],
            "preferred_skills": found_skills[6:10] if len(found_skills) > 6 else ["Docker", "Vector Databases"],
            "responsibilities": [
                "Architect and develop scalable features",
                "Collaborate with cross-functional teams",
                "Ensure clean code quality and testing"
            ],
            "keywords": found_skills[:8] or ["AI", "Backend", "Full Stack"]
        }


jd_analyzer = JDAnalyzerAgent()
