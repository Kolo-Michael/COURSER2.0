"""User persistence, authentication, and session bookkeeping.

Hashing and token issuance live in `app.core.security` — this module
orchestrates them with the database.

The previous version used raw SHA-256 for passwords and issued opaque
SHA-256 access tokens. Both are gone; passwords now use bcrypt and tokens
are signed JWTs (see `app.core.security`).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models import User, UserSession, PasswordResetToken
from app.schemas.auth import UserCreate
from app.services.email_service import generate_reset_code, send_password_reset_email


def _utcnow_naive() -> datetime:
    """Naive UTC "now", safe to compare against naive DateTime columns.

    Postgres stores our `timestamp` columns without time zone; asyncpg /
    SQLAlchemy sometimes returns them with tzinfo=UTC on the Vercel
    runtime. Comparing those against `datetime.utcnow()` (naive) raises
    `TypeError: can't compare offset-naive and offset-aware datetimes`,
    which surfaces as a 500 on `/api/auth/refresh`. Returning a naive UTC
    `datetime` for every comparison (and for values being written to
    naive columns) avoids that mismatch."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def create_user(
    db: AsyncSession,
    user_data: UserCreate,
    created_by: Optional[uuid.UUID] = None,
) -> User:
    """Create a new user with a bcrypt-hashed password."""
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        created_by=created_by,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> Optional[User]:
    """Authenticate by (email, password). Returns the user on success, None
    otherwise. Implements brute-force lockout: after MAX_FAILED_LOGINS
    consecutive wrong passwords the account is locked for LOCKOUT_DURATION.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        # Constant-time-ish: still run bcrypt against a dummy hash so a
        # timing side-channel can't enumerate which emails exist.
        verify_password(password, "$2b$12$" + "x" * 53)
        return None

    now = _utcnow_naive()

    # Lockout check — short-circuits before bcrypt even runs.
    if user.locked_until and user.locked_until > now:
        return None

    if not verify_password(password, user.hashed_password):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= settings.MAX_FAILED_LOGINS:
            user.locked_until = now + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
            user.failed_login_attempts = 0
        await db.commit()
        return None

    # Success: reset counter and stamp last_login.
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = now
    await db.commit()
    return user


async def issue_tokens(
    db: AsyncSession,
    user: User,
    remember_me: bool = False,
) -> tuple[str, str, datetime]:
    """Issue both tokens and persist the refresh token session row.

    Returns (access_token, refresh_token, session_expires_at). The caller
    is responsible for placing the tokens in Set-Cookie headers — see
    `api.auth._set_auth_cookies`.

    When `remember_me` is True the refresh token (and its session row)
    is minted for `REMEMBER_ME_EXPIRE_DAYS` so the mobile client can keep
    the user signed in for up to 30 days without re-authenticating.
    """
    access_token = create_access_token(user.id, user.role)
    expire_days = (
        settings.REMEMBER_ME_EXPIRE_DAYS if remember_me else settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    refresh_token = create_refresh_token(user.id, user.role, expire_days=expire_days)

    now = _utcnow_naive()
    session_expires_at = now + timedelta(days=expire_days)
    session = UserSession(
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=session_expires_at,
        is_revoked=False,
        created_at=now,
        last_used=now,
    )
    db.add(session)
    await db.commit()
    return access_token, refresh_token, session_expires_at


async def rotate_refresh_token(
    db: AsyncSession,
    old_refresh_token: str,
) -> Optional[tuple[str, str, User, datetime]]:
    """Validate a refresh token, revoke it, and issue a fresh pair.

    Used by `/auth/refresh`. Returns
    (new_access, new_refresh, user, session_expires_at) on success, or
    None if the token is missing/revoked/expired.

    The new session keeps the same lifetime as the old one, so a
    "remember me" session (30 days) stays 30 days across rotations
    instead of snapping back to the default 7.
    """
    from app.core.security import decode_token

    try:
        payload = decode_token(old_refresh_token, expected_type="refresh")
    except Exception:
        return None

    result = await db.execute(
        select(UserSession).where(
            UserSession.refresh_token == old_refresh_token,
            UserSession.is_revoked == False,  # noqa: E712
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        return None

    now = _utcnow_naive()
    if session.expires_at <= now:
        return None

    # Inactivity gate: a session that hasn't been touched (rotated / used)
    # within INACTIVITY_TIMEOUT_MINUTES is treated as expired. This makes
    # authentication inactivity-based on top of the fixed expiry.
    if now - session.last_used > timedelta(minutes=settings.INACTIVITY_TIMEOUT_MINUTES):
        return None

    user_result = await db.execute(select(User).where(User.id == session.user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        return None

    # Preserve the original lifetime (e.g. 30d for remember-me, 7d default).
    lifetime = session.expires_at - session.created_at
    if lifetime <= timedelta(0):
        lifetime = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    new_expires_at = now + lifetime

    # Rotate: revoke the old row, mint a fresh one.
    session.is_revoked = True
    session.last_used = now

    new_access = create_access_token(user.id, user.role)
    new_refresh = create_refresh_token(user.id, user.role, expire_days=lifetime.days)
    db.add(
        UserSession(
            user_id=user.id,
            refresh_token=new_refresh,
            expires_at=new_expires_at,
            is_revoked=False,
            created_at=now,
            last_used=now,
        )
    )
    await db.commit()
    return new_access, new_refresh, user, new_expires_at


async def revoke_session(db: AsyncSession, refresh_token: str) -> bool:
    """Mark a refresh-token session row revoked. Idempotent."""
    result = await db.execute(
        select(UserSession).where(UserSession.refresh_token == refresh_token)
    )
    session = result.scalar_one_or_none()
    if session is None:
        return False
    session.is_revoked = True
    await db.commit()
    return True


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_session_by_token(db: AsyncSession, refresh_token: str) -> Optional[UserSession]:
    result = await db.execute(
        select(UserSession).where(
            UserSession.refresh_token == refresh_token,
            UserSession.is_revoked == False,  # noqa: E712 — SQLAlchemy needs the IS FALSE comparison
            UserSession.expires_at > _utcnow_naive(),
        )
    )
    return result.scalar_one_or_none()


# --- Password Reset Methods -------------------------------------------------


async def request_password_reset(db: AsyncSession, email: str) -> bool:
    """
    Request a password reset for the given email.
    
    Always returns True to prevent email enumeration.
    If user exists, generates a code and sends it via email.
    """
    user = await get_user_by_email(db, email)
    if user is None:
        # Don't reveal whether the email exists
        return True

    # Delete any existing reset tokens for this user
    await db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id))

    # Generate new code
    code = generate_reset_code()
    expires_at = _utcnow_naive() + timedelta(minutes=15)

    reset_token = PasswordResetToken(
        user_id=user.id,
        code=code,
        attempts=0,
        expires_at=expires_at,
    )
    db.add(reset_token)
    await db.commit()

    # Send email (async, don't wait)
    await send_password_reset_email(email, code)
    return True


async def verify_reset_code(db: AsyncSession, email: str, code: str) -> tuple[bool, str]:
    """
    Verify a password reset code.
    
    Returns (success, message).
    After 3 failed attempts, the token is deleted and user must request a new one.
    """
    user = await get_user_by_email(db, email)
    if user is None:
        return False, "Invalid code."

    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.expires_at > _utcnow_naive(),
        )
    )
    reset_token = result.scalar_one_or_none()

    if reset_token is None:
        return False, "Code expired or not found. Please request a new one."

    if reset_token.code != code:
        reset_token.attempts += 1
        await db.commit()
        
        if reset_token.attempts >= 3:
            await db.delete(reset_token)
            await db.commit()
            return False, "Too many failed attempts. Please request a new code."
        
        return False, f"Invalid code. {3 - reset_token.attempts} attempts remaining."

    # Code is valid
    return True, "Code verified successfully."


async def reset_password(db: AsyncSession, email: str, code: str, new_password: str) -> tuple[bool, str]:
    """
    Reset the user's password using a verified code.
    
    Returns (success, message).
    """
    user = await get_user_by_email(db, email)
    if user is None:
        return False, "Invalid request."

    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.expires_at > _utcnow_naive(),
        )
    )
    reset_token = result.scalar_one_or_none()

    if reset_token is None:
        return False, "Code expired or not found. Please request a new one."

    if reset_token.code != code:
        return False, "Invalid code."

    # Update password
    user.hashed_password = hash_password(new_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    
    # Delete the used reset token
    await db.delete(reset_token)
    await db.commit()
    
    return True, "Password reset successfully."
