# COURSER 2.0 — Codebase Understanding

> **Keep this file in sync.** Whenever a feature is added or a subsystem changes,
> update the relevant section below and add a dated note to `AGENTS.md`.
>
> For a feature-by-feature walkthrough sorted by complexity (easy → deep),
> see `FEATURES.md`.

COURSER is a learning platform with three codebases sharing one FastAPI backend:

| Codebase | Stack | Root | Notes |
| --- | --- | --- | --- |
| Web frontend | React 19, Vite 6, TypeScript, Tailwind 3, react-router-dom 7 | `frontend/` | `@` alias → `src`; build = `tsc -b && vite build` |
| Backend API | FastAPI, SQLAlchemy 2 (async), SQLite local / Postgres prod | `backend/` | Cookie + Bearer auth; `/api` prefix |
| Mobile app | Flutter (Dart) | `mobile/` | Android/iOS client against the same API |

---

## Web frontend (`frontend/`)

### Structure
- `src/main.tsx` — entry, mounts `<App/>` inside theme provider.
- `src/App.tsx` — router: public routes (landing, courses, course detail, auth,
  dashboard, admin, super-admin, settings) wrapped in `ProtectedRoute` /
  `RoleRoute`; `/settings` is available to every role.
- `src/index.css` — Tailwind directives, `.courser-card`, `.courser-glass`,
  `.courser-bg-dots`, `.courser-bg-dots-dense`; flat body surfaces (no color
  gradients) for light (`#F7F6F4`) and dark (`#0C0A09`).
