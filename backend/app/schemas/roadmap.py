from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime


class RoadmapSessionCreate(BaseModel):
    jd_text: str = Field(..., min_length=10, description='Full or excerpted Job Description text')
    title: Optional[str] = Field(None, description='Optional session title')


class RoadmapMessageCreate(BaseModel):
    message: str = Field(..., min_length=1, description='Follow-up message or question')


class RoadmapMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    provider: Optional[str] = 'groq'
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RoadmapSessionListItem(BaseModel):
    id: str
    title: str
    target_role: Optional[str] = None
    company: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True


class RoadmapSessionResponse(BaseModel):
    id: str
    title: str
    target_role: Optional[str] = None
    company: Optional[str] = None
    jd_text: str
    jd_analysis: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    messages: List[RoadmapMessageResponse] = []

    class Config:
        from_attributes = True
