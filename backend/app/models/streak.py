import uuid
from datetime import datetime
from sqlalchemy import Column, Date, DateTime, ForeignKey, Boolean, UUID as SA_UUID, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class LearningDay(Base):
    """One row per (user, calendar day) where the student learned.

    `is_restored` marks a day that was back-filled with a streak restore
    (the student skipped the day but spent one of their monthly restores
    to keep the streak alive). `restored_at` drives the "4 restores per
    month" counter.
    """

    __tablename__ = "learning_days"
    __table_args__ = (UniqueConstraint("user_id", "day", name="uq_user_learning_day"),)

    id = Column(SA_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(SA_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    # Calendar date (UTC) of the learning day, e.g. 2026-08-05.
    day = Column(Date, nullable=False)
    is_restored = Column(Boolean, default=False, nullable=False)
    restored_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="learning_days")
