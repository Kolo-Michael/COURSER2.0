"""Pydantic request/response models for the course catalog + learning flow.

Each entity has a *Base model (shared fields), request models (create
variants with nested children), and response models (add ids, timestamps,
and computed per-user fields like lesson progress).
"""

# BaseModel = Pydantic validation; EmailStr validates the newsletter email;
# Field constrains values; List/UUID/datetime type the nested structures.
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class CategoryBase(BaseModel):
    """Shared category fields (name/slug/description/icon)."""
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None


class CategoryResponse(CategoryBase):
    """Category as returned to clients — adds id + created_at."""
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class LessonBase(BaseModel):
    """Shared lesson fields; order defaults to 0 and is assigned later."""
    title: str
    content: Optional[str] = None
    video_url: Optional[str] = None
    duration: Optional[str] = None
    order: int = 0
    is_published: bool = False


class LessonResponse(LessonBase):
    """Lesson plus per-user progress fields added at read time."""
    id: UUID
    module_id: UUID
    created_at: datetime
    # Per-user progress (0-100) and completion, populated only when the
    # requesting user is authenticated (see courses.get_course_by_slug).
    progress: Optional[float] = None
    is_completed: Optional[bool] = None

    class Config:
        from_attributes = True


class ModuleBase(BaseModel):
    """Shared module fields."""
    title: str
    description: Optional[str] = None
    order: int = 0


class ModuleCreate(ModuleBase):
    """Module request body — carries the lessons it contains."""
    lessons: List[LessonBase] = Field(default_factory=list)


class ModuleResponse(ModuleBase):
    """Module with id + nested lessons for the response tree."""
    id: UUID
    course_id: UUID
    created_at: datetime
    lessons: List[LessonResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class CourseBase(BaseModel):
    """Shared course fields used by request and response models."""
    title: str
    slug: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    level: str = "beginner"
    duration: Optional[str] = None
    price: float = 0.0
    is_published: bool = False
    is_featured: bool = False
    is_ai_generated: bool = False
    category_id: Optional[UUID] = None
    instructor_id: Optional[UUID] = None


class CourseCreate(CourseBase):
    """Course request body — accepts a full module/lesson tree."""
    modules: List[ModuleCreate] = Field(default_factory=list)


class CourseUpdate(BaseModel):
    """Partial course update — all fields optional, only sent fields apply."""
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    level: Optional[str] = None
    duration: Optional[str] = None
    price: Optional[float] = None
    is_published: Optional[bool] = None
    is_featured: Optional[bool] = None
    category_id: Optional[UUID] = None


class CourseResponse(CourseBase):
    """Full course with category + nested modules/lessons."""
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime]
    category: Optional[CategoryResponse] = None
    modules: List[ModuleResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class CourseListResponse(BaseModel):
    """Lightweight course row for the catalog grid (no full lesson tree)."""
    id: UUID
    title: str
    slug: str
    short_description: Optional[str]
    level: str
    duration: Optional[str]
    price: float
    is_published: bool
    is_featured: bool
    is_ai_generated: bool
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True


class EnrollmentResponse(BaseModel):
    """Enrollment row as returned to clients."""
    id: UUID
    user_id: UUID
    course_id: UUID
    enrolled_at: datetime
    completed_at: Optional[datetime]
    progress: float

    class Config:
        from_attributes = True


class EnrollmentDetailResponse(BaseModel):
    """Enrollment + course summary + real completion stats for a learner.

    `progress_percent` is derived from the enrollment's stored progress
    (average across the course's lessons, maintained by the lessons API).
    """

    id: UUID
    course_id: UUID
    course_title: str
    course_slug: str
    course_category: Optional[str] = None
    level: str = "beginner"
    enrolled_at: datetime
    completed_at: Optional[datetime]
    progress: float
    total_lessons: int = 0
    completed_lessons: int = 0
    progress_percent: int = 0
    is_completed: bool = False

    class Config:
        from_attributes = True


class EnrollmentCreate(BaseModel):
    """Body for POST /courses/{slug}/enroll. Empty — slug is in the path
    and the user comes from the access token."""
    pass


class AskRequest(BaseModel):
    """Body for POST /courses/{slug}/ask (the 'Ask Cora' widget).

    `conversation_id` is optional: when omitted (or null) a brand-new chat
    is started for this (user, course); when provided, the question is
    appended to that existing chat so the learner can continue it.
    """
    question: str = Field(min_length=1, max_length=2000)
    conversation_id: Optional[UUID] = None


class AskResponse(BaseModel):
    """Reply body for the tutor — answer text plus the chat it belongs to."""
    answer: str
    conversation_id: UUID


class ConversationMessageResponse(BaseModel):
    """One persisted chat turn (user or assistant)."""
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationSummaryResponse(BaseModel):
    """Lightweight conversation row for the chat-list sidebar."""
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int

    class Config:
        from_attributes = True


class NewsletterSubscribe(BaseModel):
    """Body for POST /newsletter/subscribe."""
    email: EmailStr
