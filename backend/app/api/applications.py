from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    AnalysisResponse,
    TailorRequest,
)
from app.services.application_service import application_service
from app.services.pdf_service import extract_text_from_pdf_bytes

from app.api.deps import get_current_user, get_resolved_groq_key, get_resolved_groq_model
from app.db.models import User

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new job application from raw JD text."""
    if not data.jd_text or not data.jd_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text is required."
        )
    words = data.jd_text.strip().split()
    if len(words) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Input is too brief ({len(words)} words). Please provide a realistic job description with requirements, qualifications, or responsibilities."
        )
    return application_service.create_application(db, data, user_id=current_user.id)


@router.post("/from-pdf", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application_from_pdf(
    file: UploadFile = File(...),
    company: Optional[str] = Form(None),
    role_title: Optional[str] = Form(None),
    agent_enabled: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new job application by uploading a JD PDF."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are supported.")
    
    content = await file.read()
    try:
        jd_text = extract_text_from_pdf_bytes(content)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=f"Failed to read PDF: {e}")
    
    if not jd_text.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="No readable text found in JD PDF.")

    app_data = ApplicationCreate(
        jd_text=jd_text,
        company=company,
        role_title=role_title,
        agent_enabled=agent_enabled
    )
    return application_service.create_application(db, app_data, user_id=current_user.id)


@router.get("", response_model=List[ApplicationResponse])
def list_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all past applications."""
    return application_service.list_applications(db, user_id=current_user.id)


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get details of a specific application."""
    app = application_service.get_application(db, application_id, user_id=current_user.id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
    return app


@router.delete("/{application_id}")
def delete_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an application and its associated generated resumes and messages."""
    app = application_service.get_application(db, application_id, user_id=current_user.id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
    db.delete(app)
    db.commit()
    return {"status": "deleted", "id": application_id}


@router.post("/{application_id}/analyze", response_model=AnalysisResponse)
def analyze_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    groq_api_key: str = Depends(get_resolved_groq_key),
    groq_model: str = Depends(get_resolved_groq_model),
):
    """Run JD Analyzer and Resume Selector agents to match and score resumes."""
    try:
        return application_service.analyze_application(
            db,
            application_id,
            groq_api_key=groq_api_key,
            user_id=current_user.id,
            groq_model=groq_model,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Analysis failed: {str(e)}")


@router.post("/{application_id}/tailor")
def tailor_application(
    application_id: str,
    payload: Optional[TailorRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    groq_api_key: str = Depends(get_resolved_groq_key),
    groq_model: str = Depends(get_resolved_groq_model),
):
    """Runs the ResumeWriterAgent and ValidatorAgent to generate and audit a tailored LaTeX or Plaintext resume."""
    try:
        preset_id = payload.preset_id if payload else "classic_tech"
        custom_template = payload.custom_template if payload else None
        output_format = payload.output_format if payload else "latex"
        return application_service.tailor_application(
            db,
            application_id,
            groq_api_key=groq_api_key,
            user_id=current_user.id,
            groq_model=groq_model,
            preset_id=preset_id,
            custom_template=custom_template,
            output_format=output_format,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Tailoring failed: {str(e)}")


@router.get("/{application_id}/tailor")
def get_tailored_resume(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve the latest tailored LaTeX code and summary for this application."""
    app = application_service.get_application(db, application_id, user_id=current_user.id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
    data = application_service.get_latest_tailored_resume(db, application_id, user_id=current_user.id)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No tailored resume generated yet.")
    return data


@router.post("/{application_id}/validate")
def validate_custom_latex(
    application_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    groq_api_key: str = Depends(get_resolved_groq_key),
    groq_model: str = Depends(get_resolved_groq_model),
):
    """Audits custom user-edited LaTeX code for syntax errors and factual hallucination."""
    from app.agents.validator import validator_agent
    from app.db.models import Resume

    app = application_service.get_application(db, application_id, user_id=current_user.id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    latex_code = payload.get("latex_code", "")
    if not latex_code.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="latex_code is required.")

    source_text = ""
    if app.selected_resume_id:
        resume = db.query(Resume).filter(Resume.id == app.selected_resume_id, Resume.user_id == current_user.id).first()
        if resume:
            source_text = resume.raw_text

    try:
        report = validator_agent.validate(
            latex_code=latex_code,
            source_resume_text=source_text,
            api_key=groq_api_key,
            model=groq_model,
        )
        return report.model_dump()
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Validation failed: {str(e)}")
