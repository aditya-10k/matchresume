import logging
import re
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from app.agents.groq_client import groq_client

logger = logging.getLogger("classifier")


class QueryClassification(BaseModel):
    intent: str = Field(..., description="PROFILE_QUERY | JOB_DESCRIPTION")
    confidence: float = Field(default=1.0, description="Confidence score between 0.0 and 1.0")
    summary: str = Field(..., description="Brief one-line summary of what is requested")
    key_topics: List[str] = Field(default_factory=list, description="Extracted skills, roles, or topics")


class ClassifierAgent:
    """
    Classifier Node in the Studio dispatch pipeline.
    Classifies validated prompts into either:
    - PROFILE_QUERY: Questions inquiring about the candidate's own background, projects, skills, or experience.
    - JOB_DESCRIPTION: Role postings or specifications for tailoring a resume.
    """

    SYSTEM_PROMPT = """
You are an intent classification agent for matchresume.
Your task is to classify the user's input into one of two categories:

1. "PROFILE_QUERY":
   The user is asking a question about their OWN resume, background, skills, projects, experience, or career direction.
   Examples:
   - "what is my best project?"
   - "summarize my backend experience"
   - "do I know Kubernetes?"
   - "what are my AI skills?"
   - "am I qualified for a Senior Staff Engineer role?"
   - "what companies have I worked at?"
   - "what are my gaps in machine learning?"

2. "JOB_DESCRIPTION":
   The user is pasting a job listing, vacancy, hiring requirements, role description, or company expectations to tailor a resume against.
   Examples:
   - "We are seeking a Senior Full-Stack Engineer with React, Python, FastAPI..."
   - "Requirements: 5+ years with AWS, Kubernetes, Terraform..."
   - "Job Title: Staff AI Engineer. Responsibilities: Lead LLM deployment..."

Return valid JSON matching this schema:
{
  "intent": "PROFILE_QUERY" or "JOB_DESCRIPTION",
  "confidence": 0.0 to 1.0,
  "summary": "Short explanation of the detected intent",
  "key_topics": ["skill1", "skill2", "role"]
}
"""

    def classify(
        self,
        prompt: str,
        api_key: Optional[str] = None,
        model: Optional[str] = None
    ) -> QueryClassification:
        text = prompt.strip()
        lower = text.lower()
        words = lower.split()

        # 1. Fast-Path Heuristics
        question_words = ["what", "which", "how", "who", "where", "why", "can", "do", "is", "am", "summarize", "tell", "explain", "show", "list", "give"]
        first_word = words[0].strip("?,.") if words else ""
        has_question_mark = "?" in text
        profile_markers = ["my project", "my best", "my skill", "my resume", "my experience", "my background", "my profile", "my work", "have i", "do i know", "am i", "did i"]

        if any(marker in lower for marker in profile_markers) or ((first_word in question_words or has_question_mark) and any(w in lower for w in ["project", "skill", "resume", "experience", "role", "python", "backend", "react", "fastapi", "work", "tech", "cloud"])):
            extracted_topics = [w for w in ["python", "projects", "backend", "skills", "experience", "ai", "machine learning", "cloud"] if w in lower]
            return QueryClassification(
                intent="PROFILE_QUERY",
                confidence=0.98,
                summary=f"Candidate profile query: {text[:60]}",
                key_topics=extracted_topics or ["profile"]
            )

        jd_markers = ["requirements:", "responsibilities:", "qualifications:", "we are looking for", "about the role:", "what you will do", "must have", "nice to have", "years of experience", "salary:", "benefits:", "full-time", "remote"]
        if any(marker in lower for marker in jd_markers) or (len(words) > 30 and not has_question_mark):
            return QueryClassification(
                intent="JOB_DESCRIPTION",
                confidence=0.96,
                summary="Job description or hiring specification",
                key_topics=["job_matching"]
            )

        client = groq_client.__class__(api_key=api_key, model=model) if (api_key or model) else groq_client
        user_prompt = f"Text to classify:\n```\n{text}\n```"
        try:
            data = client.generate_json(
                system_prompt=self.SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.0,
                max_tokens=250
            )
            intent = data.get("intent", "JOB_DESCRIPTION")
            if intent not in ["PROFILE_QUERY", "JOB_DESCRIPTION"]:
                intent = "PROFILE_QUERY" if has_question_mark else "JOB_DESCRIPTION"
            return QueryClassification(
                intent=intent,
                confidence=float(data.get("confidence", 0.9)),
                summary=str(data.get("summary", "Classified intent")),
                key_topics=list(data.get("key_topics", []))
            )
        except Exception as e:
            logger.warning(f"Classifier LLM error ({e}), applying fallback heuristic...")
            if has_question_mark or first_word in question_words:
                return QueryClassification(intent="PROFILE_QUERY", confidence=0.8, summary="Fallback: Profile question", key_topics=[])
            return QueryClassification(intent="JOB_DESCRIPTION", confidence=0.8, summary="Fallback: Job description", key_topics=[])


classifier_agent = ClassifierAgent()
