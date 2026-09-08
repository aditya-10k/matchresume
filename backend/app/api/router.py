from fastapi import APIRouter
from app.api.resumes import router as resumes_router

api_router = APIRouter()
api_router.include_router(resumes_router)
