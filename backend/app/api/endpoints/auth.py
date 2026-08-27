from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.db.database import get_db
from app.db.models import User, UserRole, RefreshSession
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token_pair,
    hash_token
)
from app.core.config import settings
from app.core.rate_limiter import RateLimiter
from app.services.audit_service import AuditService
from app.api.deps import get_current_user, require_roles

router = APIRouter()

# Rate limiters for sensitive authentication endpoints
auth_rate_limiter = RateLimiter(times=10, seconds=60)
refresh_rate_limiter = RateLimiter(times=20, seconds=60)

class UserCreateSchema(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole = UserRole.FPO_MANAGER
    phone: Optional[str] = None
    location_name: Optional[str] = "Ludhiana, Punjab"
    latitude: Optional[float] = 30.9010
    longitude: Optional[float] = 75.8573

class TokenResponseSchema(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user_id: int
    email: str
    role: str
    full_name: str

class RefreshRequestSchema(BaseModel):
    refresh_token: str

class RefreshResponseSchema(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in_minutes: int

class UserProfileSchema(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    location_name: Optional[str] = None
    is_active: bool
    created_at: datetime

@router.post("/register", response_model=TokenResponseSchema)
def register_user(
    user_in: UserCreateSchema,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new user, issue short-lived JWT access token & secure refresh token."""
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email address already exists"
        )

    new_user = User(
        email=user_in.email.lower(),
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        phone=user_in.phone,
        location_name=user_in.location_name,
        latitude=user_in.latitude,
        longitude=user_in.longitude,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Issue access token & refresh token
    access_token = create_access_token(subject=new_user.id, role=new_user.role.value)
    raw_refresh_token, token_hash, expires_at = create_refresh_token_pair(new_user.id)

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    refresh_session = RefreshSession(
        user_id=new_user.id,
        token_hash=token_hash,
        is_revoked=False,
        expires_at=expires_at,
        ip_address=client_ip,
        user_agent=user_agent
    )
    db.add(refresh_session)
    db.commit()

    # Record tamper-evident audit event
    AuditService.record_event(
        db=db,
        event_type="AUTH_REGISTER",
        action="CREATE",
        resource_type="user",
        user_id=new_user.id,
        resource_id=str(new_user.id),
        details={"email": new_user.email, "role": new_user.role.value, "ip": client_ip}
    )

    return TokenResponseSchema(
        access_token=access_token,
        refresh_token=raw_refresh_token,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user_id=new_user.id,
        email=new_user.email,
        role=new_user.role.value if hasattr(new_user.role, 'value') else str(new_user.role),
        full_name=new_user.full_name
    )

@router.post("/token", response_model=TokenResponseSchema, dependencies=[Depends(auth_rate_limiter)])
def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Authenticate with username/password, issue short-lived access token + rotating refresh token."""
    user = db.query(User).filter(User.email == form_data.username.lower()).first()
    client_ip = request.client.host if request.client else None

    if not user or not verify_password(form_data.password, user.hashed_password):
        # Record security audit event for failed attempt
        AuditService.record_event(
            db=db,
            event_type="AUTH_LOGIN_FAILED",
            action="LOGIN_FAILURE",
            resource_type="auth",
            user_id=user.id if user else None,
            details={"attempted_email": form_data.username, "ip": client_ip}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been deactivated"
        )

    access_token = create_access_token(subject=user.id, role=user.role.value)
    raw_refresh_token, token_hash, expires_at = create_refresh_token_pair(user.id)
    user_agent = request.headers.get("User-Agent")

    refresh_session = RefreshSession(
        user_id=user.id,
        token_hash=token_hash,
        is_revoked=False,
        expires_at=expires_at,
        ip_address=client_ip,
        user_agent=user_agent
    )
    db.add(refresh_session)
    db.commit()

    # Record login audit event
    AuditService.record_event(
        db=db,
        event_type="AUTH_LOGIN_SUCCESS",
        action="LOGIN",
        resource_type="session",
        user_id=user.id,
        resource_id=str(refresh_session.id),
        details={"email": user.email, "role": user.role.value, "ip": client_ip}
    )

    return TokenResponseSchema(
        access_token=access_token,
        refresh_token=raw_refresh_token,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user_id=user.id,
        email=user.email,
        role=user.role.value if hasattr(user.role, 'value') else str(user.role),
        full_name=user.full_name
    )

@router.post("/refresh", response_model=RefreshResponseSchema, dependencies=[Depends(refresh_rate_limiter)])
def refresh_access_token(
    refresh_in: RefreshRequestSchema,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Refresh token rotation lifecycle.
    Verifies refresh token, detects replay attacks, revokes used session, and issues a new token pair.
    """
    token_hash = hash_token(refresh_in.refresh_token)
    session = db.query(RefreshSession).filter(RefreshSession.token_hash == token_hash).first()
    client_ip = request.client.host if request.client else None

    if not session:
        AuditService.record_event(
            db=db,
            event_type="AUTH_REFRESH_INVALID",
            action="REJECT",
            resource_type="session",
            details={"ip": client_ip, "reason": "Unknown refresh token"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Replay attack detection: If an already-revoked token is presented, revoke all sessions for this user
    if session.is_revoked:
        db.query(RefreshSession).filter(RefreshSession.user_id == session.user_id).update({"is_revoked": True})
        db.commit()
        
        AuditService.record_event(
            db=db,
            event_type="SECURITY_REPLAY_ATTACK_DETECTED",
            action="MASS_REVOKE",
            resource_type="user_sessions",
            user_id=session.user_id,
            details={"compromised_session_id": session.id, "ip": client_ip}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Security alert: Token reuse detected. All active sessions have been terminated. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    current_time = datetime.now(timezone.utc)
    session_expires = session.expires_at.replace(tzinfo=timezone.utc) if session.expires_at.tzinfo is None else session.expires_at
    if session_expires < current_time:
        session.is_revoked = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Revoke old session (Rotation)
    session.is_revoked = True

    # Issue new token pair
    user = db.query(User).filter(User.id == session.user_id).first()
    if not user or not user.is_active:
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account inactive or deleted",
        )

    new_access_token = create_access_token(subject=user.id, role=user.role.value)
    new_raw_refresh, new_hash, new_expires = create_refresh_token_pair(user.id)
    user_agent = request.headers.get("User-Agent")

    new_session = RefreshSession(
        user_id=user.id,
        token_hash=new_hash,
        is_revoked=False,
        expires_at=new_expires,
        ip_address=client_ip,
        user_agent=user_agent
    )
    db.add(new_session)
    db.commit()

    AuditService.record_event(
        db=db,
        event_type="AUTH_TOKEN_ROTATED",
        action="ROTATE",
        resource_type="session",
        user_id=user.id,
        resource_id=str(new_session.id),
        details={"old_session_id": session.id, "new_session_id": new_session.id, "ip": client_ip}
    )

    return RefreshResponseSchema(
        access_token=new_access_token,
        refresh_token=new_raw_refresh,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

@router.post("/logout")
def logout_user(
    refresh_in: RefreshRequestSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke refresh token and terminate session."""
    token_hash = hash_token(refresh_in.refresh_token)
    session = db.query(RefreshSession).filter(
        RefreshSession.token_hash == token_hash,
        RefreshSession.user_id == current_user.id
    ).first()

    if session:
        session.is_revoked = True
        db.commit()

    AuditService.record_event(
        db=db,
        event_type="AUTH_LOGOUT",
        action="REVOKE",
        resource_type="session",
        user_id=current_user.id,
        details={"email": current_user.email}
    )

    return {"status": "success", "message": "Successfully logged out and session revoked."}

@router.get("/me", response_model=UserProfileSchema)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Fetch current authenticated user profile."""
    return UserProfileSchema(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        phone=current_user.phone,
        location_name=current_user.location_name,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

@router.get("/audit/verify", dependencies=[Depends(require_roles([UserRole.MINISTRY_ADMIN, UserRole.GOVT_AUDITOR, UserRole.ADMIN]))])
def verify_audit_chain(db: Session = Depends(get_db)):
    """
    Verify tamper-evident hash-chained audit log integrity.
    Accessible only to authorized government auditors and administrators.
    """
    return AuditService.verify_chain_integrity(db)
