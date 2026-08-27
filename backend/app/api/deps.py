from typing import Generator, Optional, List, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, UserRole
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/token",
    auto_error=False
)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Strict server-side JWT authentication dependency.
    Extracts and validates token claims: sub, exp, type == 'access'.
    Raises 401 Unauthorized for invalid/expired tokens or missing credentials.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: Optional[str] = payload.get("sub")
        token_type: Optional[str] = payload.get("type")
        
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing subject",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        if token_type and token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type: access token required",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user

def require_roles(allowed_roles: List[Union[UserRole, str]]):
    """
    Role-Based Access Control (RBAC) dependency factory.
    Enforces that current_user has one of the allowed roles.
    """
    normalized_allowed = set()
    for r in allowed_roles:
        val = r.value if isinstance(r, UserRole) else str(r)
        normalized_allowed.add(val)
        # Add legacy/synonym aliases
        if val in ("FPO", "FPO_MANAGER"):
            normalized_allowed.update(["FPO", "FPO_MANAGER"])
        if val in ("LOGISTICS", "TRANSPORTER"):
            normalized_allowed.update(["LOGISTICS", "TRANSPORTER"])
        if val in ("DOCA_OBSERVER", "MINISTRY_ADMIN", "GOVT_AUDITOR"):
            normalized_allowed.update(["DOCA_OBSERVER", "MINISTRY_ADMIN", "GOVT_AUDITOR"])

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        if user_role_val not in normalized_allowed and user_role_val != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{user_role_val}' is not authorized for this resource."
            )
        return current_user

    return role_checker
