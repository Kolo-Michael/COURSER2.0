"""
One-shot schema migration: convert every UUID-typed column in the public
schema from `character varying` to `uuid`.

Background
----------
An early deploy of COURSER landed a schema where every column declared as
`UUID(as_uuid=True)` in `app/models/*.py` was actually created on the
database as `character varying`. SQLAlchemy then generates queries like
`WHERE users.id = $1::UUID` on read, which Postgres rejects because the
column on disk is varchar — no `varchar = uuid` operator exists. Inserts
worked because the implicit cast from uuid → varchar exists; reads did not.

This script fixes the drift in three phases, in a single transaction so
the migration is all-or-nothing:

  1. Drop every FK that references a column we're about to retype. Postgres
     validates the column type against the FK on ALTER, so the FK has to be
     gone before we touch the columns.
  2. ALTER every offending column from `character varying` to `uuid` using
     `USING column::uuid` (safe because every value is a UUID string).
  3. Re-add the FKs against the freshly-typed columns.

The script is idempotent: each phase checks for existence first and skips
work that's already done. Re-running is safe.

Run from `backend/`:

    python migrate_uuid_columns.py

The DATABASE_URL must point at the target database. After it finishes,
`init_db.py` becomes a no-op (the schema already matches the model).
"""

import asyncio

from sqlalchemy import text

from app.core.database import engine


# (table, column) pairs that should be uuid. Ordered so parents come before
# children — convention only, not strict requirement for the ALTER.
COLUMNS = [
    ("users", "id"),
    ("users", "created_by"),
    ("categories", "id"),
    ("courses", "id"),
    ("courses", "category_id"),
    ("courses", "instructor_id"),
    ("modules", "id"),
    ("modules", "course_id"),
    ("lessons", "id"),
    ("lessons", "module_id"),
    ("enrollments", "id"),
    ("enrollments", "user_id"),
    ("enrollments", "course_id"),
    ("user_sessions", "id"),
    ("user_sessions", "user_id"),
    ("conversations", "id"),
    ("conversations", "user_id"),
    ("messages", "id"),
    ("messages", "conversation_id"),
]

# FK constraints to drop in phase 1 and re-add in phase 3. The shape is the
# same as the existing FK definitions on the database — column lists and
# ON DELETE clauses are preserved exactly.
FOREIGN_KEYS = [
    {
        "name": "conversations_user_id_fkey",
        "table": "conversations",
        "columns": ["user_id"],
        "referenced_table": "users",
        "referenced_columns": ["id"],
        "on_delete": "CASCADE",
    },
    {
        "name": "courses_category_id_fkey",
        "table": "courses",
        "columns": ["category_id"],
        "referenced_table": "categories",
        "referenced_columns": ["id"],
        "on_delete": None,
    },
    {
        "name": "courses_instructor_id_fkey",
        "table": "courses",
        "columns": ["instructor_id"],
        "referenced_table": "users",
        "referenced_columns": ["id"],
        "on_delete": None,
    },
    {
        "name": "enrollments_course_id_fkey",
        "table": "enrollments",
        "columns": ["course_id"],
        "referenced_table": "courses",
        "referenced_columns": ["id"],
        "on_delete": "CASCADE",
    },
    {
        "name": "enrollments_user_id_fkey",
        "table": "enrollments",
        "columns": ["user_id"],
        "referenced_table": "users",
        "referenced_columns": ["id"],
        "on_delete": "CASCADE",
    },
    {
        "name": "lessons_module_id_fkey",
        "table": "lessons",
        "columns": ["module_id"],
        "referenced_table": "modules",
        "referenced_columns": ["id"],
        "on_delete": "CASCADE",
    },
    {
        "name": "messages_conversation_id_fkey",
        "table": "messages",
        "columns": ["conversation_id"],
        "referenced_table": "conversations",
        "referenced_columns": ["id"],
        "on_delete": "CASCADE",
    },
    {
        "name": "modules_course_id_fkey",
        "table": "modules",
        "columns": ["course_id"],
        "referenced_table": "courses",
        "referenced_columns": ["id"],
        "on_delete": "CASCADE",
    },
    {
        "name": "user_sessions_user_id_fkey",
        "table": "user_sessions",
        "columns": ["user_id"],
        "referenced_table": "users",
        "referenced_columns": ["id"],
        "on_delete": "CASCADE",
    },
]


async def column_is_varchar(conn, table: str, column: str) -> bool:
    result = await conn.execute(
        text(
            """
            select data_type
            from information_schema.columns
            where table_schema = 'public'
              and table_name = :table
              and column_name = :column
            """
        ),
        {"table": table, "column": column},
    )
    row = result.first()
    return row is not None and row[0] == "character varying"


async def constraint_exists(conn, name: str) -> bool:
    result = await conn.execute(
        text("select 1 from pg_constraint where conname = :name"),
        {"name": name},
    )
    return result.first() is not None


async def migrate():
    async with engine.begin() as conn:
        # Phase 1: drop every FK that references a column we're about to
        # retype. Postgres revalidates FKs on column type change, and the
        # revalidation will fail if the FK still points at a varchar column
        # while the source has just become uuid.
        print("phase 1: drop foreign keys")
        for fk in FOREIGN_KEYS:
            if await constraint_exists(conn, fk["name"]):
                await conn.execute(
                    text(f'ALTER TABLE {fk["table"]} DROP CONSTRAINT {fk["name"]}')
                )
                print(f"  drop fk {fk['name']}")
            else:
                print(f"  skip fk {fk['name']} (already gone)")

        # Phase 2: ALTER every offending column. USING column::uuid is safe
        # because every value in the column is a UUID string (either a
        # uuid.uuid4() from the app, a hard-coded fixture from
        # seed_courses.py, or the value written by an earlier deploy that
        # used the same model). If a row had a non-UUID string the ALTER
        # would raise and the whole transaction would roll back.
        print("phase 2: alter columns to uuid")
        for table, column in COLUMNS:
            if not await column_is_varchar(conn, table, column):
                print(f"  skip {table}.{column} (already uuid or missing)")
                continue
            await conn.execute(
                text(
                    f"ALTER TABLE {table} ALTER COLUMN {column} "
                    f"TYPE uuid USING {column}::uuid"
                )
            )
            print(f"  alter {table}.{column} -> uuid")

        # Phase 3: re-add the FKs against the freshly-typed columns.
        print("phase 3: re-add foreign keys")
        for fk in FOREIGN_KEYS:
            cols = ", ".join(fk["columns"])
            ref_cols = ", ".join(fk["referenced_columns"])
            on_delete = f" ON DELETE {fk['on_delete']}" if fk["on_delete"] else ""
            await conn.execute(
                text(
                    f"ALTER TABLE {fk['table']} ADD CONSTRAINT {fk['name']} "
                    f"FOREIGN KEY ({cols}) REFERENCES {fk['referenced_table']} "
                    f"({ref_cols}){on_delete}"
                )
            )
            print(f"  add fk {fk['name']} ({fk['table']}.{cols} -> {fk['referenced_table']}.{ref_cols})")

    print("UUID column migration complete.")


if __name__ == "__main__":
    asyncio.run(migrate())
