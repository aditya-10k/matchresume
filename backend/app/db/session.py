import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from typing import Generator
from app.config import settings

db_url = settings.DATABASE_URL.strip()
# Auto-detect installed PostgreSQL driver (psycopg2 or psycopg v3) for Render / Python 3.11-3.14 compatibility
if db_url.startswith(("postgres://", "postgresql://", "postgresql+")):
    scheme_rest = db_url.split("://", 1)[1]
    try:
        import psycopg2  # noqa: F401
        db_url = f"postgresql+psycopg2://{scheme_rest}"
    except ImportError:
        try:
            import psycopg  # noqa: F401
            db_url = f"postgresql+psycopg://{scheme_rest}"
        except ImportError:
            db_url = f"postgresql://{scheme_rest}"

if db_url.startswith("sqlite:///./"):
    backend_dir = Path(__file__).resolve().parent.parent.parent
    db_path = backend_dir / db_url.replace("sqlite:///./", "")
    db_url = f"sqlite:///{db_path}"

connect_args = {}
engine_kwargs: dict = {"echo": False}

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    # Cloud Postgres connection pooling
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(
    db_url,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a SQLAlchemy database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes database tables defined in models."""
    from app.db import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
