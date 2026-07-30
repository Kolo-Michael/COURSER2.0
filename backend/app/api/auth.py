"""Auth endpoints: register, signup/login (token-issuing),
cookie-based refresh, logout, /me, and super-admin-only admin creation.

Differences from the previous version:

  * Tokens are set as HttpOnly+SameSite=Lax cookies; the JSON body is
    informational. Frontend never reads the tokens.
  * /auth/me now uses a real dependency (`get_current_user_id`) instead
    of accepting `user_id` in the body, which let anyone fetch any user.
  * /auth/signup and /auth/login return generic error messages so attackers
    can't enumerate emails.
  * /auth/login is rate-limited (`5/minute`) and `/auth/signup` (`3/hour`).
  * Account lockout after 5 failed logins (15 min) — see auth_service.
  * POST /auth/admin — super-admins create new admin/super_admin users.
"""

from __future__ import annotations

import collections
import json
import time
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    decode_token,
    get_current_user_id,
    get_refresh_token,
)
from app.schemas.auth import (
    AdminCreate,
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
)
from app.services import auth_service

router = APIRouter()


# --- cookie helpers -------------------------------------------------------

def _cookie_secure() -> bool:
    """Treat http://localhost as non-secure in dev so cookies work there."""
    # Render / Vercel deployments are HTTPS-only so Secure is always on there.
    import os

    return os.getenv("APP_ENV", "production") != "development"


