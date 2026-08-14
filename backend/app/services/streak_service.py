"""Learning-streak bookkeeping.

A "learning day" is recorded whenever the student completes a lesson (or
makes ≥50% progress on one). The streak is the count of consecutive
learning days ending today (or yesterday, while today is still pending).

Streak restores: if the student skips a day, they can spend one of their
monthly restores (default 4) to back-fill that day and keep the streak
alive. Restores are counted against the calendar month of `restored_at`.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings  # MAX_STREAK_RESTORES_PER_MONTH
from app.models import LearningDay


def _utc_date() -> date:
    return datetime.utcnow().date()


def _month_start(d: date) -> date:
    """First day of the month containing `d` (for the restore counter)."""
    return d.replace(day=1)


async def record_learning_day(
    db: AsyncSession,
    user_id: uuid.UUID,
    day: date | None = None,
) -> LearningDay:
    """Idempotently record a learning day for `user_id` (default today)."""
    day = day or _utc_date()
    result = await db.execute(
        select(LearningDay).where(LearningDay.user_id == user_id, LearningDay.day == day)
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        # Already learned that day — no duplicate row.
        return existing
    row = LearningDay(user_id=user_id, day=day, is_restored=False)
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def _load_rows(db: AsyncSession, user_id: uuid.UUID) -> list[LearningDay]:
    """Fetch every learning-day row for the user (used for all streak math)."""
    result = await db.execute(select(LearningDay).where(LearningDay.user_id == user_id))
    return list(result.scalars().all())


def _current_streak(learned: set[date], today: date) -> int:
    """Count consecutive learning days ending today (or yesterday while
    today is still pending — a streak isn't broken until the day passes)."""
    if today in learned:
        anchor = today
    elif (today - timedelta(days=1)) in learned:
        anchor = today - timedelta(days=1)
    else:
        # Neither today nor yesterday learned ⇒ streak has lapsed.
        return 0
    streak = 0
    d = anchor
    while d in learned:
        streak += 1
        d -= timedelta(days=1)
    return streak


def _longest_streak(learned: set[date]) -> int:
    """Longest run of consecutive days in the user's history."""
    if not learned:
        return 0
    best = 0
    current = 0
    prev: date | None = None
    for d in sorted(learned):
        # Reset the run when a gap appears, otherwise extend it.
        current = current + 1 if prev is not None and (d - prev).days == 1 else 1
        best = max(best, current)
        prev = d
    return best


def _restorable_day(learned: set[date], today: date) -> date | None:
    """Most recent skipped day (< today) that sits right after a learned day.

    Scanning at most 8 days back keeps restores limited to recent skips.
    """
    for offset in range(1, 9):
        d = today - timedelta(days=offset)
        if d in learned:
            continue
        # Only a day whose predecessor was learned can be back-filled
        # meaningfully (it slots into the streak chain).
        if (d - timedelta(days=1)) in learned:
            return d
    return None


def _restores_used_this_month(rows: list[LearningDay]) -> int:
    """Count of restored days in the current calendar month."""
    month = _month_start(datetime.utcnow().date())
    return sum(
        1
        for row in rows
        if row.is_restored and row.restored_at is not None and row.restored_at.date() >= month
    )


async def get_streak(db: AsyncSession, user_id: uuid.UUID) -> dict:
    """Assemble the full streak snapshot for the dashboard response."""
    rows = await _load_rows(db, user_id)
    learned = {row.day for row in rows}
    today = _utc_date()
    restorable = _restorable_day(learned, today)
    restores_used = _restores_used_this_month(rows)
    max_restores = settings.MAX_STREAK_RESTORES_PER_MONTH
    last = max(learned) if learned else None
    month = _month_start(today)
    return {
        "current_streak": _current_streak(learned, today),
        "longest_streak": _longest_streak(learned),
        "last_learning_day": last.isoformat() if last else None,
        "learned_today": today in learned,
        "days_this_month": sum(1 for row in rows if row.day >= month),
        "restores_used": restores_used,
        "restores_available": max(0, max_restores - restores_used),
        "max_restores_per_month": max_restores,
        "restorable_day": restorable.isoformat() if restorable else None,
        # Only eligible when there is a skippable day AND a restore left.
        "restore_eligible": restorable is not None and (max_restores - restores_used) > 0,
    }


async def restore_skipped_day(
    db: AsyncSession, user_id: uuid.UUID
) -> tuple[dict, str | None]:
    """Back-fill the most recent skipped day. Returns (streak_dict, error)."""
    rows = await _load_rows(db, user_id)
    learned = {row.day for row in rows}
    today = _utc_date()
    restorable = _restorable_day(learned, today)
    max_restores = settings.MAX_STREAK_RESTORES_PER_MONTH
    restores_used = _restores_used_this_month(rows)

    # Guard conditions: without them there is nothing to restore or no
    # budget left, so return the current state plus a human message.
    if restorable is None:
        return await get_streak(db, user_id), "No skipped day to restore."
    if restores_used >= max_restores:
        return await get_streak(db, user_id), "All restores for this month are used up."

    # Splice the skipped day back in, flagged as restored, and re-summarize.
    db.add(
        LearningDay(
            user_id=user_id,
            day=restorable,
            is_restored=True,
            restored_at=datetime.utcnow(),
        )
    )
    await db.commit()
    return await get_streak(db, user_id), None
