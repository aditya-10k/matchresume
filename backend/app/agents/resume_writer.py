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

    PRESET_BLUEPRINTS = {
        "classic_tech": """Use the Jake's Resume / Ivy League Tech Standard layout:
- \\documentclass[10pt, letterpaper]{article}
- \\usepackage[margin=0.65in]{geometry}, \\usepackage{titlesec}, \\usepackage{enumitem}, \\usepackage{hyperref}
- \\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
- Name centered: {\\Huge \\textbf{Name}}
- Sections required: \\section*{Education}, \\section*{Technical Skills}, \\section*{Experience}, \\section*{Projects}
- Subheadings: \\textbf{Company / Role} \\hfill Date \\\\ with \\begin{itemize}[leftmargin=*, nosep]
- Skills categories bolded: \\item \\textbf{Category:} skill1, skill2...
""",
        "modern_clean": """Use the Modern Executive Minimalist layout:
- \\documentclass[10pt, letterpaper]{article}
- \\usepackage[margin=0.7in]{geometry}, \\usepackage{titlesec}, \\usepackage{enumitem}, \\usepackage{hyperref}
- \\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\vspace{-2pt}\\rule{\\textwidth}{0.5pt}]
- Sections: \\section*{Summary}, \\section*{Core Competencies}, \\section*{Professional Experience}, \\section*{Education}
""",
        "compact_research": """Use the Academic & Systems Research layout:
- \\documentclass[10pt, letterpaper]{article}
- \\usepackage[margin=0.65in]{geometry}, \\usepackage{titlesec}, \\usepackage{enumitem}, \\usepackage{hyperref}
- \\titleformat{\\section}{\\large\\bfseries\\scshape}{}{0em}{}[\\titlerule]
- Sections: \\section*{Research & Technical Focus}, \\section*{Experience}, \\section*{Key Projects & Systems}, \\section*{Education}
"""
    }

    def tailor(
        self,
        jd_requirements: JDRequirements,
        candidate_name: str,
        candidate_raw_text: str,
        evidence_chunks: List[EvidenceChunk],
        api_key: Optional[str] = None,
        user_preferences: Optional[List[str]] = None,
        model: Optional[str] = None,
        preset_id: Optional[str] = "classic_tech",
        custom_template: Optional[str] = None,
        output_format: Optional[str] = "latex",
    ) -> TailoredResumeOutput:
        """Tailors candidate experience into an ATS-friendly LaTeX or Plaintext document."""
        prefs_section = ""
        if user_preferences:
            prefs_text = "\n".join([f"- {p}" for p in user_preferences])
            prefs_section = f"\nUSER TAILORING PREFERENCES & CONSTRAINTS:\n{prefs_text}\n"

        is_plaintext = (output_format == "plaintext") or (preset_id == "plaintext_standard")

        if is_plaintext:
            format_instructions = """
TARGET OUTPUT FORMAT: PLAIN TEXT / MARKDOWN RESUME (.txt)
Return valid JSON with:
{
  "latex_code": "# CANDIDATE NAME\\nPhone | Email | LinkedIn | GitHub\\n\\n## TECHNICAL SKILLS\\n- Languages: ...\\n- Tools: ...\\n\\n## PROFESSIONAL EXPERIENCE\\n**Company Name** | Role Title | Date\\n- Action verb achievement with metrics...\\n\\n## PROJECTS\\n**Project Title** | Tech Stack\\n- Architecture & impact details...\\n\\n## EDUCATION\\n**Institution** | Degree | Date\\n",
  "tailored_summary": "2-3 sentences explaining tailoring strategy.",
  "highlighted_skills": ["top", "skills"]
}
CRITICAL: Use standard Markdown formatting with # Headings, **Bold Subheadings**, and - Bullet Points. Include ALL verified sections: Education, Technical Skills, Experience, and Projects.
"""
        elif custom_template and custom_template.strip():
            format_instructions = f"""
TARGET OUTPUT FORMAT: CUSTOM LATEX TEMPLATE
You MUST strictly use this custom template structure as your structural skeleton:
```latex
{custom_template.strip()[:2000]}
```
Populate the candidate's verified facts into this exact template structure.
"""
        else:
            blueprint = self.PRESET_BLUEPRINTS.get(preset_id or "classic_tech", self.PRESET_BLUEPRINTS["classic_tech"])
            format_instructions = f"""
TARGET OUTPUT FORMAT: PUBLICATION-GRADE LATEX RESUME (.tex)
Template Blueprint:
{blueprint}

CRITICAL RULES:
1. Every LaTeX section MUST be complete: Education, Technical Skills, Experience, and Projects.
2. Escapes: & as \\&, % as \\%, _ as \\_, # as \\#.
3. Use \\section*{{...}} for all section headers.
4. Keep all text in clean ASCII characters (use standard ' and \" quotes, never unicode smart quotes).
"""

        user_prompt = f"""
TARGET JOB REQUIREMENTS:
{jd_requirements.model_dump_json(indent=2)}
{prefs_section}
CANDIDATE SOURCE RESUME ({candidate_name}):
```
{candidate_raw_text[:3500]}
```

RETRIEVED FACTUAL EVIDENCE CHUNKS:
{[e.model_dump() for e in evidence_chunks[:8]]}

{format_instructions}

Instructions:
Synthesize a complete, high-impact tailored resume that aligns with the target job requirements and adheres to user preferences while remaining 100% faithful to the candidate's actual history.
Ensure all sections are completely populated without truncation.
Return valid JSON matching the schema.
"""

        client = groq_client.__class__(api_key=api_key, model=model) if (api_key or model) else groq_client
        data = client.generate_json(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.1,
            max_tokens=3500
        )

        code_content = data.get("latex_code", "")
        # Clean up any markdown code block wrappers if present
        if code_content.startswith("```latex") or code_content.startswith("```markdown"):
            code_content = code_content.split("\n", 1)[1] if "\n" in code_content else code_content
        elif code_content.startswith("```"):
            code_content = code_content[3:]
        if code_content.endswith("```"):
            code_content = code_content[:-3]
        code_content = code_content.strip()

        # Normalize unicode smart quotes
        code_content = code_content.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"').replace("–", "--").replace("—", "---")

        return TailoredResumeOutput(
            latex_code=code_content,
            tailored_summary=data.get("tailored_summary", "Tailored to job requirements."),
            highlighted_skills=data.get("highlighted_skills", jd_requirements.required_skills[:6])
        )


resume_writer = ResumeWriterAgent()
