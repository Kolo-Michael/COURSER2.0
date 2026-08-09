"""Course catalog + management, including the new /enroll and /ask endpoints
that the wired-up buttons on the frontend depend on.

Mutating endpoints (create/update/delete) are now gated by
`get_current_user_id` and a role check so unauthenticated and
non-privileged users can't write to the catalog.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import Category, Course, Enrollment, Lesson, LessonProgress, Module, User
from app.schemas.course import (
    AskRequest,
    AskResponse,
    CategoryResponse,
    CourseCreate,
    CourseListResponse,
    CourseResponse,
    CourseUpdate,
    EnrollmentDetailResponse,
    EnrollmentResponse,
)
from app.services import auth_service

router = APIRouter()


async def _require_admin_or_above(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Resolve the current user and confirm role ∈ {admin, super_admin}."""
    # Inline rather than `Depends(get_current_user_id)` so we can also
    # return the User object for the caller — the dependency chain on
    # its own stops at the UUID.
    from app.core.security import get_access_token

    token = get_access_token(request)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    from app.core.security import decode_token

    payload = decode_token(token, expected_type="access")
    try:
        user_id = uuid.UUID(payload["sub"])
    except (KeyError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token subject")

    user = await auth_service.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    if user.role not in ("admin", "super_admin"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin only")
    return user


NOW = datetime(2026, 5, 13, 12, 0, 0)

FALLBACK_CATEGORIES = [
    {
        "id": UUID("11111111-1111-4111-8111-111111111111"),
        "name": "Web Development",
        "slug": "web-development",
        "description": "Frontend and full-stack web skills.",
        "icon": "fa-globe",
        "created_at": NOW,
    },
    {
        "id": UUID("22222222-2222-4222-8222-222222222222"),
        "name": "Data Science",
        "slug": "data-science",
        "description": "Python analysis, charts, and reporting.",
        "icon": "fa-database",
        "created_at": NOW,
    },
    {
        "id": UUID("33333333-3333-4333-8333-333333333333"),
        "name": "AI & Machine Learning",
        "slug": "ai-ml",
        "description": "Practical AI workflows for learning and content.",
        "icon": "fa-brain",
        "created_at": NOW,
    },
]

FALLBACK_COURSES = [
    {
        "id": UUID("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
        "title": "Frontend Foundations with React",
        "slug": "frontend-foundations-react",
        "description": "Build responsive interfaces with HTML, CSS, JavaScript, React components, and reusable UI patterns.",
        "short_description": "Create polished React pages from the ground up.",
        "level": "beginner",
        "duration": "4 weeks",
        "price": 0.0,
        "is_published": True,
        "is_featured": True,
        "is_ai_generated": False,
        "category_id": UUID("11111111-1111-4111-8111-111111111111"),
        "instructor_id": None,
        "created_at": NOW,
        "updated_at": NOW,
        "category": FALLBACK_CATEGORIES[0],
        "modules": [
            {
                "id": UUID("aaaaaaaa-0001-4000-8000-aaaaaaaaaaaa"),
                "course_id": UUID("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
                "title": "Build the page structure",
                "description": "Start with semantic HTML and layout thinking.",
                "order": 1,
                "created_at": NOW,
                "lessons": [
                    {
                        "id": UUID("aaaaaaaa-0001-4000-8001-aaaaaaaaaaaa"),
                        "module_id": UUID("aaaaaaaa-0001-4000-8000-aaaaaaaaaaaa"),
                        "title": "How the web page is assembled",
                        "content": "You will learn how headings, sections, links, images, and forms create a meaningful page structure before styling begins.",
                        "video_url": None,
                        "duration": "12 min",
                        "order": 1,
                        "is_published": True,
                        "created_at": NOW,
                    },
                    {
                        "id": UUID("aaaaaaaa-0001-4000-8002-aaaaaaaaaaaa"),
                        "module_id": UUID("aaaaaaaa-0001-4000-8000-aaaaaaaaaaaa"),
                        "title": "Responsive layout with flex and grid",
                        "content": "Practice building a course-card layout that works on mobile, tablet, and desktop screens.",
                        "video_url": None,
                        "duration": "18 min",
                        "order": 2,
                        "is_published": True,
                        "created_at": NOW,
                    },
                ],
            }
        ],
    },
    {
        "id": UUID("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"),
        "title": "Python Data Analysis Starter",
        "slug": "python-data-analysis-starter",
        "description": "Use Python, pandas, and charts to clean data, answer questions, and explain insights.",
        "short_description": "Analyze real datasets with Python basics and pandas.",
        "level": "beginner",
        "duration": "3 weeks",
        "price": 0.0,
        "is_published": True,
        "is_featured": True,
        "is_ai_generated": False,
        "category_id": UUID("22222222-2222-4222-8222-222222222222"),
        "instructor_id": None,
        "created_at": NOW,
        "updated_at": NOW,
        "category": FALLBACK_CATEGORIES[1],
        "modules": [
            {
                "id": UUID("bbbbbbbb-0001-4000-8000-bbbbbbbbbbbb"),
                "course_id": UUID("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"),
                "title": "Python for data work",
                "description": "Learn the minimum Python needed for analysis.",
                "order": 1,
                "created_at": NOW,
                "lessons": [
                    {
                        "id": UUID("bbbbbbbb-0001-4000-8001-bbbbbbbbbbbb"),
                        "module_id": UUID("bbbbbbbb-0001-4000-8000-bbbbbbbbbbbb"),
                        "title": "Cleaning a messy table",
                        "content": "Use pandas to rename columns, handle missing values, and prepare a dataset for reporting.",
                        "video_url": None,
                        "duration": "24 min",
                        "order": 1,
                        "is_published": True,
                        "created_at": NOW,
                    }
                ],
            }
        ],
    },
    {
        "id": UUID("cccccccc-cccc-4ccc-8ccc-cccccccccccc"),
        "title": "AI Prompting for Course Creators",
        "slug": "ai-prompting-course-creators",
        "description": "Plan lessons, quizzes, examples, and feedback using practical AI prompting workflows.",
        "short_description": "Use AI to draft better lessons and support learners.",
        "level": "intermediate",
        "duration": "2 weeks",
        "price": 0.0,
        "is_published": True,
        "is_featured": True,
        "is_ai_generated": False,
        "category_id": UUID("33333333-3333-4333-8333-333333333333"),
        "instructor_id": None,
        "created_at": NOW,
        "updated_at": NOW,
        "category": FALLBACK_CATEGORIES[2],
        "modules": [
            {
                "id": UUID("cccccccc-0001-4000-8000-cccccccccccc"),
                "course_id": UUID("cccccccc-cccc-4ccc-8ccc-cccccccccccc"),
                "title": "Prompt with purpose",
                "description": "Write prompts that produce usable teaching material.",
                "order": 1,
                "created_at": NOW,
                "lessons": [
                    {
                        "id": UUID("cccccccc-0001-4000-8001-cccccccccccc"),
                        "module_id": UUID("cccccccc-0001-4000-8000-cccccccccccc"),
                        "title": "Define learner level and outcome",
                        "content": "Turn a broad topic into a clear learning objective, prerequisite list, and success check.",
                        "video_url": None,
                        "duration": "14 min",
                        "order": 1,
                        "is_published": True,
                        "created_at": NOW,
                    }
                ],
            }
        ],
    },
]


def fallback_course_by_slug(slug: str):
    return next((course for course in FALLBACK_COURSES if course["slug"] == slug), None)


# --- public read endpoints ------------------------------------------------


@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Category).order_by(Category.name))
        return result.scalars().all()
    except Exception:
        return FALLBACK_CATEGORIES


@router.get("", response_model=List[CourseListResponse])
async def list_courses(
    published: Optional[bool] = Query(default=None),
    featured: Optional[bool] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Course).options(selectinload(Course.category)).order_by(Course.created_at.desc())

    if published is not None:
        query = query.where(Course.is_published == published)
    if featured is not None:
        query = query.where(Course.is_featured == featured)

    try:
        result = await db.execute(query)
        return result.scalars().all()
    except Exception:
        courses = FALLBACK_COURSES
        if published is not None:
            courses = [course for course in courses if course["is_published"] == published]
        if featured is not None:
            courses = [course for course in courses if course["is_featured"] == featured]
        return courses


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Course)
        .where(Course.id == course_id)
        .options(
            selectinload(Course.category),
            selectinload(Course.modules).selectinload(Module.lessons),
        )
    )
    course = result.scalar_one_or_none()
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


