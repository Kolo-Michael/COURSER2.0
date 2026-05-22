import argparse
import asyncio
from app.core.database import engine, Base
from app.models import User, Course, Category, Module, Lesson, Enrollment, UserSession, Conversation, Message


async def init_db(reset: bool = False):
    """Create all database tables."""
    async with engine.begin() as conn:
        if reset:
            await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize COURSER database tables.")
    parser.add_argument("--reset", action="store_true", help="Drop existing tables before creating them.")
    args = parser.parse_args()
    asyncio.run(init_db(reset=args.reset))
