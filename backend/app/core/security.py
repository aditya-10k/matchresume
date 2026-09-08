import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from cryptography.fernet import Fernet
from app.config import settings


def hash_password(password: str) -> str:
    """Hashes a plaintext password using bcrypt."""
    # Truncate to 72 bytes as per bcrypt spec
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against its bcrypt hash."""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT access token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def get_fernet_cipher() -> Fernet:
    """Returns a Fernet cipher initialized with the encryption key."""
    # Ensure key is valid Fernet 32-byte urlsafe base64
    key = settings.ENCRYPTION_KEY.encode("utf-8")
    return Fernet(key)


def encrypt_string(plain_text: str) -> str:
    """Encrypts a string (e.g. Groq API key) at rest."""
    if not plain_text:
        return ""
    cipher = get_fernet_cipher()
    return cipher.encrypt(plain_text.encode("utf-8")).decode("utf-8")


def decrypt_string(cipher_text: str) -> str:
    """Decrypts an encrypted string."""
    if not cipher_text:
        return ""
    try:
        cipher = get_fernet_cipher()
        return cipher.decrypt(cipher_text.encode("utf-8")).decode("utf-8")
    except Exception:
        return ""
