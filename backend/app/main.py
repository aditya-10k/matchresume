from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.db.session import init_db
from app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database tables
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for Resume Copilot - AI Resume Intelligence",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes at root and with /api prefix for maximum flexibility
app.include_router(api_router)
app.include_router(api_router, prefix="/api")


@app.get("/health", tags=["Health"])
def health_check():
    permitted = settings.get_permitted_models()
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "rag": "active",
        "default_model": permitted[0],
        "models": permitted,
    }


@app.get("/models", tags=["Models"])
@app.get("/api/models", tags=["Models"])
def get_permitted_models():
    """Returns the permitted LLM models configured in the backend .env."""
    permitted = settings.get_permitted_models()
    return {
        "default_model": permitted[0],
        "models": permitted,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
