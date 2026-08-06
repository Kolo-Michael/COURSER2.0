"""Streak endpoints for the mobile dashboard.

  GET  /streak          — current streak + restore availability
  POST /streak/restore  — spend one of this month's restores to back-fill
                          the most recent skipped learning day

Both require a valid access token (Bearer or cookie).
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.services import streak_service

router = APIRouter()


@router.get("", response_model=dict)
async def get_streak(
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await streak_service.get_streak(db, user_id)


@router.post("/restore", response_model=dict)
async def restore_skipped_day(
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    payload, error = await streak_service.restore_skipped_day(db, user_id)
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    return payload
