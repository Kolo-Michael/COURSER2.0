# COURSER 2.0 — Codebase Understanding

> **Keep this file in sync.** Whenever a feature is added or a subsystem changes,
> update the relevant section below and add a dated note to `AGENTS.md`.

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
  enrollments, enroll, restart, complete/update lesson progress.
- `src/api/streak.ts` — streak + restore-day.

### Pages & layout
- `src/components/layout/DashboardLayout.tsx` — role dashboard shell. Supports
  **sidebar** (desktop-collapsible to icon-only; mobile hamburger overlay) and
  **floating** nav (FAB bottom-left with glass panel). Streak + Settings gear in
  the top bar.
- `src/pages/DashboardPage.tsx` — real stats from enrollments: enrolled,
  completed, lessons done, avg progress; continue-learning cards with restart.
- `src/pages/CourseDetailPage.tsx` — lesson list + reader (transcript), video
  player or "Video not yet available" placeholder, mark-complete, restart,
  per-course notes in localStorage.
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
  `courses.py` (catalog, enrollments, enroll, restart),
  `lessons.py` (per-user progress persistence + course progress recompute),
  `users.py`, `admin.py`, `super_admin.py`.
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
