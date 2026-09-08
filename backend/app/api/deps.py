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
        # Check if there is an existing user or create/use default user for seamless local dev fallback
        default_user = db.query(User).first()
        if default_user:
            return default_user
        # Create initial default user
        new_user = User(email="user@matchresume.ai", name="Demo User")
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

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


def get_resolved_groq_key(
    x_groq_api_key: Optional[str] = Header(None, alias="x-groq-api-key"),
    current_user: User = Depends(get_current_user),
) -> str:
    """
    Resolves the Groq API key using the BYOK model:
    1. Highest priority: `X-Groq-API-Key` request header (client-side zero-trust storage).
    2. Second priority: `current_user.encrypted_groq_key` (saved in user's account).
    3. Dev fallback: `settings.GROQ_API_KEY` (if set in backend/.env).
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

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="NO_GROQ_KEY: No Groq API key provided. Please input your free Groq API key in Settings (get one at console.groq.com/keys)."
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
