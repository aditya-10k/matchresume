from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ResumeBase(BaseModel):
    name: str = Field(..., description="Display name for resume, e.g., 'AI Resume'")


class ResumeCreate(ResumeBase):
    pass


class ResumeResponse(BaseModel):
    id: str
    name: str
    filename: str
    status: str
    created_at: datetime
    text_preview: Optional[str] = None

    class Config:
        from_attributes = True


class ResumeDetailResponse(ResumeResponse):
    raw_text: str
