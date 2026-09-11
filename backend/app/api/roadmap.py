import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, RoadmapSession, RoadmapMessage, now_utc
from app.schemas.roadmap import (
    RoadmapSessionCreate,
    RoadmapMessageCreate,
    RoadmapSessionResponse,
    RoadmapSessionListItem,
    RoadmapMessageResponse,
)
from app.agents.roadmap_agent import RoadmapAgent
from app.api.deps import (
    get_current_user,
    get_optional_groq_key,
    get_resolved_groq_model,
)
from app.utils.text_sanitizer import strip_asterisks

logger = logging.getLogger("roadmap_api")
router = APIRouter(prefix="/roadmap", tags=["Project Roadmap & Gap Analysis"])


@router.post("/sessions", response_model=RoadmapSessionResponse)
def create_roadmap_session(
    payload: RoadmapSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    groq_key: Optional[str] = Depends(get_optional_groq_key),
    groq_model: str = Depends(get_resolved_groq_model),
    x_openrouter_api_key: Optional[str] = Header(None, alias="x-openrouter-api-key"),
    x_openrouter_model: Optional[str] = Header(None, alias="x-openrouter-model"),
):
    """
    Creates a new Roadmap & Gap Analysis session by analyzing the provided Job Description
    against all verified candidate profile data (resumes and skills).
    """
    if not payload.jd_text or len(payload.jd_text.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text is too short. Please provide a substantive Job Description.",
        )

    try:
        agent = RoadmapAgent(
            api_key=groq_key,
            model=groq_model,
            openrouter_api_key=x_openrouter_api_key,
            openrouter_model=x_openrouter_model,
        )

        analysis = agent.analyze_jd_and_generate_roadmap(
            jd_text=payload.jd_text.strip(),
            user_id=current_user.id,
            db=db,
            title_override=payload.title,
        )
    except Exception as e:
        logger.error(f"Roadmap generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate roadmap analysis: {str(e)}",
        )

    # Create session in PostgreSQL
    session = RoadmapSession(
        user_id=current_user.id,
        title=analysis["title"],
        target_role=analysis.get("target_role"),
        company=analysis.get("company"),
        jd_text=payload.jd_text.strip(),
        jd_analysis=analysis.get("jd_analysis"),
    )
    db.add(session)
    db.flush()

    # Add initial user request message
    user_msg_content = f"Analyze this Job Description and propose project blueprints to bridge my gaps:\n\n{payload.jd_text.strip()[:1000]}"
    if len(payload.jd_text.strip()) > 1000:
        user_msg_content += "... [truncated for brevity]"

    user_message = RoadmapMessage(
        session_id=session.id,
        role="user",
        content=strip_asterisks(user_msg_content),
        provider="user",
    )
    db.add(user_message)

    # Add assistant roadmap response message
    assistant_message = RoadmapMessage(
        session_id=session.id,
        role="assistant",
        content=strip_asterisks(analysis["content"]),
        provider=analysis.get("provider", "groq"),
        metadata_json=analysis.get("jd_analysis"),
    )
    db.add(assistant_message)

    db.commit()
    db.refresh(session)

    return RoadmapSessionResponse(
        id=session.id,
        title=session.title,
        target_role=session.target_role,
        company=session.company,
        jd_text=session.jd_text,
        jd_analysis=session.jd_analysis,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[
            RoadmapMessageResponse(
                id=m.id,
                session_id=m.session_id,
                role=m.role,
                content=m.content,
                provider=m.provider,
                metadata_json=m.metadata_json,
                created_at=m.created_at,
            )
            for m in session.messages
        ],
    )


@router.get("/sessions", response_model=List[RoadmapSessionListItem])
def list_roadmap_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lists all roadmap analysis sessions for the current user."""
    sessions = (
        db.query(RoadmapSession)
        .filter(RoadmapSession.user_id == current_user.id)
        .order_by(RoadmapSession.updated_at.desc())
        .all()
    )

    return [
        RoadmapSessionListItem(
            id=s.id,
            title=s.title,
            target_role=s.target_role,
            company=s.company,
            created_at=s.created_at,
            updated_at=s.updated_at,
            message_count=len(s.messages) if s.messages else 0,
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}", response_model=RoadmapSessionResponse)
def get_roadmap_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves full conversation history of a specific roadmap session."""
    session = (
        db.query(RoadmapSession)
        .filter(
            RoadmapSession.id == session_id,
            RoadmapSession.user_id == current_user.id,
        )
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap session not found.",
        )

    return RoadmapSessionResponse(
        id=session.id,
        title=session.title,
        target_role=session.target_role,
        company=session.company,
        jd_text=session.jd_text,
        jd_analysis=session.jd_analysis,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[
            RoadmapMessageResponse(
                id=m.id,
                session_id=m.session_id,
                role=m.role,
                content=m.content,
                provider=m.provider,
                metadata_json=m.metadata_json,
                created_at=m.created_at,
            )
            for m in session.messages
        ],
    )


@router.post("/sessions/{session_id}/messages", response_model=RoadmapMessageResponse)
def send_roadmap_message(
    session_id: str,
    payload: RoadmapMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    groq_key: Optional[str] = Depends(get_optional_groq_key),
    groq_model: str = Depends(get_resolved_groq_model),
    x_openrouter_api_key: Optional[str] = Header(None, alias="x-openrouter-api-key"),
    x_openrouter_model: Optional[str] = Header(None, alias="x-openrouter-model"),
):
    """Sends a follow-up coaching or architecture question in an existing roadmap session."""
    session = (
        db.query(RoadmapSession)
        .filter(
            RoadmapSession.id == session_id,
            RoadmapSession.user_id == current_user.id,
        )
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap session not found.",
        )

    user_text = strip_asterisks(payload.message.strip())

    # Record user message
    user_msg = RoadmapMessage(
        session_id=session.id,
        role="user",
        content=user_text,
        provider="user",
    )
    db.add(user_msg)
    db.flush()

    try:
        agent = RoadmapAgent(
            api_key=groq_key,
            model=groq_model,
            openrouter_api_key=x_openrouter_api_key,
            openrouter_model=x_openrouter_model,
        )
        response_data = agent.generate_followup_response(
            session=session,
            new_message=user_text,
            chat_history=session.messages,
        )
    except Exception as e:
        logger.error(f"Follow-up generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate response: {str(e)}",
        )

    assistant_msg = RoadmapMessage(
        session_id=session.id,
        role="assistant",
        content=strip_asterisks(response_data["content"]),
        provider=response_data.get("provider", "groq"),
    )
    db.add(assistant_msg)

    session.updated_at = now_utc()
    db.commit()
    db.refresh(assistant_msg)

    return RoadmapMessageResponse(
        id=assistant_msg.id,
        session_id=assistant_msg.session_id,
        role=assistant_msg.role,
        content=assistant_msg.content,
        provider=assistant_msg.provider,
        metadata_json=assistant_msg.metadata_json,
        created_at=assistant_msg.created_at,
    )


@router.delete("/sessions/{session_id}")
def delete_roadmap_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletes a roadmap analysis session and its associated chat history."""
    session = (
        db.query(RoadmapSession)
        .filter(
            RoadmapSession.id == session_id,
            RoadmapSession.user_id == current_user.id,
        )
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap session not found.",
        )

    db.delete(session)
    db.commit()
    return {"status": "deleted", "id": session_id}
