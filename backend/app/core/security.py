"""Password hashing, JWT issue/decode, and current-user dependency.

The previous version of the auth service hashed passwords with raw SHA-256
(`hashlib.sha256(password.encode()).hexdigest()`) and issued opaque access
tokens that were a SHA-256 of `user_id + utcnow + SECRET_KEY`. That meant:

  * Passwords were stored unsalted — rainbow tables and GPU brute force both
    trivially succeed.
  * Tokens had no expiry, no signature, no claims — anyone with the URL
    could read `/auth/me` by passing `user_id` in the body.

This module replaces both with bcrypt (salted, slow hash) and signed JWTs
(PyJWT, HS256) carrying `sub`, `role`, `iat`, and `exp`.

Tokens are stored in HttpOnly cookies set by the auth router so XSS on the
frontend can no longer leak them.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, Request, status
from passlib.context import CryptContext

from app.core.config import settings


# passlib's bcrypt context — auto-handles salt generation. The cost factor
# is read from settings so we can tune in production without a code change.
_pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=settings.BCRYPT_ROUNDS,
)


def hash_password(plain: str) -> str:
    """Return the bcrypt hash of a plaintext password."""
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Constant-time bcrypt comparison. Returns False for malformed hashes."""
    try:
        return _pwd_context.verify(plain, hashed)
    except (ValueError, TypeError):
        return False


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _encode(payload: dict[str, Any]) -> str:
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(user_id: UUID, role: str) -> str:
    """Short-lived signed access token. Carries `sub` (UUID), `role` and a
    unique `jti`.

    The access token is the credential the frontend never sees — the
    backend sets it as an HttpOnly cookie at login/signup and reads it
    from there on subsequent requests.

    The `jti` (JWT ID) guarantees uniqueness even when two tokens are
    minted within the same second — without it, PyJWT truncates `iat`/
    `exp` to whole-second UNIX timestamps and two tokens for the same
    user are byte-identical, which breaks refresh-token rotation (the
    rotated token would violate the `refresh_token` UNIQUE constraint).
    """
    now = _now()
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access",
        "jti": str(uuid.uuid4()),
    }
    return _encode(payload)


def create_refresh_token(user_id: UUID, role: str, expire_days: int | None = None) -> str:
    """Long-lived refresh token. Persisted by the auth service in
    `user_sessions` so logout can revoke it.

    `expire_days` defaults to `settings.REFRESH_TOKEN_EXPIRE_DAYS`; pass
    `settings.REMEMBER_ME_EXPIRE_DAYS` when the user opted into a longer
    mobile session."""
    if expire_days is None:
        expire_days = settings.REFRESH_TOKEN_EXPIRE_DAYS
    now = _now()
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": now + timedelta(days=expire_days),
        "type": "refresh",
        "jti": str(uuid.uuid4()),
    }
    return _encode(payload)


def decode_token(token: str, expected_type: str) -> dict[str, Any]:
    """Decode + verify a JWT. Raises `HTTPException(401)` on any failure.

    The expected `type` is checked so a leaked refresh token cannot be
    used as an access token (and vice versa).
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")

    if payload.get("type") != expected_type:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong token type")

    return payload


def get_access_token(request: Request) -> str | None:
    """Read the access token from the Authorization header (Bearer) or the
    HttpOnly cookie set on login.

    The web frontend relies on cookies; the mobile Flutter client sends a
    Bearer token in the Authorization header. Checking both makes
    authentication work for web and mobile clients alike."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[len("Bearer "):].strip()
        if token:
            return token
    return request.cookies.get("access_token")


def get_refresh_token(request: Request) -> str | None:
    return request.cookies.get("refresh_token")


async def get_current_user_id(
    request: Request,
) -> UUID:
    """FastAPI dependency that returns the authenticated user's UUID, or 401.

    Used as `Depends(get_current_user_id)` on every endpoint that needs an
    authenticated principal (mutating course endpoints, /auth/me,
    /auth/admin, enroll, ask).
    """
    token = get_access_token(request)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    payload = decode_token(token, expected_type="access")
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token has no subject")

    try:
        return UUID(sub)
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token subject is not a UUID")


async def get_current_user_role(user_id: UUID = Depends(get_current_user_id)) -> str:
    """Convenience dependency when you need the role claim, not the user."""
    # Lazy import to avoid circular dep (auth_service imports from core).
    from app.services.auth_service import get_user_by_id

    # We can't easily run async DB queries from a non-async dependency; the
    # caller already has the user_id, so they can look up the user
    # themselves. Provide a thin async wrapper here that re-decodes the
    # token to avoid an extra DB hit. The token's `role` claim is signed
    # so we trust it.
    # The decorator wires to `get_current_user_id` which yields the UUID;
    # we re-read role from the cookie via decode_token to keep this sync.
    # Simpler: route handlers that need both should look up the user.
    raise NotImplementedError("Use get_current_user_id and fetch the user from the DB.")


def require_role(user_role: str, allowed: list[str]) -> None:
    """Helper that raises 403 if the user's role isn't in `allowed`.

    Route handlers call this themselves after fetching the user, since
    the role claim in the token and the role in the DB could drift if
    a super-admin demotes someone.
    """
    if user_role not in allowed:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")


# Re-export so callers can `from app.core.security import uuid`.
__all__ = [
    "uuid",
    "hash_password",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "get_access_token",
    "get_refresh_token",
    "get_current_user_id",
    "require_role",
]
