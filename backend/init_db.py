import argparse
import asyncio
from app.core.database import engine, Base
from app.models import User, Course, Category, Module, Lesson, Enrollment, LessonProgress, UserSession, Conversation, Message


# Columns added after the original `users` table was created. `create_all`
# only makes new tables — it never alters existing ones — so these are
# applied with idempotent ALTER TABLE statements.
_USER_MIGRATION_COLUMNS = [
    "ALTER TABLE users ADD COLUMN avatar_url TEXT",
    "ALTER TABLE users ADD COLUMN nav_style VARCHAR(20) DEFAULT 'sidebar' NOT NULL",
    "ALTER TABLE users ADD COLUMN nav_collapsed BOOLEAN DEFAULT false NOT NULL",
]


async def migrate_existing_tables() -> None:
    """Add missing columns to pre-existing tables (idempotent)."""
    async with engine.begin() as conn:
        for statement in _USER_MIGRATION_COLUMNS:
            try:
                await conn.exec_driver_sql(statement)
            except Exception:
                # Column already exists (duplicate column) — safe to ignore.
                pass


async def init_db(reset: bool = False):
    """Create all database tables."""
    async with engine.begin() as conn:
        if reset:
            await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    await migrate_existing_tables()
    print("Database tables created successfully!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize COURSER database tables.")
    parser.add_argument("--reset", action="store_true", help="Drop existing tables before creating them.")
    args = parser.parse_args()
    asyncio.run(init_db(reset=args.reset))
