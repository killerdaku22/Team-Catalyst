import hashlib
import secrets
import bcrypt
from datetime import datetime, timezone, timedelta
from typing import Optional, Union, Any, Tuple
from jose import jwt, JWTError
from app.core.config import settings

def hash_password(password: str) -> str:
    """Generate secure standard bcrypt password hash with per-user salt."""
    pwd_bytes = password.encode("utf-8")[:72]  # Truncate at 72 bytes per bcrypt standard
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash, with backward-compatibility for legacy SHA-256."""
    if not hashed_password or not plain_password:
        return False
    
    # 1. Standard bcrypt check
    if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
        try:
            plain_bytes = plain_password.encode("utf-8")[:72]
            hashed_bytes = hashed_password.encode("utf-8")
            return bcrypt.checkpw(plain_bytes, hashed_bytes)
        except Exception:
            return False

    # 2. Legacy SHA-256 check (64 hex chars)
    if len(hashed_password) == 64:
        legacy_salt = "sih26_salt_2026_"
        computed = hashlib.sha256((legacy_salt + plain_password).encode("utf-8")).hexdigest()
        return secrets.compare_digest(computed, hashed_password)

    return False

def hash_token(raw_token: str) -> str:
    """Compute SHA-256 hash of refresh token for secure server-side storage."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

def create_access_token(
    subject: Union[str, int, Any],
    role: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create short-lived JWT access token (15-minute default)."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    jti = secrets.token_hex(16)
    to_encode = {
        "sub": str(subject),
        "role": str(role) if role else "FPO_MANAGER",
        "type": "access",
        "jti": jti,
        "exp": expire,
        "iat": now
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token_pair(user_id: Union[str, int]) -> Tuple[str, str, datetime]:
    """
    Generate a cryptographically random refresh token.
    Returns: (raw_token, token_hash, expires_at)
    """
    raw_token = secrets.token_urlsafe(48)
    token_hash = hash_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return raw_token, token_hash, expires_at
