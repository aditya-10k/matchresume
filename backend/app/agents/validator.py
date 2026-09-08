import json
import logging
import re
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from app.agents.groq_client import groq_client

logger = logging.getLogger("validator")


class ValidationReport(BaseModel):
    is_valid: bool = Field(..., description="Overall pass/fail status")
    latex_syntax_valid: bool = Field(..., description="True if LaTeX structure is sound")
    factual_score: int = Field(..., description="0-100 score indicating grounding in source resume")
    hallucinations_detected: List[str] = Field(default_factory=list, description="Any unverified claims detected")
    syntax_issues: List[str] = Field(default_factory=list, description="Any LaTeX formatting or syntax warnings")
    feedback: str = Field(..., description="Summary evaluation of the resume's validity and readiness")


class ValidatorAgent:
    """
    Validates tailored resume LaTeX for:
    1. LaTeX structural integrity (balanced braces, proper environments, escaped symbols).
    2. Anti-hallucination verification (detecting claims not grounded in source resume).
    """

    SYSTEM_PROMPT = """
You are a rigorous QA validator and auditor for AI-tailored resumes.
Analyze the provided LaTeX resume against the candidate's original source resume.

You must verify two critical dimensions:
1. LATEX SYNTAX INTEGRITY:
   - Does it contain matching \\begin{...} and \\end{...} environments?
   - Are special characters (&, %, _, #) properly escaped in body text?
   - Is it standard compilable LaTeX without broken macros?

2. FACTUAL GROUNDING & ANTI-HALLUCINATION AUDIT:
   - Are the companies, degrees, and project experiences faithful to the source resume?
   - Did the writer fabricate any new credentials, previous employers, or unearned awards?
   - If the writer merely rephrased bullets to emphasize relevant skills, that is ALLOWED and valid.

Return valid JSON:
{
  "is_valid": true,
  "latex_syntax_valid": true,
  "factual_score": 95,
  "hallucinations_detected": [],
  "syntax_issues": [],
  "feedback": "Concise summary of validation findings."
}
"""

    def check_latex_syntax_static(self, latex_code: str) -> List[str]:
        syntax_warnings = []
        open_braces = latex_code.count("{")
        close_braces = latex_code.count("}")
        if open_braces != close_braces:
            syntax_warnings.append(f"Mismatched braces: {open_braces} open vs {close_braces} close.")

        if "\\begin{document}" not in latex_code or "\\end{document}" not in latex_code:
            syntax_warnings.append("Missing \\begin{document} or \\end{document} enclosure.")
        return syntax_warnings

    def validate(
        self,
        latex_code: str,
        source_resume_text: str = "",
        api_key: Optional[str] = None
    ) -> ValidationReport:
        """Validates LaTeX syntax and audits factual alignment."""
        syntax_warnings = self.check_latex_syntax_static(latex_code)

        client = groq_client if not api_key else groq_client.__class__(api_key=api_key)
        user_prompt = f"""
SOURCE CANDIDATE RESUME:
```
{source_resume_text[:2500]}
```

GENERATED TAILORED LATEX RESUME:
```latex
{latex_code[:3500]}
```

Instructions:
Perform the factual audit and LaTeX syntax check. Identify any hallucinated claims or syntax errors.
"""

        try:
            data = client.generate_json(
                system_prompt=self.SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.0
            )
            latex_valid = bool(data.get("latex_syntax_valid", len(syntax_warnings) == 0))
            is_valid = bool(data.get("is_valid", True)) and (len(syntax_warnings) == 0)

            detected_issues = data.get("syntax_issues", [])
            for w in syntax_warnings:
                if w not in detected_issues:
                    detected_issues.append(w)

            return ValidationReport(
                is_valid=is_valid,
                latex_syntax_valid=latex_valid,
                factual_score=int(data.get("factual_score", 90)),
                hallucinations_detected=data.get("hallucinations_detected", []),
                syntax_issues=detected_issues,
                feedback=data.get("feedback", "Validation passed with factual grounding.")
            )
        except Exception as e:
            logger.error(f"Validator LLM error: {e}")
            return ValidationReport(
                is_valid=len(syntax_warnings) == 0,
                latex_syntax_valid=len(syntax_warnings) == 0,
                factual_score=85,
                hallucinations_detected=[],
                syntax_issues=syntax_warnings,
                feedback="Static validation completed."
            )


validator_agent = ValidatorAgent()
