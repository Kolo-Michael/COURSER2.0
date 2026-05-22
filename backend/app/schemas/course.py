from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class LessonBase(BaseModel):
    title: str
    content: Optional[str] = None
    video_url: Optional[str] = None
    duration: Optional[str] = None
    order: int = 0
    is_published: bool = False


class LessonResponse(LessonBase):
    id: UUID
    module_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ModuleBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0


class ModuleCreate(ModuleBase):
    lessons: List[LessonBase] = Field(default_factory=list)


class ModuleResponse(ModuleBase):
    id: UUID
    course_id: UUID
    created_at: datetime
    lessons: List[LessonResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class CourseBase(BaseModel):
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
    modules: List[ModuleCreate] = Field(default_factory=list)


class CourseUpdate(BaseModel):
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
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime]
    category: Optional[CategoryResponse] = None
    modules: List[ModuleResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class CourseListResponse(BaseModel):
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
    id: UUID
    user_id: UUID
    course_id: UUID
    enrolled_at: datetime
    completed_at: Optional[datetime]
    progress: float

    class Config:
        from_attributes = True