def _set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    """Set the access + refresh tokens as HttpOnly cookies.

    `SameSite=Lax` allows the cookie on top-level navigations (so navigating
    to a course detail from a link keeps you logged in) but blocks it from
    cross-site POSTs (CSRF defense)."""
    secure = _cookie_secure()
    response.set_cookie(
        key="access_token",
        value=access,
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh,
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


def _set_session_cookie(response: Response, user) -> None:
    """Set a non-HttpOnly cookie so the SPA knows who the user is.

    The access/refresh tokens remain HttpOnly. This cookie lets the
    frontend's `getSession()` show the right header / route guards
    without needing to call /auth/me on every page load."""
    payload = {
        "identifier": user.full_name or user.username,
        "email": user.email,
        "fullName": user.full_name,
        "role": user.role,
        "id": str(user.id),
    }
    secure = _cookie_secure()
    response.set_cookie(
        key="courser_session",
        value=json.dumps(payload),
        httponly=False,  # JS reads this for routing decisions
        secure=secure,
        samesite="lax",
        path="/",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# --- rate-limited routes --------------------------------------------------

from slowapi import Limiter
from slowapi.util import get_remote_address

# slowapi's global default 200/minute limit is wired via SlowAPIMiddleware
# in `main.py`. Per-route limits on auth endpoints are enforced by a
# tiny in-memory sliding-window limiter below — slowapi's `@limiter.limit`
# decorator breaks Pydantic body-param resolution in FastAPI, and calling
# `limiter._check_request_limit(...)` directly expects a Werkzeug request
# (not a Starlette `Request`). A custom dependency gives us 429s with the
# right shape without those issues.
limiter = Limiter(key_func=get_remote_address)


class _InMemoryLimit:
    """Sliding-window in-memory rate limit.

    Single-process / single-worker only. uvicorn on Render, Fly, or a
    laptop matches that exactly. Counts reset when the window passes.
    """

    def __init__(self, max_calls: int, window_seconds: int) -> None:
        self.max_calls = max_calls
        self.window_seconds = window_seconds
        self._hits: dict[str, collections.deque[float]] = {}

    def check(self, key: str) -> tuple[bool, int]:
        now = time.monotonic()
        cutoff = now - self.window_seconds
        bucket = self._hits.setdefault(key, collections.deque())
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= self.max_calls:
            retry_after = max(1, int(self.window_seconds - (now - bucket[0])))
            return False, retry_after
        bucket.append(now)
        return True, 0


def _parse_spec(spec: str) -> tuple[int, int]:
    """Parse `5/minute` → (5, 60), `3/hour` → (3, 3600)."""
    n, _, unit = spec.partition("/")
    count = int(n)
    seconds = {
        "second": 1,
        "minute": 60,
        "hour": 3600,
        "day": 86400,
    }.get(unit.rstrip("s"), 60)
    return count, seconds


signup_limit = _InMemoryLimit(*_parse_spec("3/hour"))
login_limit = _InMemoryLimit(*_parse_spec("5/minute"))
refresh_limit = _InMemoryLimit(*_parse_spec("30/minute"))
admin_limit = _InMemoryLimit(*_parse_spec("20/hour"))


def _rate_limit_dependency(limit: _InMemoryLimit):
    """Return a FastAPI dependency enforcing `limit` against the client IP."""

    async def _enforce(request: Request) -> None:
        ip = get_remote_address(request)
        ok, retry_after = limit.check(ip)
        if not ok:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many requests. Retry in {retry_after}s.",
                headers={"Retry-After": str(retry_after)},
            )

    return _enforce


signup_dep = _rate_limit_dependency(signup_limit)
login_dep = _rate_limit_dependency(login_limit)
refresh_dep = _rate_limit_dependency(refresh_limit)
admin_dep = _rate_limit_dependency(admin_limit)


# --- endpoints ------------------------------------------------------------


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Legacy alias — same as POST /auth/signup but returns only the user.

    New clients should call `/auth/signup` which also issues tokens and
    sets cookies."""
    existing = await auth_service.get_user_by_email(db, user_data.email)
    if existing:
        # Generic error — don't leak that the email is taken.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="We couldn't create your account with those details.",
        )
    return await auth_service.create_user(db, user_data)


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(signup_dep)],
)
async def signup(
    response: Response,
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user, issue tokens, set cookies."""
    existing = await auth_service.get_user_by_email(db, user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="We couldn't create your account with those details.",
        )
    user = await auth_service.create_user(db, user_data)
    access, refresh = await auth_service.issue_tokens(db, user)
    _set_auth_cookies(response, access, refresh)
    _set_session_cookie(response, user)
    return TokenResponse(access_token=access, refresh_token=refresh, user=user)


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(login_dep)],
)
async def login(
    response: Response,
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate with email + password. Returns tokens AND sets cookies."""
    user = await auth_service.authenticate_user(db, login_data.email, login_data.password)
    if user is None:
        # Same shape as signup's "couldn't create" so the frontend can use
        # one error display path.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    access, refresh = await auth_service.issue_tokens(db, user)
    _set_auth_cookies(response, access, refresh)
    _set_session_cookie(response, user)
    return TokenResponse(access_token=access, refresh_token=refresh, user=user)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    dependencies=[Depends(refresh_dep)],
)
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Exchange a refresh-token cookie for a new access + refresh pair.

    The cookie-based flow is the primary path; the body is ignored."""
    cookie_token = get_refresh_token(request)
    if not cookie_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token.",
        )

    rotated = await auth_service.rotate_refresh_token(db, cookie_token)
    if rotated is None:
        _clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token rejected.",
        )

    new_access, new_refresh, user = rotated
    _set_auth_cookies(response, new_access, new_refresh)
    _set_session_cookie(response, user)
    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        user=user,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Revoke the refresh-token session and clear cookies. Idempotent."""
    cookie_token = get_refresh_token(request)
    if cookie_token:
        await auth_service.revoke_session(db, cookie_token)
    _clear_auth_cookies(response)
    response.delete_cookie("courser_session", path="/")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Return the authenticated user (resolved from the access token)."""
    user = await auth_service.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user


@router.post(
    "/admin",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(admin_dep)],
)
async def create_admin(
    payload: AdminCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Super-admin only — create a new admin or super-admin account.

    The current user's role is fetched from the DB rather than the JWT
    claim so that demotions take effect immediately. Returns the new user."""
    caller = await auth_service.get_user_by_id(db, user_id)
    if caller is None or caller.role != "super_admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")

    existing = await auth_service.get_user_by_email(db, payload.email)
    if existing:
        # Same generic error pattern as signup; doesn't leak existence.
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "We couldn't create this admin account with those details.",
        )

    new_user = await auth_service.create_user(
        db,
        UserCreate(
            username=payload.username,
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
            role=payload.role,
        ),
        created_by=caller.id,
    )
    return new_user
