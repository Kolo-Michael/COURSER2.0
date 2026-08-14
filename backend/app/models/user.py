"""User + password-reset models.

`User` carries identity, role, auth-failure bookkeeping (for lockout), and
account settings the web Settings page writes (`avatar_url`, nav prefs).
`PasswordResetToken` stores the 6-digit codes emailed during reset flows.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Integer, UUID as SA_UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    """A COURSER account. Role is student / admin / super_admin."""

    __tablename__ = "users"

    id = Column(SA_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(20), nullable=False, default="student")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    # Who created this account (super-admins creating admin accounts).
    created_by = Column(SA_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    # Brute-force defense: after MAX_FAILED_LOGINS consecutive bad
    # passwords the account is locked until `locked_until`. The auth
    # service resets `failed_login_attempts` on a successful login.
    failed_login_attempts = Column(Integer, nullable=False, default=0)
    locked_until = Column(DateTime, nullable=True)

    # Account settings (web Settings page).
    # `avatar_url` stores a data URL (base64 image) or hosted URL.
    # `nav_style` picks the workspace navigation: 'sidebar' or 'floating'.
    # `nav_collapsed` remembers whether the sidebar was collapsed.
    avatar_url = Column(Text, nullable=True)
    nav_style = Column(String(20), nullable=False, default="sidebar")
    nav_collapsed = Column(Boolean, nullable=False, default=False)

    # Self-referential FK: an admin who created this account, and the users
    # this account created, so we can trace the admin tree.
    creator = relationship("User", remote_side=[id], back_populates="created_users")
    created_users = relationship("User", back_populates="creator")
    courses = relationship("Course", back_populates="instructor")
    enrollments = relationship("Enrollment", back_populates="user")
    sessions = relationship("UserSession", back_populates="user")
    conversations = relationship("Conversation", back_populates="user")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user")
    learning_days = relationship("LearningDay", back_populates="user")


class PasswordResetToken(Base):
    """A 6-digit reset code (with attempt counter) tied to one user.

    `attempts` lets the API invalidate the code after too many wrong
    guesses; `expires_at` bounds the code's lifetime to 15 minutes.
    """

    __tablename__ = "password_reset_tokens"

    id = Column(SA_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(SA_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    code = Column(String(6), nullable=False)
    attempts = Column(Integer, nullable=False, default=0)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="password_reset_tokens")
