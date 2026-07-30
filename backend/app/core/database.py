from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.core.config import settings

Base = declarative_base()

# A pooled engine is the right shape for long-lived workers (uvicorn on
# Render, Fly, or your laptop): connections are reused across requests,
# which keeps Neon's pooler warm and avoids a multi-second TLS handshake
# on every checkout. `pool_pre_ping` cheaply verifies a pooled connection
# is still alive before handing it to a request, and `pool_recycle`
# proactively replaces connections older than Neon's pooler idle timeout
# (Neon closes idle pooler connections after ~5 minutes).
#
# `NullPool` was tried earlier under the Vercel-Functions deploy, where
# each request ran in a fresh container and a stale pool would only hold
# closed sockets. We no longer deploy that way; the new default is the
# standard async-adapted queue pool.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG_SQL,
    connect_args=settings.DATABASE_CONNECT_ARGS,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=180,
)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with async_session_maker() as session:
        yield session
