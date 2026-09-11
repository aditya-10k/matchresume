from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password (min 6 characters)")
    name: Optional[str] = Field("User", description="User full name or display handle")


class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    name: str
    has_groq_key: bool


class UserProfileResponse(BaseModel):
    id: str
    email: str
    name: str
    has_groq_key: bool
    masked_key: Optional[str] = None


class SaveKeyRequest(BaseModel):
    groq_api_key: str = Field(..., min_length=10, description="Groq API key starting with gsk_")


class ValidateKeyRequest(BaseModel):
    groq_api_key: str = Field(..., min_length=10, description="Groq API key to test")


class ValidateKeyResponse(BaseModel):
    is_valid: bool
    message: str
    models_available: Optional[int] = None


class ValidateOpenRouterKeyRequest(BaseModel):
    openrouter_api_key: str = Field(..., min_length=10, description="OpenRouter API key to test")

