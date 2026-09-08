import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Application, GeneratedResume, Message, Resume, UserPreference
from app.agents.chat_agent import chat_agent
from app.api.deps import get_current_user, get_resolved_groq_key, get_resolved_groq_model
from app.db.models import User

logger = logging.getLogger("chat_api")
router = APIRouter(prefix="/applications", tags=["Application Chat & Refinement"])


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=2, description="Instruction to refine or modify resume")


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: str


class ChatResponse(BaseModel):
    message: str
    latex: str
    version: int
    modifications_made: List[str] = []


@router.get("/{application_id}/messages", response_model=List[MessageResponse])
def get_chat_history(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve the conversation history for this application."""
    application = db.query(Application).filter(
        Application.id == application_id,
        (Application.user_id == current_user.id) | (Application.user_id == None)
    ).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    msgs = db.query(Message).filter(Message.application_id == application_id).order_by(Message.created_at.asc()).all()
    return [
        MessageResponse(
            id=m.id,
            role=m.role,
            content=m.content,
            created_at=m.created_at.isoformat() if m.created_at else ""
        )
        for m in msgs
    ]


@router.post("/{application_id}/chat", response_model=ChatResponse)
def send_chat_message(
    application_id: str,
    data: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    groq_api_key: str = Depends(get_resolved_groq_key),
    groq_model: str = Depends(get_resolved_groq_model),
):
    """Send an instruction to refine the LaTeX resume conversationally."""
    application = db.query(Application).filter(
        Application.id == application_id,
        (Application.user_id == current_user.id) | (Application.user_id == None)
    ).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    # Fetch latest tailored resume
    latest_gen = db.query(GeneratedResume).filter(
        GeneratedResume.application_id == application_id
    ).order_by(GeneratedResume.version.desc()).first()

    if not latest_gen or not latest_gen.latex:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No tailored resume found to edit. Please tailor a resume first."
        )

    # Fetch candidate source resume text
    source_text = ""
    if application.selected_resume_id:
        source_resume = db.query(Resume).filter(Resume.id == application.selected_resume_id).first()
        if source_resume:
            source_text = source_resume.raw_text

    # Fetch chat history for context
    past_msgs = db.query(Message).filter(Message.application_id == application_id).order_by(Message.created_at.asc()).all()
    history = [{"role": m.role, "content": m.content} for m in past_msgs]

    # Fetch user preferences (memory)
    prefs = db.query(UserPreference).filter(
        (UserPreference.user_id == current_user.id) | (UserPreference.user_id == None)
    ).all()
    pref_strings = [f"{p.key}: {p.value}" for p in prefs]

    # Record User Message
    user_msg = Message(application_id=application_id, role="user", content=data.message.strip())
    db.add(user_msg)
    db.commit()

    # Run Chat Refinement Agent
    try:
        refinement = chat_agent.refine(
            current_latex=latest_gen.latex,
            user_instruction=data.message.strip(),
            candidate_source_text=source_text,
            chat_history=history,
            user_preferences=pref_strings,
            api_key=groq_api_key,
            model=groq_model,
        )
    except Exception as e:
        logger.error(f"Chat refinement error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Refinement failed: {str(e)}")

    # Record Assistant Message
    assistant_msg = Message(application_id=application_id, role="assistant", content=refinement.message)
    db.add(assistant_msg)

    # Save new version of GeneratedResume
    new_version = (latest_gen.version or 1) + 1
    new_gen = GeneratedResume(
        application_id=application_id,
        latex=refinement.updated_latex,
        version=new_version
    )
    db.add(new_gen)
    db.commit()

    return ChatResponse(
        message=refinement.message,
        latex=refinement.updated_latex,
        version=new_version,
        modifications_made=refinement.modifications_made
    )
