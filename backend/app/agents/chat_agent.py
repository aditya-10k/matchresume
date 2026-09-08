import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.agents.groq_client import groq_client

logger = logging.getLogger("chat_agent")


class ChatRefinementResponse(BaseModel):
    message: str = Field(..., description="Conversational explanation of the changes made or feedback")
    updated_latex: str = Field(..., description="The complete updated, valid LaTeX code")
    modifications_made: List[str] = Field(default_factory=list, description="List of specific changes made")


class ChatRefinementAgent:
    """
    Conversational agent for iterative resume refinement.
    Allows candidates to ask for specific updates, emphasis adjustments,
    length shortening (e.g. 1 page), and phrasing tweaks directly in LaTeX Studio.
    """

    SYSTEM_PROMPT = r"""
You are an expert AI Resume Editor and Career Coach for matchresume.
Your task is to refine and update the candidate's LaTeX resume based on their specific conversational instruction.

CRITICAL RULES:
1. STRICT TRUTHFULNESS: Never invent experience, companies, degrees, or skills not grounded in the candidate's source resume.
   If the user asks to add an experience they don't have, politely explain in your response that you emphasized related skills instead without fabricating facts.
2. SYNTAX INTEGRITY: Return valid, compilable LaTeX code with balanced braces, intact document environments, and properly escaped characters (\&, \%, \$, \_, \#).
3. TARGETED ADJUSTMENTS: Apply the user's requested changes directly (e.g. rewording bullets, re-ordering skills, shortening descriptions, emphasizing specific technologies).
4. RETURN FORMAT: Return valid JSON matching this schema:
{
  "message": "Friendly, professional explanation of the exact changes you made.",
  "updated_latex": "\\documentclass... complete updated LaTeX code ...\\end{document}",
  "modifications_made": ["Bullet 1 in Experience rephrased with metrics", "RAG skills moved to top of Skills section"]
}
"""

    def refine(
        self,
        current_latex: str,
        user_instruction: str,
        candidate_source_text: str = "",
        chat_history: Optional[List[Dict[str, str]]] = None,
        user_preferences: Optional[List[str]] = None,
        api_key: Optional[str] = None,
    ) -> ChatRefinementResponse:
        """Refines existing LaTeX resume according to user's conversational prompt."""
        prefs_section = ""
        if user_preferences:
            prefs_text = "\n".join([f"- {p}" for p in user_preferences])
            prefs_section = f"\nUSER TAILORING PREFERENCES:\n{prefs_text}\n"

        history_text = ""
        if chat_history:
            formatted_history = []
            for m in chat_history[-6:]:  # last 6 messages
                role = "User" if m.get("role") == "user" else "Assistant"
                formatted_history.append(f"{role}: {m.get('content', '')}")
            history_text = f"\nRECENT CONVERSATION HISTORY:\n" + "\n".join(formatted_history) + "\n"

        user_prompt = f"""
CURRENT LATEX RESUME:
```latex
{current_latex[:4000]}
```

CANDIDATE SOURCE RESUME (Ground Truth):
```
{candidate_source_text[:3000]}
```
{prefs_section}{history_text}
USER EDIT INSTRUCTION:
"{user_instruction}"

Instructions:
Apply the user's edit instruction to the LaTeX resume. Preserve full compilability and strict factual accuracy.
Return valid JSON only.
"""

        client = groq_client if not api_key else groq_client.__class__(api_key=api_key)
        data = client.generate_json(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.1
        )

        latex_code = data.get("updated_latex", current_latex)
        # Clean up any markdown code fences if wrapped
        if latex_code.startswith("```latex"):
            latex_code = latex_code[8:]
        elif latex_code.startswith("```"):
            latex_code = latex_code[3:]
        if latex_code.endswith("```"):
            latex_code = latex_code[:-3]
        latex_code = latex_code.strip()

        return ChatRefinementResponse(
            message=data.get("message", "Updated your resume per instructions."),
            updated_latex=latex_code,
            modifications_made=data.get("modifications_made", ["LaTeX resume updated."])
        )


chat_agent = ChatRefinementAgent()
