import logging
import re
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

from app.db.models import Resume, RoadmapSession, RoadmapMessage
from app.agents.groq_client import groq_client, GroqClient
from app.utils.text_sanitizer import strip_asterisks

logger = logging.getLogger("roadmap_agent")

SYSTEM_ROADMAP_PROMPT = """You are a Principal Engineering Leader, Staff Software Architect, and Career Strategist.
Your goal is to perform a rigorous gap analysis of a candidate's verified profile and technical background against a target Job Description (JD).
Then, you design 2 high-impact, production-grade project blueprints that the candidate should build to definitively prove they meet the missing requirements.

CRITICAL FORMATTING RULES:
1. STRICT ZERO-ASTERISK RULE: You MUST NEVER use asterisks (* or **) anywhere in your output.
   - Do NOT use **bold** or *italic*.
   - Do NOT use asterisk bullets (* item).
   - Use clean hyphen bullets (- item) or numbered lists (1. item).
   - Use clear uppercase headings or markdown hashes (#, ##, ###) without asterisks.
2. Be technically deep, specific, and realistic. Avoid generic advice like "learn Docker". Instead specify concrete architectures, data pipelines, caching tiers, failure recovery, or evaluation frameworks.
3. Every project proposal must solve real production problems related to the JD requirements that the candidate currently lacks.
4. COMPLETENESS GUARANTEE: Deliver high density and concrete technical specificity while ensuring BOTH projects and the 30-Day Execution Roadmap are completed in full without truncation.

OUTPUT FORMAT:
Provide a clear, authoritative response structured in the following sections:

ROLE AND LEVEL OVERVIEW
Brief summary of the target role, seniority level, and primary focus areas from the JD.

VERIFIED MATCHES AND EXISTING STRENGTHS
List the candidate's existing technical skills, frameworks, and experiences that directly satisfy the JD requirements.

CRITICAL SKILL AND ARCHITECTURE GAPS
Highlight the specific requirements, tools, scale challenges, or domain knowledge in the JD that are not evident in the candidate's current background.

RECOMMENDED PROJECTS TO BUILD (2 HIGH-IMPACT BLUEPRINTS)
For each project, include:
Project Title: [Descriptive title]
1. Problem Statement: Why this project matters and what real-world problem it solves.
2. Recommended Tech Stack: Specific tools, libraries, databases, and infra (e.g. FastAPI, pgvector, Redis, Kafka, ClickHouse, Docker).
3. Core Architecture and Features: Key components, async processing, data flow, failure modes.
4. Production Realities to Implement: Specific enterprise patterns to include (e.g. tenant isolation, rate limiting, structured logging, latency benchmarking).
5. ATS Resume Bullets to Add: 2 to 3 high-impact bullet points (starting with strong power verbs and quantifiable impact, strictly zero asterisks) that the candidate can put on their resume once built.
6. Interview Talking Points: How to explain the trade-offs and architectural decisions during technical rounds.

30-DAY EXECUTION ROADMAP
Week 1 to Week 4 concrete milestones to build, test, and showcase the projects.
"""

SYSTEM_FOLLOWUP_PROMPT = """You are a Principal Engineering Leader and Staff Software Architect continuing a coaching conversation with a candidate about their target Job Description and career project roadmap.

CRITICAL FORMATTING RULES:
1. STRICT ZERO-ASTERISK RULE: You MUST NEVER use asterisks (* or **) anywhere in your output.
   - Do NOT use **bold** or *italic*.
   - Do NOT use asterisk bullets (* item).
   - Use clean hyphen bullets (- item) or numbered lists (1. item).
   - Use clean uppercase headings or markdown hashes without asterisks.
2. Provide direct, production-grade technical guidance. If asked for code, schemas, system design, or interview advice, provide concrete, production-ready examples.
"""


