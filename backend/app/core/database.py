"""Async SQLAlchemy engine + session factory.

Builds a single async engine from the configured DATABASE_URL, declares the
SQLAlchemy `Base` that every model inherits from, and exposes `get_db`, the
FastAPI dependency that yields one session per request.
"""

# Async engine/session support: engine runs raw SQL, sessionmaker creates
# request-scoped sessions, create_async_engine wraps the async driver.
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base  # Base class all models inherit from
from sqlalchemy.pool import NullPool  # no connection pooling — one conn per request

from app.core.config import settings

Base = declarative_base()

# Vercel Functions are serverless — each request runs in a fresh container,
# so a persistent pool would only ever hold sockets from a dead process.
# NullPool creates and tears down one connection per request and lets
# Neon's pooler absorb the handshake cost; that is the right shape for
# per-request cold starts. (A pooled engine was used under long-lived
# uvicorn workers on Render — that deploy is gone.)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG_SQL,
    connect_args=settings.DATABASE_CONNECT_ARGS,
    poolclass=NullPool,
)
# `expire_on_commit=False` keeps attribute values usable after commit,
# so code can return a model right after committing without reloading it.
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    """FastAPI dependency: yield a session for the request, close on exit."""
    async with async_session_maker() as session:
        yield session
