/**
 * Database schema — mirrors the SQLAlchemy models in backend/app/models/*.py
 * (backend/init_db.py + the migrate_*.py one-shots rolled into one place).
 *
 * `CREATE TABLE IF NOT EXISTS` handles new databases; `ALTER TABLE ... ADD
 * COLUMN IF NOT EXISTS` (and idempotent FK guards) bring pre-existing tables
 * up to date. Safe to run against an already-provisioned Neon database.
 */

export const CREATE_TABLES: string[] = [
  // --- identity / auth ----------------------------------------------------
  `CREATE TABLE IF NOT EXISTS users (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     username varchar(50) NOT NULL UNIQUE,
     email varchar(100) NOT NULL UNIQUE,
     hashed_password varchar(255) NOT NULL,
     full_name varchar(100),
     role varchar(20) NOT NULL DEFAULT 'student',
     is_active boolean DEFAULT true,
     is_verified boolean DEFAULT false,
     created_by uuid REFERENCES users(id),
     created_at timestamp DEFAULT now(),
     updated_at timestamp DEFAULT now(),
     last_login timestamp,
     failed_login_attempts integer NOT NULL DEFAULT 0,
     locked_until timestamp,
     avatar_url text,
     nav_style varchar(20) NOT NULL DEFAULT 'sidebar',
     nav_collapsed boolean NOT NULL DEFAULT false
   )`,

  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid NOT NULL REFERENCES users(id),
     code varchar(6) NOT NULL,
     attempts integer NOT NULL DEFAULT 0,
     expires_at timestamp NOT NULL,
     created_at timestamp DEFAULT now()
   )`,

  `CREATE TABLE IF NOT EXISTS email_verifications (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     code varchar(6) NOT NULL,
     attempts integer NOT NULL DEFAULT 0,
     expires_at timestamp NOT NULL,
     created_at timestamp DEFAULT now()
   )`,

  `CREATE TABLE IF NOT EXISTS user_sessions (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     refresh_token varchar(500) NOT NULL UNIQUE,
     expires_at timestamp NOT NULL,
     is_revoked boolean NOT NULL DEFAULT false,
     created_at timestamp NOT NULL DEFAULT now(),
     last_used timestamp NOT NULL DEFAULT now()
   )`,

  // --- catalog -------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS categories (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     name varchar(100) NOT NULL UNIQUE,
     slug varchar(100) NOT NULL UNIQUE,
     description text,
     icon varchar(50),
     created_at timestamp DEFAULT now()
   )`,

  `CREATE TABLE IF NOT EXISTS courses (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     title varchar(200) NOT NULL,
     slug varchar(200) NOT NULL UNIQUE,
     description text,
     short_description varchar(500),
     level varchar(20) NOT NULL DEFAULT 'beginner',
     duration varchar(50),
     price double precision DEFAULT 0,
     is_published boolean DEFAULT false,
     is_featured boolean DEFAULT false,
     is_ai_generated boolean DEFAULT false,
     image_url text,
     category_id uuid REFERENCES categories(id),
     instructor_id uuid REFERENCES users(id),
     created_at timestamp DEFAULT now(),
     updated_at timestamp DEFAULT now()
   )`,

`CREATE TABLE IF NOT EXISTS modules (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
     title varchar(200) NOT NULL,
     description text,
     "order" integer NOT NULL DEFAULT 0,
     quiz jsonb,
     created_at timestamp DEFAULT now()
    )`,