@router.get("/slug/{slug}", response_model=CourseResponse)
async def get_course_by_slug(
    slug: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(Course)
            .where(Course.slug == slug)
            .options(
                selectinload(Course.category),
                selectinload(Course.modules).selectinload(Module.lessons),
            )
        )
        course = result.scalar_one_or_none()
    except Exception:
        course = fallback_course_by_slug(slug)

    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    await _attach_lesson_progress(request, db, course)
    return course


async def _attach_lesson_progress(
    request: Request,
    db: AsyncSession,
    course,
) -> None:
    """Attach per-lesson progress/is_completed for the authenticated user.

    The course detail endpoint is public, so this is optional: when a valid
    access token is present (web cookie or mobile Bearer) each lesson gets
    `progress` and `is_completed` for that learner; otherwise the fields are
    left null. The fallback course dicts skip this (no lesson rows exist).
    """
    if isinstance(course, dict) or not course.modules:
        return

    from app.core.security import decode_token, get_access_token

    token = get_access_token(request)
    if not token:
        return
    try:
        payload = decode_token(token, expected_type="access")
        user_id = uuid.UUID(payload["sub"])
    except Exception:
        return

    lesson_ids = [lesson.id for module in course.modules for lesson in module.lessons]
    if not lesson_ids:
        return

    rows_result = await db.execute(
        select(LessonProgress).where(
            LessonProgress.user_id == user_id,
            LessonProgress.lesson_id.in_(lesson_ids),
        )
    )
    progress_by_lesson = {row.lesson_id: row for row in rows_result.scalars().all()}

    for module in course.modules:
        for lesson in module.lessons:
            row = progress_by_lesson.get(lesson.id)
            lesson.progress = row.progress if row else 0.0
            lesson.is_completed = bool(row.is_completed) if row else False


