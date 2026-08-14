"""Database initialization script.

Starts the schema from scratch with `Base.metadata.create_all` and then runs
idempotent ALTER TABLE migrations that `create_all` can't express (it never
mutates existing tables). Run: `python init_db.py` or with `--reset` to drop
everything first.
"""

import argparse  # CLI flags (--reset)
import asyncio  # async engine/session need an event loop
from app.core.database import engine, Base
# Importing the models registers them on Base.metadata, which is what makes
# create_all/drop_all below aware of every table to build.
from app.models import User, Course, Category, Module, Lesson, Enrollment, LessonProgress, UserSession, Conversation, Message


# Columns added after the original `users` table was created. `create_all`
# only makes new tables — it never alters existing ones — so these are
# applied with idempotent ALTER TABLE statements.
#
# Migration strategy:
#  * Never edit the original CREATE TABLE; ship brand-new columns as
#    ADD COLUMN statements listed here.
#  * Use IF-exists-style tolerance: each statement runs in a try/except and
#    a "duplicate column" error is swallowed, so re-running init_db is safe.
#  * This mirrors a lightweight version of Alembic's auto-generated diffs —
#    enough for a serverless schema that changes rarely.
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
    """Create all database tables.

    With `reset=True`, drop every table first so the schema is rebuilt
    cleanly (destructive — wipes all data, only for fresh/dev databases).
    """
    async with engine.begin() as conn:
        if reset:
            await conn.run_sync(Base.metadata.drop_all)
        # create_all only creates *missing* tables — existing ones are left
        # untouched, so running this on an already-initialized DB is a no-op.
        await conn.run_sync(Base.metadata.create_all)
    # Then bring pre-existing tables up to date with the ALTERs above.
    await migrate_existing_tables()
    print("Database tables created successfully!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize COURSER database tables.")
    parser.add_argument("--reset", action="store_true", help="Drop existing tables before creating them.")
    args = parser.parse_args()
    asyncio.run(init_db(reset=args.reset))