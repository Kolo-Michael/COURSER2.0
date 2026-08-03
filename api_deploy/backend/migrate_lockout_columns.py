"""
One-shot schema migration: add `failed_login_attempts` and `locked_until`
columns to the `users` table on the live Neon database.

Background
----------
The `User` model was updated to declare brute-force defense columns
(`failed_login_attempts int default 0`, `locked_until datetime nullable`).
`SQLAlchemy.create_all()` is idempotent and won't add new columns to a
table that already exists — so the Neon DB still lacks these columns and
any query touching `User.failed_login_attempts` raises
`column users.failed_login_attempts does not exist`.

This script adds both columns in a single transaction, idempotently.
Re-running is safe.

Run from `backend/`:

    python migrate_lockout_columns.py

The DATABASE_URL must point at the target database.
"""

import asyncio

from sqlalchemy import text

from app.core.database import engine


COLUMNS = [
    {
        "name": "failed_login_attempts",
        "definition": "ALTER TABLE users ADD COLUMN failed_login_attempts integer NOT NULL DEFAULT 0",
    },
    {
        "name": "locked_until",
        "definition": "ALTER TABLE users ADD COLUMN locked_until timestamp NULL",
    },
]


async def column_exists(conn, name: str) -> bool:
    result = await conn.execute(
        text(
            """
            select 1
            from information_schema.columns
            where table_schema = 'public'
              and table_name = 'users'
              and column_name = :name
            """
        ),
        {"name": name},
    )
    return result.first() is not None


async def migrate():
    async with engine.begin() as conn:
        for col in COLUMNS:
            if await column_exists(conn, col["name"]):
                print(f"  skip {col['name']} (already present)")
                continue
            await conn.execute(text(col["definition"]))
            print(f"  + added {col['name']}")
    print("lockout-column migration complete.")


if __name__ == "__main__":
    asyncio.run(migrate())