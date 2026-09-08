import uuid
from typing import List, Optional
from sqlalchemy.orm import Session

from app.db.models import Application, Resume
from app.schemas.application import ApplicationCreate, AnalysisResponse
from app.agents.orchestrator import orchestrator


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


application_service = ApplicationService()