`CREATE TABLE IF NOT EXISTS lessons (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
     title varchar(200) NOT NULL,
     content text,
     video_url varchar(500),
     duration varchar(50),
     "order" integer NOT NULL DEFAULT 0,
     is_published boolean DEFAULT false,
     resource_links jsonb,
     quiz jsonb,
     created_at timestamp DEFAULT now()
    )`,

  `CREATE TABLE IF NOT EXISTS lesson_resources (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
     source varchar(50) NOT NULL,
     title varchar(200) NOT NULL,
     url text NOT NULL,
     license varchar(50),
     body text,
     fetched_at timestamp DEFAULT now()
    )`,

  // --- progress / engagement ----------------------------------------------
  `CREATE TABLE IF NOT EXISTS enrollments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      enrolled_at timestamp DEFAULT now(),
      completed_at timestamp,
      progress double precision DEFAULT 0,
      skill_level varchar(20) DEFAULT 'beginner',
      learning_goal text
    )`,

`CREATE TABLE IF NOT EXISTS lesson_progress (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
     progress double precision NOT NULL DEFAULT 0,
     is_completed boolean NOT NULL DEFAULT false,
     quiz_score double precision,
     completed_at timestamp,
     updated_at timestamp DEFAULT now(),
     CONSTRAINT uq_user_lesson_progress UNIQUE (user_id, lesson_id)
    )`,

  `CREATE TABLE IF NOT EXISTS quiz_results (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     module_id uuid REFERENCES modules(id) ON DELETE CASCADE,
     lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
     score double precision NOT NULL,
     passed boolean NOT NULL DEFAULT false,
     total_questions integer NOT NULL DEFAULT 0,
     created_at timestamp DEFAULT now()
    )`,

  `CREATE TABLE IF NOT EXISTS learning_days (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     day date NOT NULL,
     is_restored boolean NOT NULL DEFAULT false,
     restored_at timestamp,
     created_at timestamp NOT NULL DEFAULT now(),
     CONSTRAINT uq_user_learning_day UNIQUE (user_id, day)
   )`,

  // --- Cora chat -----------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS conversations (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     title varchar(200),
     course_id uuid REFERENCES courses(id),
     created_at timestamp DEFAULT now(),
     updated_at timestamp DEFAULT now()
   )`,

  `CREATE TABLE IF NOT EXISTS messages (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
     role varchar(20) NOT NULL,
     content text NOT NULL,
     created_at timestamp DEFAULT now()
   )`,
];

/**
 * Idempotent migrations for tables that predate later columns/constraints.
 * ADD COLUMN IF NOT EXISTS is a no-op when the column already exists.
 */
export const MIGRATIONS: string[] = [
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS nav_style varchar(20) NOT NULL DEFAULT 'sidebar'",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS nav_collapsed boolean NOT NULL DEFAULT false",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts integer NOT NULL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until timestamp",
  "ALTER TABLE lessons ADD COLUMN IF NOT EXISTS resource_links jsonb",
  "ALTER TABLE modules ADD COLUMN IF NOT EXISTS quiz jsonb",
  "ALTER TABLE lessons ADD COLUMN IF NOT EXISTS quiz jsonb",
  "ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS lesson_id uuid REFERENCES lessons(id)",
  // Lesson quizzes insert results without a module_id — allow the column to be empty.
  "ALTER TABLE quiz_results ALTER COLUMN module_id DROP NOT NULL",
  "ALTER TABLE courses ADD COLUMN IF NOT EXISTS image_url text",
  "ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS skill_level varchar(20) DEFAULT 'beginner'",
  "ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS learning_goal text",
  // Self-referential created_by FK (was shipped in migrate_created_by_fk.py).
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'users_created_by_fkey'
     ) THEN
       ALTER TABLE users ADD CONSTRAINT users_created_by_fkey
         FOREIGN KEY (created_by) REFERENCES users(id);
     END IF;
   END $$;`,
];

/** Drop order matters — children before parents (only used with --reset). */
export const DROP_TABLES: string[] = [
  "messages",
  "conversations",
  "lesson_resources",
  "quiz_results",
  "learning_days",
  "lesson_progress",
  "enrollments",
  "lessons",
  "modules",
  "courses",
  "categories",
  "user_sessions",
  "password_reset_tokens",
  "email_verifications",
  "users",
];