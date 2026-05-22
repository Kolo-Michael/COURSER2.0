from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Category, Course, Lesson, Module
from app.schemas.course import (
    CategoryResponse,
    CourseCreate,
    CourseListResponse,
    CourseResponse,
    CourseUpdate,
)

router = APIRouter()

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


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(course_data: CourseCreate, db: AsyncSession = Depends(get_db)):
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


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: UUID, db: AsyncSession = Depends(get_db)):
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
async def get_course_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
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
    return course


@router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: UUID,
    course_data: CourseUpdate,
    db: AsyncSession = Depends(get_db),
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
async def delete_course(course_id: UUID, db: AsyncSession = Depends(get_db)):
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    await db.delete(course)
    await db.commit()
