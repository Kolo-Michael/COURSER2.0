"""Lesson endpoints: fetch a lesson, mark complete, update progress/quiz score.

The mobile app navigates to /course/:courseId/lesson/:lessonId and calls:
  GET    /lessons/{id}             — lesson content
  POST   /lessons/{id}/complete    — mark as complete
  PATCH  /lessons/{id}/progress    — update progress + optional quiz_score

All mutating endpoints require a valid access token (Bearer or cookie).
"""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import Lesson
from app.services import streak_service

router = APIRouter()


class ProgressUpdate(BaseModel):
    progress: float
    quiz_score: Optional[float] = None


@router.get("/{lesson_id}", response_model=dict)
async def get_lesson(lesson_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Return a single lesson with its content, duration, and order."""
    result = await db.execute(
        select(Lesson).where(Lesson.id == lesson_id)
    )
    lesson = result.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )
    return {
        "id": str(lesson.id),
        "title": lesson.title,
        "content": lesson.content,
        "video_url": lesson.video_url,
        "duration": lesson.duration,
        "order": lesson.order,
        "is_published": lesson.is_published,
        "created_at": lesson.created_at.isoformat() if lesson.created_at else None,
    }


@router.post("/{lesson_id}/complete")
async def complete_lesson(
    lesson_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Mark a lesson as complete (sets progress to 100%).

    Requires authentication. Returns the lesson with 100% progress.
    """
    result = await db.execute(
        select(Lesson).where(Lesson.id == lesson_id)
    )
    lesson = result.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )
    # Completing a lesson counts as a learning day for the streak.
    await streak_service.record_learning_day(db, user_id)
    return {
        "id": str(lesson.id),
        "title": lesson.title,
        "content": lesson.content,
        "video_url": lesson.video_url,
        "duration": lesson.duration,
        "order": lesson.order,
        "is_published": lesson.is_published,
        "is_completed": True,
        "progress": 100.0,
    }


@router.patch("/{lesson_id}/progress")
async def update_lesson_progress(
    lesson_id: uuid.UUID,
    payload: ProgressUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Update lesson progress and optionally record a quiz score.

    Requires authentication. Returns the updated lesson with progress and
    quiz_score from the request body.
    """
    result = await db.execute(
        select(Lesson).where(Lesson.id == lesson_id)
    )
    lesson = result.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )
    # Meaningful progress (≥50%) also counts as a learning day.
    if payload.progress >= 50.0:
        await streak_service.record_learning_day(db, user_id)
    return {
        "id": str(lesson.id),
        "title": lesson.title,
        "content": lesson.content,
        "video_url": lesson.video_url,
        "duration": lesson.duration,
        "order": lesson.order,
        "is_published": lesson.is_published,
        "is_completed": payload.progress >= 100.0,
        "progress": payload.progress,
        "quiz_score": payload.quiz_score,
    }
