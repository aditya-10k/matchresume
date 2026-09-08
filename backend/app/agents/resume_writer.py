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

    PRESET_TEMPLATES = {
        "classic_tech": r"""\documentclass[10pt, letterpaper]{article}
\usepackage[margin=0.6in]{geometry}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage{titlesec}
\usepackage{xcolor}

\hypersetup{colorlinks=true, linkcolor=black, urlcolor=black}

\titleformat{\section}{\large\bfseries\uppercase}{}{0em}{}[\titlerule]
\titlespacing*{\section}{0pt}{10pt}{4pt}
\setlength{\parindent}{0pt}
\setlength{\parskip}{2pt}

\begin{document}
\begin{center}
    {\Huge \textbf{Candidate Name}} \\
    \small Phone | \href{mailto:email}{email} | \href{https://linkedin.com/in/...}{LinkedIn} | \href{https://github.com/...}{GitHub}
\end{center}

\section*{Education}
\textbf{Institution Name}, Location \hfill Grad Year \\
\textit{Degree, Major} (CGPA: X.XX)

\section*{Technical Skills}
\begin{itemize}[leftmargin=*, nosep]
    \item \textbf{Languages:} Python, TypeScript, SQL...
    \item \textbf{Frameworks \& Libraries:} FastAPI, React, Next.js...
    \item \textbf{Developer Tools:} Docker, Git, AWS...
\end{itemize}

\section*{Experience}
\textbf{Company Name} \hfill Location \\
\textit{Job Title} \hfill Start Date -- End Date
\begin{itemize}[leftmargin=*, nosep]
    \item Achievement with metrics and active impact verb...
\end{itemize}

\section*{Projects}
\textbf{Project Name} $|$ \textit{Tech Stack} \hfill \href{https://url}{Link}
\begin{itemize}[leftmargin=*, nosep]
    \item Architecture and accomplishment details...
\end{itemize}

\end{document}""",

        "modern_clean": r"""\documentclass[10pt, letterpaper]{article}
\usepackage[margin=0.65in]{geometry}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage{titlesec}
\usepackage{xcolor}

\hypersetup{colorlinks=true, linkcolor=black, urlcolor=black}
\titleformat{\section}{\large\bfseries}{}{0em}{}[\vspace{-2pt}\rule{\textwidth}{0.5pt}]
\titlespacing*{\section}{0pt}{10pt}{4pt}
\setlength{\parindent}{0pt}
\setlength{\parskip}{2pt}

\begin{document}
\begin{center}
    {\LARGE \textbf{Candidate Name}} \\
    \small Phone | \href{mailto:email}{email} | \href{https://linkedin.com/in/...}{LinkedIn}
\end{center}

\section*{Summary}
Executive summary tailored to role...

\section*{Core Competencies}
\begin{itemize}[leftmargin=*, nosep]
    \item \textbf{Engineering Domains:} Systems Design, Cloud Architecture...
    \item \textbf{Core Stack:} Python, TypeScript, PostgreSQL...
\end{itemize}

\section*{Professional Experience}
\textbf{Company Name} \hfill Location \\
\textit{Job Title} \hfill Start Date -- End Date
\begin{itemize}[leftmargin=*, nosep]
    \item Accomplishment with metrics...
\end{itemize}

\section*{Education}
\textbf{Institution Name}, Location \hfill Grad Year \\
\textit{Degree, Major}

\end{document}""",

        "compact_research": r"""\documentclass[10pt, letterpaper]{article}
\usepackage[margin=0.6in]{geometry}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage{titlesec}
\usepackage{xcolor}

\hypersetup{colorlinks=true, linkcolor=black, urlcolor=black}
\titleformat{\section}{\large\bfseries\scshape}{}{0em}{}[\titlerule]
\titlespacing*{\section}{0pt}{10pt}{4pt}
\setlength{\parindent}{0pt}
\setlength{\parskip}{2pt}

\begin{document}
\begin{center}
    {\Huge \textbf{Candidate Name}} \\
    \small Phone | \href{mailto:email}{email} | \href{https://scholar.google.com/...}{Google Scholar} | \href{https://github.com/...}{GitHub}
\end{center}

\section*{Research \& Technical Focus}
\begin{itemize}[leftmargin=*, nosep]
    \item \textbf{Research Interests:} Machine Learning, NLP, Distributed Systems...
    \item \textbf{Scientific Tooling:} PyTorch, JAX, HuggingFace, CUDA...
\end{itemize}

\section*{Experience}
\textbf{Lab / Organization Name} \hfill Location \\
\textit{Research Role} \hfill Start Date -- End Date
\begin{itemize}[leftmargin=*, nosep]
    \item Research contribution and methodology...
\end{itemize}

\section*{Key Projects \& Systems}
\textbf{Project Name} $|$ \textit{Architecture} \hfill \href{https://url}{Link}
\begin{itemize}[leftmargin=*, nosep]
    \item Implementation and evaluation details...
\end{itemize}

\section*{Education}
\textbf{Institution Name}, Location \hfill Grad Year \\
\textit{Degree, Major}

\end{document}""",

        "plaintext_standard": """# Candidate Name
Phone | email | LinkedIn | GitHub

## TECHNICAL SKILLS
- Languages: ...
- Frameworks & Tools: ...

## PROFESSIONAL EXPERIENCE
**Company Name** | Job Title | Dates
- Accomplishment with metrics...

## PROJECTS
**Project Name** | Tech Stack
- Architecture and impact...

## EDUCATION
**University Name** | Degree | Graduation Year"""
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
        """Tailors candidate experience into an ATS-friendly LaTeX or Plaintext document strictly using the designated template."""
        prefs_section = ""
        if user_preferences:
            prefs_text = "\n".join([f"- {p}" for p in user_preferences])
            prefs_section = f"\nUSER TAILORING PREFERENCES & CONSTRAINTS:\n{prefs_text}\n"

        is_plaintext = (output_format == "plaintext") or (preset_id == "plaintext_standard")

        if is_plaintext:
            format_instructions = f"""
TARGET OUTPUT FORMAT: PLAIN TEXT / MARKDOWN RESUME (.txt)
You MUST use this EXACT Markdown layout:
```markdown
{self.PRESET_TEMPLATES['plaintext_standard']}
```
CRITICAL RULES:
1. Standard Markdown headings: # for Name, ## for Sections.
2. Bold subheadings: **Company** | Role | Date.
3. Dash bullets for achievements: - Action verb...
4. Include all verified sections from the candidate's history.
"""
        elif custom_template and custom_template.strip():
            format_instructions = f"""
TARGET OUTPUT FORMAT: CUSTOM LATEX TEMPLATE
You MUST use the EXACT LaTeX document template provided below as your rigid skeleton:
```latex
{custom_template.strip()}
```

CRITICAL TEMPLATE COMPLIANCE RULES:
1. PREAMBLE FIDELITY: You MUST preserve the exact LaTeX preamble, package declarations, styling commands, and geometry margins verbatim without modification.
2. NO HALLUCINATED COMMANDS: Do NOT introduce nonexistent or non-standard macros (like \\hr). Standard LaTeX only!
3. ESCAPE SPECIAL CHARACTERS: All special characters in body text MUST be escaped: & as \\&, % as \\%, _ as \\_, # as \\#.
4. POPULATION: Slot the candidate's verified facts directly into the corresponding sections of this custom template.
"""
        else:
            template_code = self.PRESET_TEMPLATES.get(preset_id or "classic_tech", self.PRESET_TEMPLATES["classic_tech"])
            format_instructions = f"""
TARGET OUTPUT FORMAT: STRICT COMPILABLE LATEX TEMPLATE
You MUST use the EXACT LaTeX document template provided below as your rigid structural skeleton:
```latex
{template_code}
```

CRITICAL TEMPLATE COMPLIANCE RULES:
1. PREAMBLE FIDELITY: You MUST copy the exact preamble verbatim (everything from \\documentclass[10pt, letterpaper]{{article}} down to \\begin{{document}}), including all \\usepackage, \\hypersetup, \\titleformat, \\titlespacing, and \\setlength definitions. Do NOT alter the margins, package imports, or title formats!
2. NO HALLUCINATED MACROS: Do NOT invent commands like \\hr, \\line, or custom shortcuts. Standard LaTeX only!
3. SECTION STRUCTURE: Strictly maintain the exact section titles and hierarchy from the template.
4. ESCAPE SPECIAL CHARACTERS: All special characters in plain text MUST be escaped: & as \\&, % as \\%, _ as \\_, # as \\#, $ as \\$.
5. CANDIDATE GROUNDING: Replace the placeholder candidate details with the candidate's verified background, strategically tailored to emphasize keywords from the target JD.
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
Synthesize a complete, high-impact tailored resume that strictly follows the template structure above, aligns with the target job requirements, and adheres to user preferences while remaining 100% faithful to the candidate's actual history.
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

        # Sanitize common unicode and invalid commands
        sanitizations = [
            ("’", "'"), ("‘", "'"), ("“", '"'), ("”", '"'),
            ("–", "--"), ("—", "---"), ("…", "..."), ("\u00a0", " "),
            ("\r\n", "\n"),
        ]
        for src, dst in sanitizations:
            code_content = code_content.replace(src, dst)

        # Remove any hallucinated \hr tags
        code_content = re.sub(r'\\hr\b', '', code_content)

        return TailoredResumeOutput(
            latex_code=code_content,
            tailored_summary=data.get("tailored_summary", "Tailored to job requirements."),
            highlighted_skills=data.get("highlighted_skills", jd_requirements.required_skills[:6])
        )


resume_writer = ResumeWriterAgent()
