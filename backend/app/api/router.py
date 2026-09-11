from fastapi import APIRouter
from app.api.resumes import router as resumes_router
from app.api.applications import router as applications_router
from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.preferences import router as preferences_router
from app.api.knowledge import router as knowledge_router
from app.api.career import router as career_router
from app.api.roadmap import router as roadmap_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(resumes_router)
api_router.include_router(applications_router)
api_router.include_router(chat_router)
api_router.include_router(preferences_router)
api_router.include_router(knowledge_router)
api_router.include_router(career_router)
api_router.include_router(roadmap_router)

