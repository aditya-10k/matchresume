import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from groq import Groq

from app.db.session import get_db
from app.db.models import User
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserProfileResponse,
    SaveKeyRequest,
    ValidateKeyRequest,
    ValidateKeyResponse,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    encrypt_string,
    decrypt_string,
)
from app.api.deps import get_current_user

logger = logging.getLogger("auth")
router = APIRouter(prefix="/auth", tags=["Authentication & BYOK"])


def mask_key(key: str) -> str:
    """Masks an API key for safe display (e.g. gsk_abc...xyz)."""
    if not key or len(key) < 10:
        return ""
    return f"{key[:7]}...{key[-4:]}"


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account with email and password."""
    existing_user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing_user and existing_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in."
        )

    # If an anonymous default user existed with this email, claim it, otherwise create new
    if existing_user:
        user = existing_user
        user.name = data.name or user.name
        user.hashed_password = hash_password(data.password)
    else:
        user = User(
            email=data.email.lower().strip(),
            name=data.name or "User",
            hashed_password=hash_password(data.password)
        )
        db.add(user)

    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email})
    has_key = bool(user.encrypted_groq_key)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        name=user.name,
        has_groq_key=has_key
    )


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password to receive a JWT access token."""
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user or not user.hashed_password or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    token = create_access_token({"sub": user.id, "email": user.email})
    has_key = bool(user.encrypted_groq_key)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        name=user.name,
        has_groq_key=has_key
    )


@router.get("/me", response_model=UserProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """Retrieve the current user profile and BYOK status."""
    has_key = bool(current_user.encrypted_groq_key)
    masked = None
    if has_key:
        plain_key = decrypt_string(current_user.encrypted_groq_key)
        masked = mask_key(plain_key)

    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email or "",
        name=current_user.name,
        has_groq_key=has_key,
        masked_key=masked
    )


@router.post("/key")
def save_groq_key(
    data: SaveKeyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Encrypt and save the user's BYOK Groq API key in their account."""
    clean_key = data.groq_api_key.strip()
    if not clean_key.startswith("gsk_") and len(clean_key) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid key format. Groq API keys typically start with 'gsk_'."
        )

    # Validate key against Groq API before saving
    try:
        test_client = Groq(api_key=clean_key)
        models = test_client.models.list()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Groq API key verification failed: {str(e)}"
        )

    current_user.encrypted_groq_key = encrypt_string(clean_key)
    db.commit()
    db.refresh(current_user)

    return {
        "status": "saved",
        "masked_key": mask_key(clean_key),
        "message": "Groq API key encrypted and saved successfully."
    }


@router.delete("/key")
def delete_groq_key(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete the user's stored encrypted Groq API key."""
    current_user.encrypted_groq_key = None
    db.commit()
    return {"status": "deleted", "message": "Stored Groq API key removed."}


@router.post("/validate-key", response_model=ValidateKeyResponse)
def validate_groq_key(data: ValidateKeyRequest):
    """Test a candidate Groq API key directly against Groq API to verify validity."""
    clean_key = data.groq_api_key.strip()
    try:
        test_client = Groq(api_key=clean_key)
        model_list = test_client.models.list()
        count = len(model_list.data) if hasattr(model_list, "data") else 0
        return ValidateKeyResponse(
            is_valid=True,
            message="Groq API key is valid and connected.",
            models_available=count
        )
    except Exception as e:
        return ValidateKeyResponse(
            is_valid=False,
            message=f"Key rejected by Groq: {str(e)}"
        )
