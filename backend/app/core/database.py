from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool

from app.core.config import settings

Base = declarative_base()

# Serverless functions must not hold persistent DB connections across
# invocations — Vercel spins each request in a fresh container, and a
# stale pool would just hit closed sockets. NullPool opens and closes a
# connection per checkout, which is the recommended pattern for
# Vercel Functions + Neon.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG_SQL,
    connect_args=settings.DATABASE_CONNECT_ARGS,
    poolclass=NullPool,
    pool_pre_ping=True,
)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with async_session_maker() as session:
        yield session
