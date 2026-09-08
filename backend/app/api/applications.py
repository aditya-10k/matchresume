from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    AnalysisResponse,
)
from app.services.application_service import application_service
from app.services.pdf_service import extract_text_from_pdf_bytes

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    data: ApplicationCreate,
    db: Session = Depends(get_db)
):
    """Create a new job application from raw JD text."""
    if not data.jd_text or not data.jd_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text is required."
        )
    return application_service.create_application(db, data)


@router.post("/from-pdf", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application_from_pdf(
    file: UploadFile = File(...),
    company: Optional[str] = Form(None),
    role_title: Optional[str] = Form(None),
    agent_enabled: bool = Form(True),
    db: Session = Depends(get_db)
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
    return application_service.create_application(db, app_data)


@router.get("", response_model=List[ApplicationResponse])
def list_applications(db: Session = Depends(get_db)):
    """Retrieve all past applications."""
    return application_service.list_applications(db)


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(application_id: str, db: Session = Depends(get_db)):
    """Get details of a specific application."""
    app = application_service.get_application(db, application_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
    return app


@router.post("/{application_id}/analyze", response_model=AnalysisResponse)
def analyze_application(application_id: str, db: Session = Depends(get_db)):
    """Run JD Analyzer and Resume Selector agents to match and score resumes."""
    try:
        return application_service.analyze_application(db, application_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Analysis failed: {str(e)}")
