"""Newsletter subscribe endpoint.

Wired to the footer's Subscribe form (see SiteFooter.tsx). For now we
just validate the email shape (Pydantic does this) and log to stdout
— there's no persistence yet, so the wire format won't break when a
table is added to Neon later.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter

from app.schemas.course import NewsletterSubscribe  # Pydantic-validates the email

router = APIRouter()

# Logger with a namespaced name so it's easy to filter in log shipping.
logger = logging.getLogger("courser.newsletter")


@router.post("/subscribe")
async def subscribe(payload: NewsletterSubscribe):
    """Accept an email and log it. Returns `{ ok: true, message: "..." }`.

    Persistence can be added without changing this contract."""
    logger.info("newsletter subscribe: %s", payload.email)
    return {"ok": True, "message": "Subscribed."}
