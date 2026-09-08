import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User
from app.api.deps import get_current_user, get_optional_groq_key, get_resolved_groq_model
from app.agents.guardrail import guardrail_agent, GuardrailResult
from app.agents.classifier import classifier_agent, QueryClassification
from app.agents.career_query_agent import career_query_agent, CareerQueryAnswer

logger = logging.getLogger("career_api")

router = APIRouter(prefix="/career", tags=["Career Intelligence & Dispatch"])


class StudioDispatchRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Raw user prompt from Studio input bar")


class StudioDispatchResponse(BaseModel):
    status: str = Field(..., description="'success' | 'rejected'")
    intent: str = Field(..., description="'PROFILE_QUERY' | 'JOB_DESCRIPTION' | 'REJECTED'")
    guardrail: GuardrailResult
    classification: Optional[QueryClassification] = None
    profile_answer: Optional[CareerQueryAnswer] = None


class CareerQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Follow-up or direct career question")


@router.post("/dispatch", response_model=StudioDispatchResponse)
def dispatch_studio_prompt(
    data: StudioDispatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    groq_api_key: Optional[str] = Depends(get_optional_groq_key),
    groq_model: str = Depends(get_resolved_groq_model),
):
    """
    Dual-mode pipeline router for Studio:
    Node 1: Guardrail Agent (checks safety and domain relevance).
    Node 2: Classifier Agent (classifies into PROFILE_QUERY vs JOB_DESCRIPTION).
    Node 3: Execution Node (synthesizes RAG answer for PROFILE_QUERY or signals to tailor for JOB_DESCRIPTION).
    """
    prompt = data.prompt.strip()
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt cannot be empty."
        )

    # 1. Guardrail Node
    logger.info("Studio Dispatch [Node 1]: Guardrail Agent evaluating prompt...")
    try:
        guardrail_res = guardrail_agent.check(prompt, api_key=groq_api_key, model=groq_model)
    except Exception as e:
        logger.error(f"Guardrail error: {e}")
        guardrail_res = GuardrailResult(is_valid=True, category="VALID", reason="Fallback passed")

    if not guardrail_res.is_valid:
        return StudioDispatchResponse(
            status="rejected",
            intent="REJECTED",
            guardrail=guardrail_res,
            classification=None,
            profile_answer=None
        )

    # 2. Classifier Node
    logger.info("Studio Dispatch [Node 2]: Classifier Agent determining intent...")
    try:
        classification = classifier_agent.classify(prompt, api_key=groq_api_key, model=groq_model)
    except Exception as e:
        logger.error(f"Classifier error: {e}")
        # Default heuristic based on question mark
        intent = "PROFILE_QUERY" if "?" in prompt else "JOB_DESCRIPTION"
        classification = QueryClassification(intent=intent, confidence=0.7, summary="Fallback intent", key_topics=[])

    # 3. Execution Node
    profile_answer = None
    if classification.intent == "PROFILE_QUERY":
        logger.info("Studio Dispatch [Node 3]: Career Query Agent answering profile inquiry...")
        profile_answer = career_query_agent.answer_query(
            query=prompt,
            user_id=current_user.id,
            api_key=groq_api_key,
            model=groq_model
        )

    return StudioDispatchResponse(
        status="success",
        intent=classification.intent,
        guardrail=guardrail_res,
        classification=classification,
        profile_answer=profile_answer
    )


@router.post("/query", response_model=CareerQueryAnswer)
def query_career_profile(
    data: CareerQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    groq_api_key: Optional[str] = Depends(get_optional_groq_key),
    groq_model: str = Depends(get_resolved_groq_model),
):
    """Answers career questions directly using ChromaDB vector store grounding."""
    return career_query_agent.answer_query(
        query=data.query.strip(),
        user_id=current_user.id,
        api_key=groq_api_key,
        model=groq_model
    )
