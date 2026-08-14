"""Conversation models for the (future) AI tutor chat feature.

`Conversation` groups a user's chats per course; `Message` holds each turn
(user or assistant). Neither table is currently wired to a live endpoint.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, UUID as SA_UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Conversation(Base):
    """A chat thread. Belongs to a user, optionally scoped to one course."""

    __tablename__ = "conversations"

    id = Column(SA_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(SA_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=True)
    course_id = Column(SA_UUID(as_uuid=True), ForeignKey("courses.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="conversations")
    # Order messages oldest→newest so rendering the thread is trivial.
    # cascade="all, delete-orphan" removes the messages when the conversation
    # row is deleted (chat delete must clean up its turns too).
    messages = relationship(
        "Message",
        back_populates="conversation",
        order_by="Message.created_at",
        cascade="all, delete-orphan",
    )


class Message(Base):
    """One chat turn inside a Conversation. `role` is 'user' or 'assistant'."""

    __tablename__ = "messages"

    id = Column(SA_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(SA_UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")