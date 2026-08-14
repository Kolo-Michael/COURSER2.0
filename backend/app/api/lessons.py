"""Lesson endpoints: fetch a lesson, mark complete, update progress/quiz score.

The mobile app navigates to /course/:courseId/lesson/:lessonId and calls:
  GET    /lessons/{id}             — lesson content
  POST   /lessons/{id}/complete    — mark as complete
  PATCH  /lessons/{id}/progress    — update progress + optional quiz_score

Progress is persisted per (user, lesson) in the `lesson_progress` table
and the parent course's `enrollment.progress` is recomputed as the average
across all of the course's lessons, so the web dashboard and mobile client
both show real completion statistics.

All mutating endpoints require a valid access token (Bearer or cookie).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel  # inline request body for PATCH progress
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id  # auth guard on all mutations
from app.models import Enrollment, Lesson, LessonProgress, Module
from app.services import streak_service  # completing lessons feeds the streak

router = APIRouter()


class ProgressUpdate(BaseModel):
    """PATCH body: `progress` (0–100) and an optional quiz score."""
    progress: float
    quiz_score: Optional[float] = None


def _lesson_dict(lesson: Lesson, extra: Optional[dict] = None) -> dict:
    """Serialize a lesson to the JSON shape clients expect, optionally
    merged with extra fields (e.g. per-user progress)."""
    payload = {
        "id": str(lesson.id),
        "title": lesson.title,
        "content": lesson.content,
        "video_url": lesson.video_url,
        "duration": lesson.duration,
        "order": lesson.order,
        "is_published": lesson.is_published,
        "created_at": lesson.created_at.isoformat() if lesson.created_at else None,
    }
    if extra:
        payload.update(extra)
    return payload


async def _course_id_for_lesson(db: AsyncSession, lesson: Lesson) -> UUID | None:
    """Resolve the parent course of a lesson by hopping through its module."""
    module = await db.get(Module, lesson.module_id)
    return module.course_id if module else None


async def _upsert_lesson_progress(
    db: AsyncSession,
    user_id: UUID,
    lesson_id: UUID,
    progress: float,
    quiz_score: Optional[float] = None,
) -> LessonProgress:
    """Insert-or-update a single (user, lesson) progress row.

    A row is created when none exists yet; an existing row has its progress,
    completion flag, quiz score, and completed_at updated instead. The row
    is flushed (not committed) so the caller can commit once at the end.
    """
    result = await db.execute(
        select(LessonProgress).where(
            LessonProgress.user_id == user_id,
            LessonProgress.lesson_id == lesson_id,
        )
    )
    row = result.scalar_one_or_none()
    if row is None:
        row = LessonProgress(user_id=user_id, lesson_id=lesson_id, progress=0.0)
        db.add(row)
    # 100% progress flips the completion flag (and the timestamp).
    row.progress = progress
    row.is_completed = progress >= 100.0
    row.quiz_score = quiz_score
    row.completed_at = datetime.utcnow() if row.is_completed else None
    await db.flush()
    return row


async def _recompute_course_progress(
    db: AsyncSession,
    user_id: UUID,
    course_id: UUID,
) -> dict:
    """Average the user's lesson progress across a course and persist it on
    the enrollment row. Returns {percent, completed, total}."""
    # Every lesson that belongs to this course.
    lessons_result = await db.execute(
        select(Lesson).join(Module).where(Module.course_id == course_id)
    )
    lessons = list(lessons_result.scalars().all())
    total = len(lessons)
    if total == 0:
        return {"percent": 0.0, "completed": 0, "total": 0}

    # The user's progress rows for those lessons, keyed by lesson id.
    rows_result = await db.execute(
        select(LessonProgress).where(
            LessonProgress.user_id == user_id,
            LessonProgress.lesson_id.in_([lesson.id for lesson in lessons]),
        )
    )
    progress_rows = {row.lesson_id: row for row in rows_result.scalars().all()}
    completed = sum(
        1
        for lesson in lessons
        if progress_rows.get(lesson.id) and progress_rows[lesson.id].is_completed
    )
    # Course progress = mean of the per-lesson percentages.
    average = (
        sum(
            progress_rows.get(lesson.id).progress if progress_rows.get(lesson.id) else 0.0
            for lesson in lessons
        )
        / total
    )

    enrollment_result = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == user_id,
            Enrollment.course_id == course_id,
        )
    )
    enrollment = enrollment_result.scalar_one_or_none()
    if enrollment is not None:
        # Persist the recomputed average; stamp completion at 100%.
        enrollment.progress = round(average, 2)
        enrollment.completed_at = datetime.utcnow() if average >= 100.0 else None

    await db.commit()
    return {"percent": average, "completed": completed, "total": total}


@router.get("/{lesson_id}", response_model=dict)
async def get_lesson(lesson_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Return a single lesson with its content, duration, and order.
    Public read — no auth token required."""
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )
    return _lesson_dict(lesson)


@router.post("/{lesson_id}/complete")
async def complete_lesson(
    lesson_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Mark a lesson as complete (progress 100%) and persist it.

    Recomputes the parent course's enrollment progress and records a
    learning day for the streak. Returns the lesson plus course progress.
    """
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )

    course_id = await _course_id_for_lesson(db, lesson)
    # Always 100% here — that's what "complete" means.
    await _upsert_lesson_progress(db, user_id, lesson_id, 100.0)
    course_progress = (
        await _recompute_course_progress(db, user_id, course_id) if course_id else None
    )
    # Completing a lesson counts as a learning day for the streak.
    await streak_service.record_learning_day(db, user_id)

    return _lesson_dict(
        lesson,
        {
            "is_completed": True,
            "progress": 100.0,
            "course_progress_percent": int(course_progress["percent"]) if course_progress else None,
            "completed_lessons": course_progress["completed"] if course_progress else None,
            "total_lessons": course_progress["total"] if course_progress else None,
        },
    )


@router.patch("/{lesson_id}/progress")
async def update_lesson_progress(
    lesson_id: uuid.UUID,
    payload: ProgressUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Persist lesson progress and optionally record a quiz score.

    Requires authentication. Recomputes the parent course's enrollment
    progress and returns the updated lesson with progress and quiz_score.
    """
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )

    await _upsert_lesson_progress(
        db,
        user_id,
        lesson_id,
        payload.progress,
        quiz_score=payload.quiz_score,
    )
    course_id = await _course_id_for_lesson(db, lesson)
    course_progress = (
        await _recompute_course_progress(db, user_id, course_id) if course_id else None
    )
    # Meaningful progress (≥50%) also counts as a learning day.
    if payload.progress >= 50.0:
        await streak_service.record_learning_day(db, user_id)

    return _lesson_dict(
        lesson,
        {
            "is_completed": payload.progress >= 100.0,
            "progress": payload.progress,
            "quiz_score": payload.quiz_score,
            "course_progress_percent": int(course_progress["percent"]) if course_progress else None,
            "completed_lessons": course_progress["completed"] if course_progress else None,
            "total_lessons": course_progress["total"] if course_progress else None,
        },
    )