# --- admin-only write endpoints ------------------------------------------


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(_require_admin_or_above),
):
    course = Course(**course_data.model_dump(exclude={"modules"}))
    db.add(course)
    await db.flush()

    for module_index, module_data in enumerate(course_data.modules, start=1):
        module_payload = module_data.model_dump(exclude={"lessons"})
        module = Module(
            course_id=course.id,
            order=module_payload.get("order") or module_index,
            **{key: value for key, value in module_payload.items() if key != "order"},
        )
        db.add(module)
        await db.flush()

        for lesson_index, lesson_data in enumerate(module_data.lessons, start=1):
            lesson_payload = lesson_data.model_dump()
            lesson = Lesson(
                module_id=module.id,
                order=lesson_payload.get("order") or lesson_index,
                **{key: value for key, value in lesson_payload.items() if key != "order"},
            )
            db.add(lesson)

    await db.commit()
    await db.refresh(course)
    result = await db.execute(
        select(Course)
        .where(Course.id == course.id)
        .options(
            selectinload(Course.category),
            selectinload(Course.modules).selectinload(Module.lessons),
        )
    )
    return result.scalar_one()


@router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: uuid.UUID,
    course_data: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(_require_admin_or_above),
):
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    for field, value in course_data.model_dump(exclude_unset=True).items():
        setattr(course, field, value)

    await db.commit()
    await db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(_require_admin_or_above),
):
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    await db.delete(course)
    await db.commit()


# --- student actions ------------------------------------------------------


async def _course_lesson_progress(
    db: AsyncSession,
    user_id: uuid.UUID,
    course: Course,
) -> tuple[int, int]:
    """Return (total_lessons, completed_lessons) for a user + course."""
    lessons_result = await db.execute(
        select(Lesson).join(Module).where(Module.course_id == course.id)
    )
    lessons = list(lessons_result.scalars().all())
    total = len(lessons)
    if total == 0:
        return 0, 0
    rows_result = await db.execute(
        select(LessonProgress).where(
            LessonProgress.user_id == user_id,
            LessonProgress.lesson_id.in_([lesson.id for lesson in lessons]),
        )
    )
    completed = sum(1 for row in rows_result.scalars().all() if row.is_completed)
    return total, completed


