import logging
from typing import TypedDict, List, Optional, Any, Dict
from langgraph.graph import StateGraph, START, END

from app.schemas.application import JDRequirements, RecommendedResume, AnalysisResponse
from app.schemas.rag import EvidenceChunk
from app.db.models import Resume
from app.agents.guardrail import guardrail_agent, GuardrailResult
from app.agents.jd_analyzer import jd_analyzer
from app.agents.resume_selector import resume_selector
from app.agents.resume_writer import resume_writer, TailoredResumeOutput
from app.agents.validator import validator_agent, ValidationReport
from app.rag import retrieve_context, retrieve_batch_context

logger = logging.getLogger("orchestrator")


class AgentState(TypedDict, total=False):
    application_id: str
    user_id: Optional[str]
    jd_text: str
    available_resumes: List[Any]
    agent_enabled: bool
    groq_api_key: Optional[str]
    groq_model: Optional[str]
    user_preferences: Optional[List[str]]
    
    # Node outputs
    guardrail_result: Optional[GuardrailResult]
    requirements: Optional[JDRequirements]
    evidence_chunks: List[EvidenceChunk]
    recommendation: Optional[RecommendedResume]
    tailored_output: Optional[TailoredResumeOutput]
    validation_report: Optional[ValidationReport]
    error: Optional[str]


def guardrail_node(state: AgentState) -> Dict[str, Any]:
    """Node 1: Evaluates prompt safety and verifies it is a legitimate JD."""
    logger.info("LangGraph [Node 1]: Guardrail Agent evaluating prompt...")
    result = guardrail_agent.check(
        state["jd_text"],
        api_key=state.get("groq_api_key"),
        model=state.get("groq_model")
    )
    if not result.is_valid:
        return {
            "guardrail_result": result,
            "error": f"Guardrail Rejection [{result.category}]: {result.reason}"
        }
    return {"guardrail_result": result}


def should_continue_from_guardrail(state: AgentState) -> str:
    """Conditional router: Halts graph early if prompt is rejected by Guardrail."""
    if state.get("error") or (state.get("guardrail_result") and not state["guardrail_result"].is_valid):
        logger.warning(f"LangGraph: Guardrail intercepted invalid input: {state.get('error')}")
        return END
    return "jd_analyzer"


def jd_analyzer_node(state: AgentState) -> Dict[str, Any]:
    """Node 2: Extracts structured requirements from verified JD."""
    logger.info("LangGraph [Node 2]: JD Analyzer parsing requirements...")
    requirements = jd_analyzer.analyze(
        state["jd_text"],
        api_key=state.get("groq_api_key"),
        model=state.get("groq_model")
    )
    return {"requirements": requirements}


def rag_retrieval_node(state: AgentState) -> Dict[str, Any]:
    """Node 3: Retrieves factual evidence chunks strictly for candidate's resumes."""
    logger.info("LangGraph [Node 3]: Fast batched RAG Retrieval querying context with user tenant scoping...")
    requirements = state.get("requirements")
    user_id = state.get("user_id")
    available_resumes = state.get("available_resumes") or []
    allowed_resume_ids = {r.id for r in available_resumes if hasattr(r, "id")}

    req_skills = (requirements.required_skills if requirements else None) or []
    pref_skills = (requirements.preferred_skills if requirements else None) or []
    role = (requirements.role if requirements else None) or ""

    search_terms = req_skills + pref_skills + [role]
    clean_terms = [t.strip() for t in search_terms if t and t.strip()][:5]

    # Batched vector retrieval: single forward pass replaces 5 sequential inference loops
    all_chunks = retrieve_batch_context(queries=clean_terms, user_id=user_id, top_k=3) or []
    
    collected_evidence: List[EvidenceChunk] = []
    seen_content = set()
    for chunk in all_chunks:
        # Multi-tenant defense in depth: ensure chunk belongs to allowed resume IDs if provided
        if allowed_resume_ids and hasattr(chunk, "resume_id") and chunk.resume_id not in allowed_resume_ids:
            continue
        if chunk.content not in seen_content:
            seen_content.add(chunk.content)
            collected_evidence.append(chunk)

    return {"evidence_chunks": collected_evidence}


