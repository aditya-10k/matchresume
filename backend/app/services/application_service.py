import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.db.models import Application, Resume, GeneratedResume, UserPreference
from app.schemas.application import ApplicationCreate, AnalysisResponse, JDRequirements
from app.agents.orchestrator import orchestrator
from app.rag import retrieve_context


class ApplicationService:
    """Business logic for application management, JD processing, and analysis."""

    def create_application(
        self,
        db: Session,
        data: ApplicationCreate,
        user_id: Optional[str] = None
    ) -> Application:
        app_id = str(uuid.uuid4())
        application = Application(
            id=app_id,
            user_id=user_id,
            jd_text=data.jd_text,
            company=data.company,
            role_title=data.role_title,
            agent_enabled=data.agent_enabled,
        )
        db.add(application)
        db.commit()
        db.refresh(application)
        return application

    def get_application(self, db: Session, application_id: str, user_id: Optional[str] = None) -> Optional[Application]:
        query = db.query(Application).filter(Application.id == application_id)
        if user_id:
            query = query.filter(Application.user_id == user_id)
        return query.first()

    def list_applications(self, db: Session, user_id: Optional[str] = None) -> List[Application]:
        query = db.query(Application)
        if user_id:
            query = query.filter(Application.user_id == user_id)
        return query.order_by(Application.created_at.desc()).all()

    def analyze_application(
        self,
        db: Session,
        application_id: str,
        groq_api_key: Optional[str] = None,
        user_id: Optional[str] = None,
        groq_model: Optional[str] = None
    ) -> AnalysisResponse:
        application = self.get_application(db, application_id, user_id=user_id)
        if not application:
            raise ValueError(f"Application {application_id} not found")

        # Query resumes scoped to user
        resume_query = db.query(Resume)
        if user_id:
            resume_query = resume_query.filter(Resume.user_id == user_id)
        available_resumes = resume_query.all()

        # Load user preferences (memory)
        pref_strings = []
        if user_id:
            prefs = db.query(UserPreference).filter(UserPreference.user_id == user_id).all()
            pref_strings = [f"{p.key}: {p.value}" for p in prefs]

        analysis = orchestrator.analyze(
            application_id=application.id,
            jd_text=application.jd_text,
            available_resumes=available_resumes,
            agent_enabled=application.agent_enabled,
            groq_api_key=groq_api_key,
            user_preferences=pref_strings,
            groq_model=groq_model,
            user_id=user_id,
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

    def tailor_application(
        self,
        db: Session,
        application_id: str,
        groq_api_key: Optional[str] = None,
        user_id: Optional[str] = None,
        groq_model: Optional[str] = None,
        preset_id: Optional[str] = "classic_tech",
        custom_template: Optional[str] = None,
        output_format: Optional[str] = "latex",
    ) -> Dict[str, Any]:
        """Runs the ResumeWriter and Validator agent pipeline to tailor resume LaTeX or Plaintext."""
        application = self.get_application(db, application_id, user_id=user_id)
        if not application:
            raise ValueError(f"Application {application_id} not found")

        if not application.selected_resume_id:
            self.analyze_application(db, application_id, groq_api_key=groq_api_key, user_id=user_id, groq_model=groq_model)
            application = self.get_application(db, application_id, user_id=user_id)

        selected_resume = db.query(Resume).filter(Resume.id == application.selected_resume_id).first()
        if not selected_resume:
            raise ValueError("No candidate resume is available to tailor.")

        requirements = JDRequirements(**(application.jd_analysis or {}))

        evidence_chunks = []
        for term in requirements.required_skills[:4]:
            chunks = retrieve_context(query=term, user_id=user_id, resume_id=selected_resume.id, top_k=2)
            evidence_chunks.extend(chunks)

        # Load user preferences (memory)
        pref_strings = []
        if user_id:
            prefs = db.query(UserPreference).filter(UserPreference.user_id == user_id).all()
            pref_strings = [f"{p.key}: {p.value}" for p in prefs]
            prefs_dict = {p.key: p.value for p in prefs}
            # Auto-inherit app-level default preset if not explicitly overridden
            if preset_id == "classic_tech" and "default_preset_id" in prefs_dict:
                preset_id = prefs_dict["default_preset_id"]
            if not custom_template and "custom_template" in prefs_dict:
                custom_template = prefs_dict["custom_template"]

        tailored_data = orchestrator.tailor_resume(
            requirements=requirements,
            resume=selected_resume,
            evidence_chunks=evidence_chunks,
            groq_api_key=groq_api_key,
            user_preferences=pref_strings,
            groq_model=groq_model,
            preset_id=preset_id,
            custom_template=custom_template,
            output_format=output_format,
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

