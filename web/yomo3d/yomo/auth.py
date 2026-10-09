import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
from fastapi import Cookie, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session as DBSession
from .config import settings
from .db import session_dep
from .models import Session as UserSession, User

hasher = PasswordHasher()
DUMMY_HASH = hasher.hash("dummy-password")
COOKIE = "yomo_session"


def create_session(db: DBSession, user: User) -> tuple[str, UserSession]:
    raw = secrets.token_urlsafe(36)
    sess = UserSession(
        token_hash=hashlib.sha256(raw.encode()).hexdigest(),
        user_id=user.id,
        csrf_token=secrets.token_urlsafe(32),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.session_days),
    )
    db.add(sess)
    db.commit()
    return raw, sess


def find_session(db: DBSession, raw: str | None) -> UserSession | None:
    if not raw:
        return None
    sess = db.get(UserSession, hashlib.sha256(raw.encode()).hexdigest())
    if not sess:
        return None
    expiry = sess.expires_at.replace(tzinfo=timezone.utc) if sess.expires_at.tzinfo is None else sess.expires_at
    return sess if expiry > datetime.now(timezone.utc) else None


def require_session(
    db: Annotated[DBSession, Depends(session_dep)],
    yomo_session: Annotated[str | None, Cookie()] = None,
) -> UserSession:
    sess = find_session(db, yomo_session)
    if not sess:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentification requise")
    return sess


def require_csrf(
    sess: Annotated[UserSession, Depends(require_session)],
    x_csrf_token: Annotated[str | None, Header()] = None,
) -> UserSession:
    if not x_csrf_token or not hmac.compare_digest(sess.csrf_token, x_csrf_token):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Jeton CSRF absent ou invalide")
    return sess


def authenticate(db: DBSession, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user:
        # Make non-existent emails less distinguishable by timing.
        try:
            hasher.verify(DUMMY_HASH, password)
        except (VerifyMismatchError, VerificationError):
            pass
        return None
    try:
        return user if hasher.verify(user.password_hash, password) else None
    except (VerifyMismatchError, VerificationError):
        return None


def set_auth_cookie(response, token: str) -> None:
    response.set_cookie(COOKIE, token, httponly=True, secure=settings.env == "production", samesite="lax", max_age=settings.session_days * 86400, path="/")
