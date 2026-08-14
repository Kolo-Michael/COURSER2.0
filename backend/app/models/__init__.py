"""Model package — re-exports every SQLAlchemy model.

Importing this module registers all models on `Base.metadata`, which is
what lets `create_all()` (init_db.py) know every table to build.
"""

# Imports in dependency order so relationships resolve cleanly.
from .user import User, PasswordResetToken
from .course import Course, Category, Module, Lesson, Enrollment, LessonProgress
from .session import UserSession
from .conversation import Conversation, Message
from .streak import LearningDay

__all__ = [
    "User",
    "PasswordResetToken",
    "Course",
    "Category",
    "Module",
    "Lesson",
    "Enrollment",
    "LessonProgress",
    "UserSession",
    "Conversation",
    "Message",
    "LearningDay",
]