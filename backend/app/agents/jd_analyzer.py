import re
from typing import Dict, Any, List, Optional
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
STRICT ANTI-HALLUCINATION RULES:
- Only extract skills, tools, frameworks, and qualifications explicitly mentioned in the text.
- If the text is NOT a legitimate job description or does not contain technical requirements (e.g. casual greetings like "hi", nonsensical input, or unrelated text), return empty lists for required_skills, preferred_skills, responsibilities, and keywords, and set role to "Unspecified Position".
- NEVER invent or assume skills (such as Python, SQL, or Docker) if they are not written in the job description.
"""

    def analyze(self, jd_text: str, api_key: Optional[str] = None, model: Optional[str] = None) -> JDRequirements:
        """Extracts structured requirements from JD text using pure LLM inference."""
        words = jd_text.strip().split()
        if len(words) < 8:
            raise ValueError(
                f"The provided text ('{jd_text[:30]}...') is too brief to be a valid job description. "
                "Please provide a realistic job description with requirements or responsibilities (minimum 10 words)."
            )

        client = groq_client.__class__(api_key=api_key, model=model) if (api_key or model) else groq_client
        user_prompt = f"Job Description:\n```\n{jd_text}\n```"
        data = client.generate_json(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.0,
            max_tokens=800
        )
        return JDRequirements(
            role=data.get("role") or "Target Position",
            required_skills=data.get("required_skills") or [],
            preferred_skills=data.get("preferred_skills") or [],
            responsibilities=data.get("responsibilities") or [],
            keywords=data.get("keywords") or [],
        )


jd_analyzer = JDAnalyzerAgent()
