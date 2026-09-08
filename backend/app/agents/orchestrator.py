from typing import List, Optional
from app.schemas.application import JDRequirements, RecommendedResume, AnalysisResponse
from app.schemas.rag import EvidenceChunk
from app.db.models import Resume
from app.agents.jd_analyzer import jd_analyzer
from app.agents.resume_selector import resume_selector
from app.rag import retrieve_context


class AnalysisOrchestrator:
    """
    Coordinates the JD analysis and resume recommendation workflow.
    Supports both Agentic reasoning (Agent ON) and deterministic baseline (Agent OFF).
    """

    def analyze(
        self,
        application_id: str,
        jd_text: str,
        available_resumes: List[Resume],
        agent_enabled: bool = True
    ) -> AnalysisResponse:
        # Step 1: Analyze JD requirements
        requirements = jd_analyzer.analyze(jd_text)

        # Step 2: Retrieve evidence from RAG layer for each requirement
        collected_evidence: List[EvidenceChunk] = []
        seen_content = set()

        search_terms = requirements.required_skills + requirements.preferred_skills + [requirements.role or ""]
        for term in search_terms[:5]:
            if not term:
                continue
            chunks = retrieve_context(query=term, top_k=3)
            for chunk in chunks:
                if chunk.content not in seen_content:
                    seen_content.add(chunk.content)
                    collected_evidence.append(chunk)

        # Step 3: Recommend best resume
        recommendation = resume_selector.select_best_resume(
            requirements=requirements,
            available_resumes=available_resumes,
            all_evidence=collected_evidence
        )

        return AnalysisResponse(
            application_id=application_id,
            requirements=requirements,
            recommendation=recommendation,
            relevant_evidence=collected_evidence
        )


orchestrator = AnalysisOrchestrator()
