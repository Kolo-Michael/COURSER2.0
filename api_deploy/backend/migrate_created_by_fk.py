import asyncio

from sqlalchemy import text

from app.core.database import engine


async def migrate_created_by_fk():
    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'users_created_by_fkey'
                    ) THEN
                        ALTER TABLE users
                        ADD CONSTRAINT users_created_by_fkey
                        FOREIGN KEY (created_by) REFERENCES users(id);
                    END IF;
                END $$;
                """
            )
        )
    print("created_by foreign key is ready.")


if __name__ == "__main__":
    asyncio.run(migrate_created_by_fk())
