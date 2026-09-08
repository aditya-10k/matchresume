import json
import logging
import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.schemas.application import JDRequirements, RecommendedResume
from app.schemas.rag import EvidenceChunk
from app.agents.groq_client import groq_client

logger = logging.getLogger("resume_writer")


class TailoredResumeOutput(BaseModel):
    latex_code: str = Field(..., description="Complete, compilable LaTeX document tailored to the JD")
    tailored_summary: str = Field(..., description="Summary of key adaptations made for the role")
    highlighted_skills: List[str] = Field(default_factory=list, description="Skills emphasized in this version")


class ResumeWriterAgent:
    """
    Synthesizes an ATS-optimized, publication-grade LaTeX resume.
    Re-orders skills, refines bullets using active impact verbs, and aligns with JD keywords
    strictly grounded in factual candidate resume evidence.
    """

    SYSTEM_PROMPT = """
You are a world-class executive resume writer and LaTeX typesetter.
Your goal is to tailor the candidate's verified resume to the target Job Description (JD), producing publication-grade, ATS-friendly LaTeX.

STRICT ANTI-HALLUCINATION GROUNDING RULES:
1. Ground Truth ONLY: You may only use real experience, companies, degrees, tools, and projects found in the candidate's resume or evidence snippets.
2. NEVER invent fake companies, degrees, job titles, or metrics that the candidate did not hold.
3. Tailoring means:
   - Prioritizing and ordering skills to match what the JD demands first.
   - Reframing bullet points using strong action verbs (Built, Engineered, Architected, Deployed, Reduced) to highlight relevance to the JD requirements.
   - Filtering out completely irrelevant bullets to keep the resume concise and impactful.
4. LaTeX Requirements:
   - Output must be a complete, standalone document using standard article class:
     \\documentclass[10pt, letterpaper]{article}
   - Use clean, modern formatting: \\usepackage[margin=0.65in]{geometry}, \\usepackage{enumitem}, \\usepackage{hyperref}, \\usepackage{titlesec}.
   - All special characters in plain text MUST be escaped: & as \\&, % as \\%, _ as \\_, # as \\#.
   - Do NOT use custom obscure packages or external font files that fail to compile.

Return valid JSON with this exact schema:
{
  "latex_code": "Complete, standalone compilable LaTeX document starting with \\documentclass and ending with \\end{document}",
  "tailored_summary": "2-3 sentences explaining how this version was strategically aligned to the JD.",
  "highlighted_skills": ["List", "of", "top", "skills", "emphasized"]
}
"""

    def tailor(
        self,
        jd_requirements: JDRequirements,
        candidate_name: str,
        candidate_raw_text: str,
        evidence_chunks: List[EvidenceChunk]
    ) -> TailoredResumeOutput:
        """Tailors candidate experience into an ATS-friendly LaTeX document."""
        user_prompt = f"""
TARGET JOB REQUIREMENTS:
{jd_requirements.model_dump_json(indent=2)}

CANDIDATE SOURCE RESUME ({candidate_name}):
```
{candidate_raw_text[:3500]}
```

RETRIEVED FACTUAL EVIDENCE CHUNKS:
{[e.model_dump() for e in evidence_chunks[:6]]}

Instructions:
Synthesize a tailored LaTeX resume that aligns with the target job requirements while remaining 100% faithful to the candidate's actual history.
Ensure all LaTeX formatting is pristine, escapes are complete, and return valid JSON.
"""

        data = groq_client.generate_json(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.1
        )

        latex_code = data.get("latex_code", "")
        # Clean up any markdown code block wrappers if present
        if latex_code.startswith("```latex"):
            latex_code = latex_code[8:]
        elif latex_code.startswith("```"):
            latex_code = latex_code[3:]
        if latex_code.endswith("```"):
            latex_code = latex_code[:-3]
        latex_code = latex_code.strip()

        return TailoredResumeOutput(
            latex_code=latex_code,
            tailored_summary=data.get("tailored_summary", "Tailored to job requirements."),
            highlighted_skills=data.get("highlighted_skills", jd_requirements.required_skills[:6])
        )


resume_writer = ResumeWriterAgent()
