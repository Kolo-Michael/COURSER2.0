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
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    decode_token,
    get_current_user_id,
    get_refresh_token,
    hash_password,
    verify_password,
)
from app.schemas.auth import (
    AdminCreate,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    ProfileUpdate,
    RefreshRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
    VerifyCodeRequest,
)
from app.services import auth_service

router = APIRouter()


# --- cookie helpers -------------------------------------------------------

def _cookie_secure() -> bool:
    """Treat http://localhost as non-secure in dev so cookies work there."""
    # Render / Vercel deployments are HTTPS-only so Secure is always on there.
    import os

    return os.getenv("APP_ENV", "production") != "development"


def _set_auth_cookies(response: Response, access: str, refresh: str, remember_me: bool = False) -> None:
    """Set the access + refresh tokens as HttpOnly cookies.

    `SameSite=None` with `Secure` allows cross-origin requests (needed when
    frontend and API are on different Vercel projects). Over plain HTTP
    (local dev) Chrome rejects `SameSite=None` cookies that lack `Secure`,
    so fall back to `SameSite=Lax` for same-site localhost traffic."""
    secure = _cookie_secure()
    samesite = "none" if secure else "lax"
    refresh_max_age = (
        settings.REMEMBER_ME_EXPIRE_DAYS * 24 * 60 * 60
        if remember_me
        else settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    response.set_cookie(
        key="access_token",
        value=access,
        httponly=True,
        secure=secure,
        samesite=samesite,
        path="/",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh,
        httponly=True,
        secure=secure,
        samesite=samesite,
        path="/",
        max_age=refresh_max_age,
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
        "avatarUrl": user.avatar_url,
        "navStyle": user.nav_style or "sidebar",
        "navCollapsed": bool(user.nav_collapsed),
    }
    # URL-encode the JSON payload. Starlette's cookie writer otherwise
    # octal-escapes special chars (\054 for ',') which breaks JSON.parse
    # in the browser's document.cookie and makes getSession() return null.
    value = quote(json.dumps(payload))
    secure = _cookie_secure()
    response.set_cookie(
        key="courser_session",
        value=value,
        httponly=False,  # JS reads this for routing decisions
        secure=secure,
        samesite="none" if secure else "lax",
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
forgot_limit = _InMemoryLimit(*_parse_spec("3/hour"))
verify_limit = _InMemoryLimit(*_parse_spec("10/minute"))
reset_limit = _InMemoryLimit(*_parse_spec("5/hour"))


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
forgot_dep = _rate_limit_dependency(forgot_limit)
verify_dep = _rate_limit_dependency(verify_limit)
reset_dep = _rate_limit_dependency(reset_limit)


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
    access, refresh, session_expires_at = await auth_service.issue_tokens(db, user)
    _set_auth_cookies(response, access, refresh)
    _set_session_cookie(response, user)
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        user=user,
        session_expires_at=session_expires_at,
    )


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

    access, refresh, session_expires_at = await auth_service.issue_tokens(
        db, user, remember_me=login_data.remember_me
    )
    _set_auth_cookies(response, access, refresh, remember_me=login_data.remember_me)
    _set_session_cookie(response, user)
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        user=user,
        session_expires_at=session_expires_at,
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    dependencies=[Depends(refresh_dep)],
)
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    payload: Optional[RefreshRequest] = None,
):
    """Exchange a refresh token for a new access + refresh pair.

    Web clients send the refresh token as an HttpOnly cookie; mobile
    clients can't read cookies, so they pass it in the JSON body
    (`{"refresh_token": "..."}`). Whichever is present is used.
    """
    cookie_token = get_refresh_token(request)
    body_token = payload.refresh_token if payload else None
    refresh = cookie_token or body_token
    if not refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token.",
        )

    rotated = await auth_service.rotate_refresh_token(db, refresh)
    if rotated is None:
        _clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token rejected.",
        )

    new_access, new_refresh, user, session_expires_at = rotated
    # Reuse the same lifetime for the cookies: remember-me sessions were
    # created with 30 days, default sessions with 7. Derive it from the
    # returned expiry so the cookie max-age matches the stored session.
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    remaining_days = (session_expires_at - now).days
    remember_me = remaining_days > settings.REFRESH_TOKEN_EXPIRE_DAYS
    _set_auth_cookies(response, new_access, new_refresh, remember_me=remember_me)
    _set_session_cookie(response, user)
    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        user=user,
        session_expires_at=session_expires_at,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Revoke the refresh-token session and clear cookies. Idempotent."""
    cookie_token = get_refresh_token(request)
    if cookie_token:
        await auth_service.revoke_session(db, cookie_token)
    _clear_auth_cookies(response)
    response.delete_cookie("courser_session", path="/")
    # Returning `response` (mutated) instead of a fresh `Response(...)`
    # preserves the Set-Cookie deletion headers that delete_cookie()
    # queued onto the injected response.
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


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


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    response: Response,
    payload: ProfileUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Self-service profile & settings update (name, avatar, nav prefs).

    Only the fields present in the body are changed. The `courser_session`
    cookie is refreshed so the header/sidebar immediately show the new
    display name.
    """
    user = await auth_service.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    _set_session_cookie(response, user)
    return user


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    payload: ChangePasswordRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Change the authenticated user's password (requires current password)."""
    user = await auth_service.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect.")

    user.hashed_password = hash_password(payload.new_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    await db.commit()
    return {"message": "Password updated successfully."}


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


# --- Password Reset Endpoints ----------------------------------------------


@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(forgot_dep)],
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Request a password reset code for the given email.
    
    Always returns success to prevent email enumeration.
    """
    await auth_service.request_password_reset(db, payload.email)
    return {"message": "If an account exists for that email, a reset code has been sent."}


@router.post(
    "/verify-code",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verify_dep)],
)
async def verify_code(
    payload: VerifyCodeRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify a password reset code.
    
    Returns success if code is valid, error with remaining attempts if not.
    After 3 failed attempts, the code is invalidated.
    """
    success, message = await auth_service.verify_reset_code(db, payload.email, payload.code)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    return {"message": message, "valid": True}


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(reset_dep)],
)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Reset the user's password using a verified code.
    """
    success, message = await auth_service.reset_password(db, payload.email, payload.code, payload.new_password)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    return {"message": message}
