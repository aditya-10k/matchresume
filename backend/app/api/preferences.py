import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import UserPreference, User
from app.api.deps import get_current_user

logger = logging.getLogger("preferences")
router = APIRouter(prefix="/preferences", tags=["User Preferences & Long-Term Memory"])


class PreferenceItem(BaseModel):
    key: str = Field(..., min_length=1, description="Preference key (e.g. one_page_limit, bullet_style)")
    value: str = Field(..., description="Preference value (e.g. true, concise, project_heavy)")


class PreferenceResponse(BaseModel):
    id: str
    key: str
    value: str
    updated_at: str


@router.get("", response_model=List[PreferenceResponse])
def list_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all stored user tailoring preferences and guidelines."""
    prefs = db.query(UserPreference).filter(
        UserPreference.user_id == current_user.id
    ).all()
    return [
        PreferenceResponse(
            id=p.id,
            key=p.key,
            value=p.value,
            updated_at=p.updated_at.isoformat() if p.updated_at else ""
        )
        for p in prefs
    ]


@router.post("", response_model=PreferenceResponse, status_code=status.HTTP_201_CREATED)
def set_preference(
    data: PreferenceItem,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create or update a persistent tailoring preference."""
    clean_key = data.key.strip().lower()
    pref = db.query(UserPreference).filter(
        UserPreference.user_id == current_user.id,
        UserPreference.key == clean_key
    ).first()

    if pref:
        pref.value = data.value.strip()
    else:
        pref = UserPreference(
            user_id=current_user.id,
            key=clean_key,
            value=data.value.strip()
        )
        db.add(pref)

    db.commit()
    db.refresh(pref)

    return PreferenceResponse(
        id=pref.id,
        key=pref.key,
        value=pref.value,
        updated_at=pref.updated_at.isoformat() if pref.updated_at else ""
    )


@router.delete("/{key}")
def delete_preference(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a tailoring preference."""
    clean_key = key.strip().lower()
    pref = db.query(UserPreference).filter(
        UserPreference.user_id == current_user.id,
        UserPreference.key == clean_key
    ).first()

    if not pref:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preference not found.")

    db.delete(pref)
    db.commit()
    return {"status": "deleted", "key": clean_key}