def resume_selector_node(state: AgentState) -> Dict[str, Any]:
    """Node 4: Evaluates candidate resumes against requirements and evidence."""
    logger.info("LangGraph [Node 4]: Resume Selector evaluating fit...")
    recommendation = resume_selector.select_best_resume(
        requirements=state["requirements"],
        available_resumes=state.get("available_resumes", []),
        all_evidence=state.get("evidence_chunks", []),
        api_key=state.get("groq_api_key"),
        model=state.get("groq_model")
    )
    return {"recommendation": recommendation}


def build_analysis_graph():
    """Constructs and compiles the LangGraph StateGraph for position fit analysis."""
    workflow = StateGraph(AgentState)

    workflow.add_node("guardrail", guardrail_node)
    workflow.add_node("jd_analyzer", jd_analyzer_node)
    workflow.add_node("rag_retrieval", rag_retrieval_node)
    workflow.add_node("resume_selector", resume_selector_node)

    workflow.add_edge(START, "guardrail")
    workflow.add_conditional_edges(
        "guardrail",
        should_continue_from_guardrail,
        {
            "jd_analyzer": "jd_analyzer",
            END: END
        }
    )
    workflow.add_edge("jd_analyzer", "rag_retrieval")
    workflow.add_edge("rag_retrieval", "resume_selector")
    workflow.add_edge("resume_selector", END)

    return workflow.compile()


# Compile the LangGraph graph
analysis_graph = build_analysis_graph()


class AnalysisOrchestrator:
    """
    Coordinates multi-agent workflows using LangGraph.
    Governs the Guardrail, JD Analyzer, RAG retrieval, and Resume Selector.
    """

    def analyze(
        self,
        application_id: str,
        jd_text: str,
        available_resumes: List[Resume],
        agent_enabled: bool = True,
        groq_api_key: Optional[str] = None,
        user_preferences: Optional[List[str]] = None,
        groq_model: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> AnalysisResponse:
        initial_state: AgentState = {
            "application_id": application_id,
            "user_id": user_id,
            "jd_text": jd_text,
            "available_resumes": available_resumes,
            "agent_enabled": agent_enabled,
            "groq_api_key": groq_api_key,
            "groq_model": groq_model,
            "user_preferences": user_preferences or [],
            "evidence_chunks": [],
        }

        # Execute LangGraph graph
        final_state = analysis_graph.invoke(initial_state)

        # Check for guardrail rejection
        if final_state.get("error"):
            raise ValueError(final_state["error"])

        return AnalysisResponse(
            application_id=application_id,
            requirements=final_state["requirements"],
            recommendation=final_state["recommendation"],
            relevant_evidence=final_state.get("evidence_chunks", [])
        )

    def tailor_resume(
        self,
        requirements: JDRequirements,
        resume: Resume,
        evidence_chunks: List[EvidenceChunk],
        groq_api_key: Optional[str] = None,
        user_preferences: Optional[List[str]] = None,
        groq_model: Optional[str] = None,
        preset_id: Optional[str] = "classic_tech",
        custom_template: Optional[str] = None,
        output_format: Optional[str] = "latex",
    ) -> Dict[str, Any]:
        """Runs ResumeWriter and Validator agents to tailor and audit LaTeX or Plaintext resume."""
        logger.info(f"Synthesizing tailored resume ({output_format}, preset={preset_id}) for {resume.name} using model {groq_model or 'default'}...")
        tailored = resume_writer.tailor(
            jd_requirements=requirements,
            candidate_name=resume.name,
            candidate_raw_text=resume.raw_text,
            evidence_chunks=evidence_chunks,
            api_key=groq_api_key,
            user_preferences=user_preferences,
            model=groq_model,
            preset_id=preset_id,
            custom_template=custom_template,
            output_format=output_format,
        )

        logger.info("Auditing tailored resume with Validator Agent...")
        validation = validator_agent.validate(
            latex_code=tailored.latex_code,
            source_resume_text=resume.raw_text,
            api_key=groq_api_key,
            model=groq_model,
        )

        return {
            "latex_code": tailored.latex_code,
            "tailored_summary": tailored.tailored_summary,
            "highlighted_skills": tailored.highlighted_skills,
            "validation": validation.model_dump()
        }


orchestrator = AnalysisOrchestrator()
