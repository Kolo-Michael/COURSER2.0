"""Cora AI tutor — retrieval-augmented Q&A over the course's study notes.

Two stages:
  1. Retrieval — load every lesson in a course and rank them against the
     user's question by term overlap (cheap lexical scoring, no embedding
     infrastructure), then take the best few as context.
  2. Generation — one call to an OpenAI-compatible `/chat/completions`
     endpoint (works with OpenAI, Groq, OpenRouter, local vLLM, ...). The
     retrieved notes are pinned into the system prompt so the answer is
     grounded in the actual course material.

Degradation: with no `OPENAI_API_KEY` set the service returns a canned
reply instead of erroring, so the chat UI keeps working during setup.

Config env vars (all OpenAI-compatible, works with Groq out of the box):
  * OPENAI_API_KEY  — API key for the chat model (required for real answers)
  * OPENAI_BASE_URL — provider base URL, default https://api.groq.com/openai/v1
  * OPENAI_MODEL    — model id, default llama-3.3-70b-versatile
"""

from __future__ import annotations

import os
import re
from collections import Counter
from typing import List, Tuple

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Conversation, Lesson, Message, Module


# --- LLM provider configuration ------------------------------------------


def _env_key(name: str, default: str = "") -> str:
    """Read an env var once per call — cheap enough for a chat endpoint."""
    return os.getenv(name, default)


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "llama-3.3-70b-versatile")
# Each chat request waits up to 30s for the model to finish replying.
LLM_TIMEOUT_SECONDS = 30
# How many lesson chunks (of the whole course) get injected as context.
TOP_K_CHUNKS = 4

# Ask words that carry no retrieval signal — excluded from the keyword score.
_STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "do", "does", "did",
    "what", "which", "how", "why", "when", "where", "who", "can", "could",
    "i", "me", "my", "we", "you", "your", "it", "its", "this", "that",
    "about", "explain", "tell", "mean", "meant", "help", "please", "for", "to",
}

# Message shown when the LLM isn't configured yet — keeps the UI functional.
FALLBACK_REPLY = (
    "Cora's AI tutor isn't connected yet — set the OPENAI_API_KEY on the "
    "backend and this answer becomes a real, notes-grounded reply."
)


# --- helper: build the system prompt ------------------------------------


def _build_system_prompt(course_title: str, context: List[Tuple[str, str]]) -> str:
    """Compose the system prompt with the retrieved lesson notes.

    Each lesson becomes a `## <lesson title>` section followed by its study
    notes, so the model answers strictly from the course material.
    """
    sections = []
    for title, content in context:
        sections.append(f"## {title}\n{content}")
    context_block = "\n\n".join(sections) if sections else "(no course content available)"
    return (
        "You are Cora, the friendly study companion inside the Courser "
        f"learning platform, helping with the course \"{course_title}\".\n\n"
        "Answer the user's question using ONLY the course notes below. If the "
        "notes do not cover the question, say so plainly and suggest where in "
        "the course it is covered. Keep answers clear, warm, and under 200 "
        "words. Use short paragraphs and bullet points when helpful.\n\n"
        f"COURSE NOTES:\n{context_block}"
    )


# --- stage 1: lexical retrieval over lesson notes -----------------------


def _tokenize(text: str) -> List[str]:
    """Lowercase word tokens — punctuation, headings, and bullets ignored."""
    return re.findall(r"[a-z0-9]+", text.lower())


def _score_chunk(question_terms: Counter, title: str, content: str) -> int:
    """Score one lesson by how often the question's terms appear in it.

    Terms are counted per lesson, so a term that appears several times in a
    lesson scores higher than a single mention — a simple, dependency-free
    substitute for TF scoring.
    """
    lesson_terms = Counter(_tokenize(f"{title} {content}"))
    return sum(lesson_terms.get(term, 0) for term in question_terms)


async def retrieve_context(
    db: AsyncSession,
    course_id: object,
    question: str,
    top_k: int = TOP_K_CHUNKS,
) -> List[Tuple[str, str]]:
    """Rank the course's lessons against `question`; return the best chunks.

    Every published lesson is one chunk — its title leading its study notes.
    Lessons without notes still participate (their short content is indexed).
    """
    result = await db.execute(
        select(Lesson.title, Lesson.content)
        .join(Module, Lesson.module_id == Module.id)
        .where(Module.course_id == course_id, Lesson.is_published.is_(True))
        .order_by(Module.order, Lesson.order)
    )
    rows = result.all()
    if not rows:
        return []

    # Terms that actually matter for matching, minus stopwords.
    query_terms = Counter(
        term for term in _tokenize(question) if term not in _STOPWORDS
    )

    chunks = [
        (title, content or "(this lesson has no written notes yet)")
        for title, content in rows
    ]
    # Sort by descending score, keep the top `k` lessons as context.
    scored = sorted(chunks, key=lambda chunk: _score_chunk(query_terms, *chunk), reverse=True)
    return scored[:top_k]


