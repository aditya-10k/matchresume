import logging
from typing import Optional
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User
from app.core.security import decode_access_token, decrypt_string
from app.config import settings

logger = logging.getLogger("deps")
security = HTTPBearer(auto_error=False)


def get_current_user(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Extracts and validates the current authenticated user from the Bearer JWT token."""
    if not auth_header or not auth_header.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in to access your account.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_optional_user(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Extracts the authenticated user if a valid Bearer token is provided; returns None otherwise."""
    if not auth_header or not auth_header.credentials:
        return None
    try:
        token = auth_header.credentials
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            return None
        user_id = payload["sub"]
        return db.query(User).filter(User.id == user_id, User.is_active == True).first()
    except Exception:
        return None


def get_resolved_groq_key(
    x_groq_api_key: Optional[str] = Header(None, alias="x-groq-api-key"),
    x_openrouter_api_key: Optional[str] = Header(None, alias="x-openrouter-api-key"),
    current_user: User = Depends(get_current_user),
) -> str:
    """
    Resolves the LLM API key using the BYOK model:
    1. Highest priority: `X-Groq-API-Key` request header (client-side zero-trust storage).
    2. Second priority: `current_user.encrypted_groq_key` (saved in user's account).
    3. Dev fallback: `settings.GROQ_API_KEY` (if set in backend/.env).
    4. If no Groq key but OpenRouter key is provided via header or settings, returns empty string so GroqClient routes to OpenRouter.
    If none found, raises HTTP 400 prompting the user to enter their key.
    """
    # 1. Header
    if x_groq_api_key and x_groq_api_key.strip():
        key = x_groq_api_key.strip()
        if key.startswith("gsk_") or len(key) >= 20:
            return key

    # 2. User account encrypted key
    if current_user and current_user.encrypted_groq_key:
        decrypted = decrypt_string(current_user.encrypted_groq_key)
        if decrypted and decrypted.strip():
            return decrypted.strip()

    # 3. Environment fallback (dev only)
    if settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip() and settings.GROQ_API_KEY != "your-groq-api-key-here":
        return settings.GROQ_API_KEY.strip()

    # 4. OpenRouter alternative fallback
    if x_openrouter_api_key and x_openrouter_api_key.strip():
        return ""
    if settings.OPENROUTER_API_KEY and settings.OPENROUTER_API_KEY.strip():
        return ""

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="NO_API_KEY: No LLM API key provided. Please configure your Groq or OpenRouter API key in Settings."
    )


def get_resolved_groq_model(
    x_groq_model: Optional[str] = Header(None, alias="x-groq-model"),
) -> str:
    """
    Resolves the Groq model:
    1. Client requested model via `x-groq-model` header.
    2. Fallback to settings.GROQ_MODEL.
    """
    if x_groq_model and x_groq_model.strip():
        return x_groq_model.strip()
    return settings.GROQ_MODEL


def get_optional_groq_key(
    x_groq_api_key: Optional[str] = Header(None, alias="x-groq-api-key"),
    current_user: User = Depends(get_current_user),
) -> Optional[str]:
    """Resolves the Groq key if present, otherwise returns None without raising an error."""
    try:
        return get_resolved_groq_key(x_groq_api_key=x_groq_api_key, current_user=current_user)
    except HTTPException:
        return None