@router.get("/enrollments/me", response_model=List[EnrollmentDetailResponse])
async def list_my_enrollments(
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Return the authenticated learner's enrollments with real progress.

    Each item includes the course title/slug/category, the stored progress
    percent, how many lessons are complete, and whether the course is done.
    """
    result = await db.execute(
        select(Enrollment)
        .where(Enrollment.user_id == user_id)
        .options(
            selectinload(Enrollment.course)
            .selectinload(Course.category),
            selectinload(Enrollment.course)
            .selectinload(Course.modules)
            .selectinload(Module.lessons),
        )
        .order_by(Enrollment.enrolled_at.desc())
    )
    enrollments = result.scalars().all()

    details: list[EnrollmentDetailResponse] = []
    for enrollment in enrollments:
        course = enrollment.course
        if course is None:
            continue
        total, completed = await _course_lesson_progress(db, user_id, course)
        progress_percent = int(round(enrollment.progress or 0.0))
        details.append(
            EnrollmentDetailResponse(
                id=enrollment.id,
                course_id=course.id,
                course_title=course.title,
                course_slug=course.slug,
                course_category=course.category.name if course.category else None,
                level=course.level,
                enrolled_at=enrollment.enrolled_at,
                completed_at=enrollment.completed_at,
                progress=enrollment.progress or 0.0,
                total_lessons=total,
                completed_lessons=completed,
                progress_percent=progress_percent,
                is_completed=progress_percent >= 100 or (total > 0 and completed == total),
            )
        )
    return details


@router.post("/slug/{slug}/restart", response_model=EnrollmentResponse)
async def restart_course(
    slug: str,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Reset a learner's progress on a course back to zero.

    Deletes all per-lesson progress rows for the user in this course and
    zeroes the enrollment. The student keeps the enrollment but starts over.
    """
    course_result = await db.execute(select(Course).where(Course.slug == slug))
    course = course_result.scalar_one_or_none()
    if course is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Course not found")

    enrollment_result = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == user_id,
            Enrollment.course_id == course.id,
        )
    )
    enrollment = enrollment_result.scalar_one_or_none()
    if enrollment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "You are not enrolled in this course")

    lessons_result = await db.execute(
        select(Lesson).join(Module).where(Module.course_id == course.id)
    )
    lesson_ids = [lesson.id for lesson in lessons_result.scalars().all()]
    if lesson_ids:
        await db.execute(
            delete(LessonProgress).where(
                LessonProgress.user_id == user_id,
                LessonProgress.lesson_id.in_(lesson_ids),
            )
        )

    enrollment.progress = 0.0
    enrollment.completed_at = None
    await db.commit()
    await db.refresh(enrollment)
    return enrollment


@router.post("/slug/{slug}/enroll", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def enroll_in_course(
    slug: str,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Authenticated enroll — creates an Enrollment row.

    Idempotent: returns the existing enrollment if one already exists
    (so double-clicking the Start button doesn't error out)."""
    result = await db.execute(select(Course).where(Course.slug == slug))
    course = result.scalar_one_or_none()
    if course is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Course not found")

    existing = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == user_id,
            Enrollment.course_id == course.id,
        )
    )
    enrollment = existing.scalar_one_or_none()
    if enrollment is not None:
        return enrollment

    enrollment = Enrollment(
        user_id=user_id,
        course_id=course.id,
        progress=0.0,
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return enrollment


@router.post("/slug/{slug}/ask", response_model=AskResponse)
async def ask_cora(
    slug: str,
    payload: AskRequest,
    db: AsyncSession = Depends(get_db),
    _user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Stub tutor endpoint. Logs the question; returns a canned reply.

    Replace with a real LLM call when the tutor service is wired up.
    Validates the course slug exists so a typo'd path doesn't 404
    silently."""
    result = await db.execute(select(Course).where(Course.slug == slug))
    course = result.scalar_one_or_none()
    if course is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Course not found")

    print(f"[cora] ask on course={course.slug!r}: {payload.question!r}")
    return AskResponse(
        answer=(
            "Cora is in placeholder mode right now — this stub just confirms "
            "your message was received. A real tutor backend will replace "
            "this reply once the AI service is wired up."
        )
    )
