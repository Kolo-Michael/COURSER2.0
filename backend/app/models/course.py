import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    slug = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    courses = relationship("Course", back_populates="category")


class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    short_description = Column(String(500), nullable=True)
    level = Column(String(20), nullable=False, default="beginner")
    duration = Column(String(50), nullable=True)
    price = Column(Float, default=0.0)
    is_published = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    is_ai_generated = Column(Boolean, default=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    instructor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="courses")
    instructor = relationship("User", back_populates="courses")
    modules = relationship("Module", back_populates="course", order_by="Module.order")
    enrollments = relationship("Enrollment", back_populates="course")


class Module(Base):
    __tablename__ = "modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module", order_by="Lesson.order")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    video_url = Column(String(500), nullable=True)
    duration = Column(String(50), nullable=True)
    order = Column(Integer, nullable=False, default=0)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    module = relationship("Module", back_populates="lessons")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    progress = Column(Float, default=0.0)

    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
