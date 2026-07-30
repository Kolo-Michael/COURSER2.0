from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime


class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = Field(default=None, max_length=100)
    role: Literal["student", "admin", "super_admin"] = "student"


class UserCreate(UserBase):
    # Password strength is enforced by auth_service via validation, plus
    # the frontend form. Server-side length floor of 8 chars here.
    password: str = Field(min_length=8, max_length=128)


class AdminCreate(BaseModel):
    """Body for POST /auth/admin (super-admin only)."""
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: Optional[str] = Field(default=None, max_length=100)
    role: Literal["admin", "super_admin"] = "admin"


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: UUID
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime]
    last_login: Optional[datetime]

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    """Body for legacy refresh flow when the cookie isn't available (rare).

    In the cookie flow, /auth/refresh reads from the HttpOnly cookie
    and the body is optional."""
    refresh_token: Optional[str] = None


class TokenResponse(BaseModel):
    """Auth response. Tokens are also set as HttpOnly cookies on the
    response, so the JSON is mainly informational for the frontend.

    `refresh_token` was missing from the previous version, which the
    frontend's `signup`/`login` handlers were silently reading as
    undefined."""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse
