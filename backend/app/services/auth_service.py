import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, UserSession
from app.schemas.auth import UserCreate, TokenResponse
from app.core.config import settings


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password


def create_access_token(user_id: uuid.UUID) -> str:
    token_data = f"{user_id}{datetime.utcnow()}{settings.SECRET_KEY}"
    return hashlib.sha256(token_data.encode()).hexdigest()


async def create_user(db: AsyncSession, user_data: UserCreate, created_by: Optional[uuid.UUID] = None) -> User:
    hashed_pw = hash_password(user_data.password)
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pw,
        full_name=user_data.full_name,
        role=user_data.role,
        created_by=created_by,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user and verify_password(password, user.hashed_password):
        user.last_login = datetime.utcnow()
        await db.commit()
        return user
    return None


async def create_session(db: AsyncSession, user_id: uuid.UUID, token: str) -> UserSession:
    session = UserSession(
        user_id=user_id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(days=7),
    )
    db.add(session)
    await db.commit()
    return session


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()
