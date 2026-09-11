import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    Boolean,
    Integer,
    ForeignKey,
    JSON
)
from sqlalchemy.orm import relationship
from app.db.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=True)
    name = Column(String(255), nullable=False, default="User")
    hashed_password = Column(String(255), nullable=True)
    encrypted_groq_key = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_utc)

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="user", cascade="all, delete-orphan")
    roadmap_sessions = relationship("RoadmapSession", back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String(255), nullable=False)  # e.g., "AI Resume", "Backend Resume"
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=True)
    raw_text = Column(Text, nullable=False)
    status = Column(String(50), default="processed")  # "processing", "processed", "failed"
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    user = relationship("User", back_populates="resumes")


class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    company = Column(String(255), nullable=True)
    role_title = Column(String(255), nullable=True)
    jd_text = Column(Text, nullable=False)
    jd_analysis = Column(JSON, nullable=True)  # Structured requirements from JD Analyzer
    selected_resume_id = Column(String(36), ForeignKey("resumes.id"), nullable=True)
    agent_enabled = Column(Boolean, default=True)
    match_score = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    user = relationship("User", back_populates="applications")
    selected_resume = relationship("Resume")
    generated_resumes = relationship("GeneratedResume", back_populates="application", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="application", cascade="all, delete-orphan")


class GeneratedResume(Base):
    __tablename__ = "generated_resumes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    latex = Column(Text, nullable=False)
    version = Column(Integer, default=1)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc)

    application = relationship("Application", back_populates="generated_resumes")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # "user", "assistant", "system"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=now_utc)

    application = relationship("Application", back_populates="messages")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    key = Column(String(100), nullable=False)  # e.g., "one_page_limit", "prioritize_projects"
    value = Column(Text, nullable=False)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    user = relationship("User", back_populates="preferences")


class RoadmapSession(Base):
    __tablename__ = "roadmap_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False, default="Career Roadmap")
    target_role = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    jd_text = Column(Text, nullable=False)
    jd_analysis = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    user = relationship("User", back_populates="roadmap_sessions")
    messages = relationship(
        "RoadmapMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="RoadmapMessage.created_at",
    )


class RoadmapMessage(Base):
    __tablename__ = "roadmap_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("roadmap_sessions.id"), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # "user", "assistant", "system"
    content = Column(Text, nullable=False)
    provider = Column(String(50), nullable=True, default="groq")  # "groq", "openrouter", "system"
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=now_utc)

    session = relationship("RoadmapSession", back_populates="messages")
