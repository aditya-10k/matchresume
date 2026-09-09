from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid

from app.db.session import get_db
from app.db.models import Resume, User
from app.schemas.resume import ResumeResponse, ResumeDetailResponse
from app.services.pdf_service import extract_text_from_pdf_bytes
from app.rag import ingest_resume
from app.api.deps import get_current_user

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload and parse a resume PDF:
    1. Extracts raw text from PDF.
    2. Calls RAG ingestion (hooks into ChromaDB / user RAG logic).
    3. Persists resume metadata in PostgreSQL.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported."
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty."
        )

    try:
        raw_text = extract_text_from_pdf_bytes(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Failed to extract text from PDF: {str(e)}"
        )

    if not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="No readable text could be extracted from this PDF. Scanned images are not yet supported."
        )

    resume_id = str(uuid.uuid4())
    display_name = name.strip() if name and name.strip() else os.path.splitext(file.filename)[0]

    # Save to uploads directory if exists or keep metadata
    os.makedirs("uploads", exist_ok=True)
    stored_path = os.path.join("uploads", f"{resume_id}_{file.filename}")
    with open(stored_path, "wb") as f:
        f.write(content)

    # Ingest into RAG knowledge base
    try:
        ingest_result = ingest_resume(
            text=raw_text,
            resume_id=resume_id,
            metadata={
                "source": file.filename,
                "name": display_name,
                "user_id": current_user.id,
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error ingesting resume into vector knowledge base: {str(e)}"
        )

    # Persist in relational DB
    db_resume = Resume(
        id=resume_id,
        user_id=current_user.id,
        name=display_name,
        filename=file.filename,
        file_path=stored_path,
        raw_text=raw_text,
        status="processed"
    )
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)

    return ResumeResponse(
        id=db_resume.id,
        name=db_resume.name,
        filename=db_resume.filename,
        status=db_resume.status,
        created_at=db_resume.created_at,
        text_preview=raw_text[:200] + "..." if len(raw_text) > 200 else raw_text,
        raw_text=raw_text
    )


@router.get("", response_model=List[ResumeResponse])
def list_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all uploaded resumes for the current user."""
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .all()
    )
    results = []
    for r in resumes:
        preview = r.raw_text[:200] + "..." if len(r.raw_text) > 200 else r.raw_text
        results.append(ResumeResponse(
            id=r.id,
            name=r.name,
            filename=r.filename,
            status=r.status,
            created_at=r.created_at,
            text_preview=preview,
            raw_text=r.raw_text
        ))
    return results


@router.get("/{resume_id}", response_model=ResumeDetailResponse)
def get_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details and raw text of a specific resume."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    
    return ResumeDetailResponse(
        id=resume.id,
        name=resume.name,
        filename=resume.filename,
        status=resume.status,
        created_at=resume.created_at,
        raw_text=resume.raw_text,
        text_preview=resume.raw_text[:200] + "..." if len(resume.raw_text) > 200 else resume.raw_text
    )


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a resume by ID."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    
    if resume.file_path and os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except OSError:
            pass

    # Clean up vector chunks from ChromaDB
    try:
        from app.rag.vector_store import get_vector_store
        get_vector_store().delete_resume(resume_id)
    except Exception as e:
        import logging
        logging.getLogger("resumes_api").warning(f"Could not delete vector chunks for resume {resume_id}: {e}")

    db.delete(resume)
    db.commit()
    return None
