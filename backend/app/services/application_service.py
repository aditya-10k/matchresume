import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.db.models import Application, Resume, GeneratedResume
from app.schemas.application import ApplicationCreate, AnalysisResponse, JDRequirements
from app.agents.orchestrator import orchestrator
from app.rag import retrieve_context


class ApplicationService:
    """Business logic for application management, JD processing, and analysis."""

    def create_application(
        self,
        db: Session,
        data: ApplicationCreate
    ) -> Application:
        app_id = str(uuid.uuid4())
        application = Application(
            id=app_id,
            jd_text=data.jd_text,
            company=data.company,
            role_title=data.role_title,
            agent_enabled=data.agent_enabled,
        )
        db.add(application)
        db.commit()
        db.refresh(application)
        return application

    def get_application(self, db: Session, application_id: str) -> Optional[Application]:
        return db.query(Application).filter(Application.id == application_id).first()

    def list_applications(self, db: Session) -> List[Application]:
        return db.query(Application).order_by(Application.created_at.desc()).all()

    def analyze_application(
        self,
        db: Session,
        application_id: str
    ) -> AnalysisResponse:
        application = self.get_application(db, application_id)
        if not application:
            raise ValueError(f"Application {application_id} not found")

        available_resumes = db.query(Resume).all()

        analysis = orchestrator.analyze(
            application_id=application.id,
            jd_text=application.jd_text,
            available_resumes=available_resumes,
            agent_enabled=application.agent_enabled
        )

        # Update application state
        application.jd_analysis = analysis.requirements.model_dump()
        application.selected_resume_id = (
            analysis.recommendation.resume_id
            if analysis.recommendation.resume_id != "none"
            else None
        )
        application.match_score = analysis.recommendation.match_score
        if not application.role_title and analysis.requirements.role:
            application.role_title = analysis.requirements.role

        db.commit()
        db.refresh(application)

        return analysis

    def tailor_application(self, db: Session, application_id: str) -> Dict[str, Any]:
        """Runs the ResumeWriter and Validator agent pipeline to tailor resume LaTeX."""
        application = self.get_application(db, application_id)
        if not application:
            raise ValueError(f"Application {application_id} not found")

        if not application.selected_resume_id:
            self.analyze_application(db, application_id)
            application = self.get_application(db, application_id)

        selected_resume = db.query(Resume).filter(Resume.id == application.selected_resume_id).first()
        if not selected_resume:
            raise ValueError("No candidate resume is available to tailor.")

        requirements = JDRequirements(**(application.jd_analysis or {}))

        evidence_chunks = []
        for term in requirements.required_skills[:4]:
            chunks = retrieve_context(query=term, top_k=2)
            evidence_chunks.extend(chunks)

        tailored_data = orchestrator.tailor_resume(
            requirements=requirements,
            resume=selected_resume,
            evidence_chunks=evidence_chunks
        )

        gen_resume = GeneratedResume(
            application_id=application.id,
            latex=tailored_data["latex_code"],
            notes=tailored_data["tailored_summary"],
        )
        db.add(gen_resume)
        db.commit()
        db.refresh(gen_resume)

        return {
            "application_id": application.id,
            "resume_id": selected_resume.id,
            "resume_name": selected_resume.name,
            "role_title": application.role_title,
            "latex_code": tailored_data["latex_code"],
            "tailored_summary": tailored_data["tailored_summary"],
            "highlighted_skills": tailored_data["highlighted_skills"],
            "validation": tailored_data["validation"]
        }

    def get_latest_tailored_resume(self, db: Session, application_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves the most recent tailored LaTeX for an application."""
        application = self.get_application(db, application_id)
        if not application:
            return None
        latest = (
            db.query(GeneratedResume)
            .filter(GeneratedResume.application_id == application_id)
            .order_by(GeneratedResume.created_at.desc())
            .first()
        )
        if not latest:
            return None
        return {
            "application_id": application.id,
            "latex_code": latest.latex,
            "tailored_summary": latest.notes,
            "version": latest.version,
            "created_at": latest.created_at
        }


application_service = ApplicationService()