class RoadmapAgent:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        openrouter_api_key: Optional[str] = None,
        openrouter_model: Optional[str] = None,
    ):
        if api_key or model or openrouter_api_key or openrouter_model:
            self.client = GroqClient(
                api_key=api_key,
                model=model,
                openrouter_api_key=openrouter_api_key,
                openrouter_model=openrouter_model,
            )
        else:
            self.client = groq_client

    def _collect_candidate_profile(self, user_id: Optional[str], db: Session) -> str:
        """Collects and summarizes all candidate resumes and verified background from the database."""
        if not user_id:
            return "Candidate profile: No stored resumes found. Provide recommendations based on first principles for this JD."

        resumes = db.query(Resume).filter(Resume.user_id == user_id).all()
        if not resumes:
            return "Candidate profile: No stored resumes found in database. Analyze JD and propose best-in-class projects."

        collected_texts = []
        for idx, r in enumerate(resumes):
            header = f"--- RESUME {idx + 1}: {r.name} ---"
            raw = r.raw_text.strip()[:4000]
            collected_texts.append(f"{header}\n{raw}")

        return "\n\n".join(collected_texts)

    def analyze_jd_and_generate_roadmap(
        self,
        jd_text: str,
        user_id: Optional[str],
        db: Session,
        title_override: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyzes the target JD against candidate profile data and returns:
        - formatted roadmap message
        - title / target_role / company metadata
        - provider used ('groq' or 'openrouter')
        """
        candidate_profile = self._collect_candidate_profile(user_id=user_id, db=db)

        # Quick metadata extraction prompt for session title and role
        meta_prompt = f"""Extract the job title and company from this job description text:
{jd_text[:1500]}

Return valid JSON with:
{{
  "title": "Role Title at Company",
  "target_role": "Role Title",
  "company": "Company Name"
}}"""
        meta_data = {}
        try:
            meta_data = self.client.generate_json(
                system_prompt="Extract metadata from job description. Return JSON only without asterisks.",
                user_prompt=meta_prompt,
                temperature=0.0,
            )
        except Exception as e:
            logger.warning(f"Metadata extraction fallback: {e}")

        title = title_override or meta_data.get("title")
        if not title or title.strip() == "":
            first_line = jd_text.strip().split("\n")[0][:60].strip()
            title = first_line if len(first_line) > 5 else "Career Project Roadmap"

        target_role = meta_data.get("target_role", "Software Engineer")
        company = meta_data.get("company", "Target Company")

        user_prompt = f"""CANDIDATE VERIFIED PROFILE:
{candidate_profile}

TARGET JOB DESCRIPTION:
{jd_text}

Perform a forensic gap analysis of the candidate's profile against the job description requirements.
Then recommend 2 concrete, production-grade projects the candidate should build to bridge the gaps and land this role.
Ensure you complete all 6 sections for both projects and the 30-day execution roadmap in full.
Strictly adhere to the zero-asterisk rule in all parts of your answer."""

        content = self.client.generate_text(
            system_prompt=SYSTEM_ROADMAP_PROMPT,
            user_prompt=user_prompt,
            temperature=0.2,
            max_tokens=6000,
        )
        content = strip_asterisks(content)

        return {
            "title": strip_asterisks(title),
            "target_role": strip_asterisks(target_role),
            "company": strip_asterisks(company),
            "content": content,
            "provider": getattr(self.client, "last_provider_used", "groq"),
            "jd_analysis": meta_data,
        }

    def generate_followup_response(
        self,
        session: RoadmapSession,
        new_message: str,
        chat_history: List[RoadmapMessage],
    ) -> Dict[str, Any]:
        """Generates a contextual follow-up response in an ongoing roadmap session."""
        history_context = []
        for msg in chat_history[-8:]:
            role_label = "Candidate" if msg.role == "user" else "Principal Architect"
            history_context.append(f"{role_label}: {msg.content}")

        history_str = "\n\n".join(history_context)

        prompt = f"""TARGET JOB DESCRIPTION EXCERPT:
{session.jd_text[:1500]}

RECENT CONVERSATION HISTORY:
{history_str}

CANDIDATE FOLLOW-UP QUESTION:
{new_message}

Provide a comprehensive, authoritative response answering the candidate's question.
Strictly remember: ZERO asterisks allowed anywhere."""

        content = self.client.generate_text(
            system_prompt=SYSTEM_FOLLOWUP_PROMPT,
            user_prompt=prompt,
            temperature=0.2,
            max_tokens=4000,
        )
        content = strip_asterisks(content)

        return {
            "content": content,
            "provider": getattr(self.client, "last_provider_used", "groq"),
        }
