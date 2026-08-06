import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, UUID as SA_UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserSession(Base):
    """Persistent session record used to validate refresh tokens.

    Column names track the live Neon schema (refresh_token / is_revoked /
    last_used) — earlier versions of this model used `token` and
    `is_active`, but the refresh-token refactor in the auth service
    already writes to the new shape, and `init_db.create_all` is a
    no-op against the existing table, so we declare the columns the
    database actually has. If you ever drop and recreate this table,
    the model and schema will stay in sync because `create_all` will
    rebuild it from this declaration.
    """

    __tablename__ = "user_sessions"

    id = Column(SA_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(SA_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    refresh_token = Column(String(500), nullable=False, unique=True)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_used = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="sessions")
