"""Schema package — re-exports the most commonly used Pydantic models so
callers can import them from a single place instead of per-module paths."""

# User / auth request+response shapes (see schemas.auth).
from .auth import UserCreate, UserResponse, LoginRequest, TokenResponse
# Course / category / module / lesson / enrollment shapes (see schemas.course).
from .course import (
    CourseCreate, CourseUpdate, CourseResponse, CourseListResponse,
    CategoryResponse, CategoryBase, ModuleBase, ModuleResponse,
    LessonBase, LessonResponse, EnrollmentResponse
)