- `tailwind.config.js` — theme colors: `primary` (#2563EB / dark #3B82F6),
  `accent` (#F97316 / dark #FB923C). Dark mode via `class` strategy.

### Auth & session
- Cookie-based. Backend sets `access_token`/`refresh_token` (HttpOnly) and
  `courser_session` (readable JSON, URL-encoded) with id, identifier, email,
  fullName, role, avatarUrl, navStyle, navCollapsed.
- `src/auth/session.ts` — `getSession()` parses `courser_session` (handles
  URL-encoding + legacy octal escapes); `clearSession()` wipes all COURSER
  cookies + legacy localStorage key.
- `src/auth/preferences.ts` — nav style / collapsed prefs (localStorage +
  fire-and-forget `PATCH /auth/me`).

### API layer
- `src/api/client.ts` — `apiRequest()` (fetch wrapper, `credentials: 'include'`,
  returns `undefined` on 204).
- `src/api/auth.ts` — login/logout/me/profile/change-password.
- `src/api/courses.ts` — catalog, course detail (with per-lesson progress),
  enrollments, enroll, restart, complete/update lesson progress, `askCora`
  (AI tutor), `getCourseConversation` (chat history).
- `src/api/streak.ts` — streak + restore-day.

### Pages & layout
- `src/components/layout/DashboardLayout.tsx` — role dashboard shell. Supports
  **sidebar** (desktop-collapsible to icon-only; mobile hamburger overlay) and
  **floating** nav (FAB bottom-left with glass panel). Streak + Settings gear in
  the top bar.
 - `src/pages/DashboardPage.tsx` — real stats from enrollments: enrolled,
   completed, lessons done, avg progress; continue-learning cards with restart.
   Also surfaces the `CourseWorkspacePanel` for the learner's most-advanced
   in-progress enrollment (full course detail fetched on demand), so the
   lesson reader + Cora stay usable directly from the dashboard; injects a
   "Course workspace" sidebar entry pointing at the last-open course.
  - `src/components/course/CourseWorkspacePanel.tsx` (+ `lessonNotes.tsx`) —
    the shared lesson workspace (rendered by `CourseDetailPage` and embedded on
    the dashboard). Reading-first layout: a one-module **focus view** stacked
    above the lesson — only the module containing the active lesson is shown
    (heading "Module N of M" + title + its lessons), with **Previous module /
    Next module** controls; lesson prev/next are scoped within the module and
    the reading pane offers "Next module" when the lesson list is exhausted.
    The module banner is `sticky top-0`; `LessonNotes` (`parseNotes` →
    `NoteBody`/`LessonNotes` turns `##`/`-`/`*` text into sections with Key
    takeaways / Check your understanding callouts), lesson-completion chip +
    "Lesson X of Y" + mark-complete (updates local + enrollment totals),
    personal notes in localStorage, and the Cora Q&A sidebar — `lg:sticky`
    pinned to the right of the lesson, fixed-height with a scrollable
    transcript + always-visible input so it stays put while the learner
    scrolls. Restores the user's persisted Cora conversation history on mount.
 - `src/auth/course.ts` — last-course slug tracker (localStorage) so the
   dashboard can surface a "Continue where you left off" workspace entry.
 - `src/pages/CourseDetailPage.tsx` — course header card (enroll/restart/progress),
   then delegates the lesson workspace to `CourseWorkspacePanel`.
- `src/pages/DashboardPage.tsx` — real stats from enrollments: enrolled,
  completed, lessons done, avg progress; continue-learning cards with restart.
- `src/pages/SettingsPage.tsx` — categorized settings: Profile (avatar upload),
  Navigation (sidebar vs floating + collapsed default), Security (change
  password), Account (read-only + sign out).
- `src/pages/StreakPage.tsx` — real streak data + restore.
- Public pages: `LandingPage`, `CoursesPage`, `CourseDetailPage`, `AuthPage`
  (`LoginForm`/`SignupForm`), `SiteHeader`.

---

## Backend API (`backend/`)

### Structure
- `app/main.py` — FastAPI app, CORS (includes localhost + Render origins), `/api`
  router prefix, health endpoint.
- `app/core/config.py` — env loading (`.env` then `.env.local` overrides),
  settings.
- `app/core/security.py` — `get_access_token()` reads `Authorization: Bearer`
  first, falls back to cookie.
- `app/models/` — `user.py` (User incl. avatar_url, nav_style, nav_collapsed),
  `course.py` (Course, Module, Lesson, Enrollment, **LessonProgress**).
- `app/api/` — `auth.py` (signup/login/logout/me/change-password),
  `courses.py` (catalog, enrollments, enroll, restart, **Cora Q&A**),
  `lessons.py` (per-user progress persistence + course progress recompute),
  `users.py`, `admin.py`, `super_admin.py`.
- `app/services/` — `ai_service.py` (retrieval-augmented course Q&A):
  lesson notes are scored lexically against the question, top chunks are
  injected into an OpenAI-compatible `/chat/completions` prompt, and every
  turn is persisted on a per-(user, course) `Conversation`. Degrades to a
  canned reply when `OPENAI_API_KEY` is unset.
- `app/schemas/` — Pydantic request/response models.

### Data layer
- SQLAlchemy 2 async. Local: `sqlite+aiosqlite:///./courser_local.db` via
  `.env.local`. Prod: Postgres (Neon) via `.env`.
- No Alembic. Schema + migrations live in `backend/init_db.py`
  (`create_all` + idempotent ALTER TABLE list `_USER_MIGRATION_COLUMNS`).
  Reseed with `python seed_courses.py` (6 courses / 18 lessons).

### Progress model
- `LessonProgress` — per (user, lesson) row: progress 0–100, is_completed,
  quiz_score, completed_at; unique `uq_user_lesson_progress`.
- `POST /lessons/{id}/complete` → progress 100 + learning-day record.
- `PATCH /lessons/{id}/progress` → persist progress (+ optional quiz score);
  ≥50% records a learning day.
- Enrollment `progress` = average lesson progress; `completed_at` set when 100%.
- `GET /courses/enrollments/me` → real counts (completed/total lessons).
- `POST /courses/slug/{slug}/restart` → deletes LessonProgress + zeroes the
  enrollment.
- `GET /courses/slug/{slug}` attaches per-lesson progress when authenticated.

### Auth endpoints
- `PATCH /auth/me` — profile/settings update, refreshes session cookie.
- `POST /auth/change-password` — verifies current bcrypt hash, rehashes, resets
  lockout counters.

### Cora AI tutor
- `GET  /courses/slug/{slug}/conversation` — the current user's chat history
  for a course (oldest first; `[]` when no thread exists yet).
- `POST /courses/slug/{slug}/ask` — real RAG flow (see `ai_service.py`);
  persists the user question + assistant answer, returns just `{answer}`.
- Models: `Conversation` (one per user+course) and `Message` (role+content
  turns) already existed; they are created/read by `ai_service` and exposed
  through `courses.py`.
- Config: `OPENAI_API_KEY`, `OPENAI_BASE_URL` (default `https://api.openai.com/v1`),
  `OPENAI_MODEL` (default `gpt-4o-mini`). `httpx` added to `requirements.txt`.

---

## Mobile app (`mobile/`)

- `lib/core/config.dart` — API base URL resolution: release → Render prod,
  debug → 127.0.0.1 / 10.0.2.2 emulator; AVD-name emulator detection
  (override via `--dart-define=COURSER_EMULATOR`, URL via
  `--dart-define=COURSER_API_URL`).
- `lib/core/storage.dart` — `SecureStore`: onboarding progress, session.
- `lib/app.dart` — provider wiring (`AuthState`, `CoursesState`).
- `lib/screens/onboarding_screen.dart` — resumed onboarding, then `/login`.
- Sends `Authorization: Bearer` tokens to the API.

---

## Student Problem Questionnaire (DOCX)

A new research instrument for the dissertation, focused on **student problems and experiences** on the learning platform:

- **File:** `Student_Problem_Questionnaire.docx`
- **Design:** 54 questions across 10 sections (demographics, platform usage, course experience, academic support, peer interaction, assessment, motivation, accessibility, improvement suggestions, and additional comments)
- **Research frameworks:** Self-Determination Theory, Constructive Alignment, Learner Centric Design, Accessibility in Higher Education, Student Engagement, Learning Analytics, Technology-Enhanced Learning, Social Cognitive Theory
- **Use:** Data collection for dissertation analysis; identify patterns in student problems to inform platform improvements