# --- stage 2: LLM generation --------------------------------------------


async def generate_answer(question: str, context: List[Tuple[str, str]], course_title: str) -> str:
    """Call the chat model and return its answer text.

    Raises RuntimeError if no API key is configured and httpx.HTTPError on
    provider failures — the caller catches these to degrade gracefully.
    """
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    payload = {
        "model": OPENAI_MODEL,
        "messages": [
            {"role": "system", "content": _build_system_prompt(course_title, context)},
            {"role": "user", "content": question},
        ],
        "temperature": 0.3,
        "max_tokens": 400,
    }
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=LLM_TIMEOUT_SECONDS) as client:
        response = await client.post(f"{OPENAI_BASE_URL}/chat/completions", json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()


# --- conversation persistence helpers ------------------------------------


async def get_or_create_conversation(
    db: AsyncSession,
    user_id: object,
    course_id: object,
    course_title: str,
) -> Conversation:
    """Return the user's existing conversation for this course, or create it.

    One conversation per (user, course): new questions append to the same
    thread instead of spawning chats all over the dashboard.
    """
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id, Conversation.course_id == course_id)
        .order_by(Conversation.updated_at.desc())
    )
    conversation = result.scalars().first()
    if conversation is None:
        conversation = Conversation(
            user_id=user_id,
            course_id=course_id,
            title=course_title,
        )
        db.add(conversation)
        await db.flush()
    return conversation


async def create_conversation(
    db: AsyncSession,
    user_id: object,
    course_id: object,
    course_title: str,
    first_question: str,
) -> Conversation:
    """Start a brand-new chat thread for this (user, course).

    The chat's title is derived from the first question so the chat list
    shows a useful label before the learner renames it. Unlike
    `get_or_create_conversation`, this always creates a fresh row.
    """
    conversation = Conversation(
        user_id=user_id,
        course_id=course_id,
        title=first_question[:80],
    )
    db.add(conversation)
    await db.flush()
    # Persist the opening user turn immediately so the thread is non-empty.
    await append_message(db, conversation.id, "user", first_question)
    return conversation


async def find_owned_conversation(
    db: AsyncSession,
    user_id: object,
    conversation_id: object,
) -> Conversation | None:
    """Look up a conversation, scoped to the current user (ownership check).

    Returns None when the conversation doesn't exist or belongs to another
    user, so the API can 404 without leaking another user's thread id.
    """
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
    )
    return result.scalars().first()


async def append_message(
    db: AsyncSession,
    conversation_id: object,
    role: str,
    content: str,
) -> Message:
    """Persist a single (role, content) turn onto a conversation."""
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
    )
    db.add(message)
    await db.flush()
    return message


# --- orchestration -------------------------------------------------------


async def answer_course_question(
    db: AsyncSession,
    user_id: object,
    course_id: object,
    course_title: str,
    question: str,
    conversation_id: object | None = None,
) -> Tuple[str, bool, Conversation]:
    """Run the full ask flow and persist every turn.

    When `conversation_id` is given the question is appended to that chat
    (the caller is responsible for the ownership check); otherwise a new
    conversation is created. Returns (answer_text, used_ai, conversation)
    where used_ai=False means the fallback reply was returned because the
    LLM wasn't reachable.
    """
    if conversation_id is not None:
        conversation = await find_owned_conversation(db, user_id, conversation_id)
        if conversation is None:
            raise RuntimeError("conversation not found or not owned by user")
        await append_message(db, conversation.id, "user", question)
    else:
        conversation = await create_conversation(
            db, user_id, course_id, course_title, question
        )

    # Retrieve notes, then try the model; on any failure keep the canned
    # reply (message is still persisted so history stays consistent).
    context = await retrieve_context(db, course_id, question)
    try:
        answer = await generate_answer(question, context, course_title)
        used_ai = True
    except Exception:
        answer = FALLBACK_REPLY
        used_ai = False

    await append_message(db, conversation.id, "assistant", answer)
    return answer, used_ai, conversation