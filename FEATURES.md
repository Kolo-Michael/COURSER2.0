# COURSER 2.0 — Complete Feature Guide (by language & complexity)

> A map of **every feature** in the app, grouped first by **language**
> (TypeScript / Python / Dart) and then by
> **ambiguity level** — from the least ambiguous (simple, obvious code) to the
> most ambiguous (stateful, async, security-heavy code). Read each language's
> section **top to bottom**: Level 1 → Level 2 → Level 3 → Level 4 gives you a
> progressive path from "what is this page?" to "how does the whole system
> really work?".
>
> The app has three codebases that share one FastAPI backend:
>
> | Codebase | Language | Location | Role |
> | --- | --- | --- | --- |
> | Web app | TypeScript + React 19 | `frontend/` | Learners, admins, owners (browser) |
> | API | Python + FastAPI | `backend/` | All data + auth + progress logic |
> | Mobile app | Dart + Flutter | `mobile/` | Learners on Android / iOS |
>
> **Ambiguity scale used below:**
>
> - 🟢 **Level 1 — Simple / self-evident.** Static markup, data models, small helpers. Read them to learn the vocabulary of the app.
> - 🟡 **Level 2 — Moderate.** Forms, lists, CRUD endpoints. One page or one endpoint, little shared state.
> - 🟠 **Level 3 — Complex.** Async data fetching, auth/sessions, state, conditional rendering. Requires context from other files.
> - 🔴 **Level 4 — Deepest / most ambiguous.** Cross-cutting concerns: security, architecture, migrations, tricky bugs that were solved. Read these last.
>
> ---
>
> ## Part 1 — TypeScript + React (Web Frontend, `frontend/`)
>
> The web app is a single-page app (SPA). Routing, roles, session, styling and
> every feature page live under `src/`.
>
> ### 🟢 Level 1 — Simple UI building blocks
>
> | Feature | Where | What it is |
> | --- | --- | --- |
> | **Theme toggle** | `src/components/ThemeToggle.tsx` | Light/dark switch. Writes `courser.theme` in localStorage + `dark` class on `<html>`. |
> | **Public shell** | `src/components/layout/PublicShell.tsx` | Wraps public pages (header + footer). |
> | **Site header** | `src/components/layout/SiteHeader.tsx` | Frosted sticky navbar with logo + auth links. |
> | **Site footer** | `src/components/layout/SiteFooter.tsx` | Footer with links + newsletter signup hook. |
> | **Landing hero** | `src/components/landing/Hero.tsx` | Marketing hero + CTA for the landing page. |
> | **Mock data** | `src/data/mockCourses.ts` | Fallback course data used while the API is offline. |
> | **Category icon helper** | `src/pages/CoursesPage.tsx` (`categoryIcon`) | Maps a category to a Font Awesome icon. |
>
> ### 🟡 Level 2 — Forms, lists, and straightforward pages
>
> | Feature | Where | What it is |
> | --- | --- | --- |
> | **Login / Signup** | `src/components/auth/LoginForm.tsx`, `SignupForm.tsx` | Email+password forms; "Remember me" is wired to `remember_me`. Redirect via `dashboardFor(role)`. |
> | **Password recovery** | `src/components/auth/ForgotPasswordForm.tsx`, `VerifyCodeForm.tsx`, `ResetPasswordForm.tsx` | 3-step forgot → verify code → reset flow against the backend. |
> | **Browse courses (public)** | `src/pages/CoursesPage.tsx` (bottom half) | Catalog with search + category filters and a category sidebar. |
> | **Course cards** | `src/pages/CoursesPage.tsx` (`CourseCard`) | Reusable card: icon, category, level, duration, "View details". |
> | **Student dashboard** | `src/pages/DashboardPage.tsx` | Real stats (enrolled/completed/lessons/avg progress) + continue-learning cards with restart. |
> | **Learning streak** | `src/pages/StreakPage.tsx` | Current/longest streak, days this month, restore-a-day button. |
> | **Admin workspace** | `src/pages/AdminPage.tsx` | Add-a-course form, course list, live course-card preview. |
> | **Super-admin workspace** | `src/pages/SuperAdminPage.tsx` | Platform stats + create/review admin accounts. |
> | **Newsletter block** | `src/components/landing/Hero.tsx` / `SiteFooter.tsx` | Email subscribe → `POST /api/newsletter/subscribe`. |
>
> ### 🟠 Level 3 — Stateful, async, session-aware features
>
> | Feature | Where | What it is |
> | --- | --- | --- |
> | **Routing + role guards** | `src/App.tsx` | `ProtectedRoute` bounces unauthenticated users to `/auth`; wrong-role users to their own dashboard. `/dashboard` is open to all roles ("Student view" preview). |
> | **Session reading** | `src/auth/session.ts` | `getSession()` reads the `courser_session` cookie (URL-decoded + legacy octal-escape normalization) and the legacy localStorage key. |
> | **Nav preferences** | `src/auth/preferences.ts` | Sidebar-vs-floating + collapsed prefs; localStorage + fire-and-forget `PATCH /auth/me` sync. |
> | **API client** | `src/api/client.ts` | Fetch wrapper: `credentials: 'include'`, JSON errors, returns `undefined` on 204. |
> | **API modules** | `src/api/auth.ts`, `courses.ts`, `streak.ts` | Typed calls to every backend endpoint (login, me, enroll, restart, lesson progress, streak). |
> | **Course detail page** | `src/pages/CourseDetailPage.tsx` | The most complex page: loads a course, enrolls, tracks progress, runs the lesson reader. |
> | **Lesson reader + notes** | `CourseDetailPage.tsx` (`LessonMedia`, `LessonNotes`, `parseNotes`) | Video if available, else "Video not yet available"; structured `##`/`-`/`**` notes rendered into sections with **Key takeaways** and **Check your understanding** boxes. |
> | **Lesson navigation** | `CourseDetailPage.tsx` | Per-lesson status chip, "Lesson X of Y", Previous/Next lesson buttons to work through a course. |
> | **Mark complete / restart** | `CourseDetailPage.tsx`, `DashboardPage.tsx` | Completing a lesson updates progress via the API; restart resets all lesson progress. |
> | **Cora Q&A chat** | `CourseDetailPage.tsx` | Ask a question → `POST /api/courses/slug/{slug}/ask`; restores the user's persisted conversation via `GET /api/courses/slug/{slug}/conversation`. |
>
> ### 🔴 Level 4 — Deepest / cross-cutting
>
> | Feature | Where | What it is |
> | --- | --- | --- |
> | **Dashboard layout** | `src/components/layout/DashboardLayout.tsx` | Role-aware shell with two nav modes (collapsible sidebar that is desktop-only via a matchMedia gate, and floating FAB panel), avatar rendering, logout, streak/settings top-bar icons. |
> | **Settings page** | `src/pages/SettingsPage.tsx` | Categorized: Profile (avatar upload → data URL), Navigation (sidebar vs floating + collapsed default), Security (change password), Account (read-only + sign out). |
> | **Design system** | `src/index.css` | Flat warm-stone surfaces, `.courser-card`, `.courser-glass`, dot-grid textures; **no color gradients**; both themes. |
> | **Dev cookie/proxy quirks** | `frontend/vite.config.ts` + `src/api/client.ts` | API is same-origin in dev (`/api` proxied to `127.0.0.1:8000`) so auth cookies land on `localhost:5173`; host-bound all interfaces. See `AGENTS.md`. |
>
> ---
>
> ## Part 2 — Python + FastAPI (Backend, `backend/`)
>
> All endpoints hang off `/api`. Routers are registered in `app/main.py`
> (`/auth`, `/courses`, `/lessons`, `/newsletter`, `/streak`).
>
> ### 🟢 Level 1 — Data models & schemas (the vocabulary)
>
> | Feature | Where | What it is |
> | --- | --- | --- |
> | **User** | `app/models/user.py` | username, email, password hash, role (`student`/`admin`/`super_admin`), avatar, nav prefs, lockout counters. |
> | **Catalog** | `app/models/course.py` | `Course` → `Module` → `Lesson` tree + `Category`. |
> | **Progress** | `app/models/course.py` (`LessonProgress`) | One row per (user, lesson): progress 0–100, `is_completed`, `quiz_score`. |
> | **Enrollment** | `app/models/course.py` | User↔Course link with stored `progress`. |
> | **Streak** | `app/models/streak.py` (`LearningDay`) | One row per learning day; restore counters. |
> | **Conversation** | `app/models/conversation.py` | Chat messages for the Cora tutor (used by `/ask`). |
> | **Session** | `app/models/session.py` | Refresh-token sessions. |
> | **Pydantic schemas** | `app/schemas/` | Request/response validation for every endpoint. |
>
> ### 🟡 Level 2 — Straightforward endpoints
>
> | Feature | Where | What it is |
> | --- | --- | --- |
> | **Health** | `app/main.py` | `GET /api/health` → keepalive + uptime checks. |
> | **Newsletter** | `app/api/newsletter.py` | `POST /api/newsletter/subscribe` (stores a subscriber). |
> | **Course catalog** | `app/api/courses.py` | `GET /categories`, `GET /courses`, `GET /courses/{id}`, `GET /courses/slug/{slug}`. |
> | **Lesson read** | `app/api/lessons.py` | `GET /lessons/{id}` (detail + progress when authenticated). |
> | **Streak** | `app/api/streak.py` + `services/streak_service.py` | `GET /api/streak` (current/longest), `POST /api/streak/restore`; logic lives in the service. |
> | **Admin CRUD** | `app/api/courses.py` | Create/update/delete courses (admin/super_admin only). |
>
> ### 🟠 Level 3 — Business logic & auth flows
>
> | Feature | Where | What it is |
> | --- | --- | --- |
> | **Auth endpoints** | `app/api/auth.py` | `register`, `signup`, `login`, `refresh`, `logout`, `me` (GET/PATCH), `change-password`, plus super-admin-only admin creation. |
> | **Password reset** | `app/api/auth.py` + `services/email_service.py` | `forgot-password` → `verify-code` → `reset-password`; emails are sent via `email_service`. |
> | **Enrollment + restart** | `app/api/courses.py` | `POST /courses/slug/{slug}/enroll` (idempotent), `POST /courses/slug/{slug}/restart` (deletes lesson progress + zeroes enrollment). |
> | **Lesson progress** | `app/api/lessons.py` | `POST /lessons/{id}/complete`, `PATCH /lessons/{id}/progress` persist progress and record learning days; enrollment progress is recomputed as the lesson average. |
> | **My enrollments** | `app/api/courses.py` | `GET /courses/enrollments/me` returns real counts + `progress_percent` + `is_completed`. |
> | **Cora AI tutor** | `app/services/ai_service.py` + `app/api/courses.py` (`ask_cora`) | RAG over lesson notes: lexical retrieval → OpenAI-compatible `/chat/completions` → answer persisted on a per-(user, course) `Conversation`. Falls back to a canned reply when `OPENAI_API_KEY` is unset. |
> | **Rate limiting** | `app/main.py` (slowapi) | Backoff on login/signup/refresh to blunt brute force. |
>
> ### 🔴 Level 4 — Security, architecture & the tricky stuff
>
> | Feature | Where | What it is |
> | --- | --- | --- |
> | **Token + cookie auth** | `app/core/security.py` | JWT access/refresh tokens; reads `Authorization: Bearer` **first** then falls back to the `access_token` cookie (mobile uses Bearer, web uses cookies). |
> | **Session cookie encoding** | `app/api/auth.py` (`_set_session_cookie`) | The `courser_session` cookie is URL-encoded JSON so the browser can read it; this fixed a login "does nothing" bug (see `AGENTS.md`). |
> | **Role gates** | `app/api/courses.py` (`_require_admin_or_above`), `auth.py` | Admin/super-admin enforced server-side on every mutating endpoint. |
> | **Migrations without Alembic** | `backend/init_db.py` | `create_all` + an idempotent `_USER_MIGRATION_COLUMNS` ALTER list; seed with `backend/seed_courses.py` (6 courses / 18 lessons, idempotent). |
> | **Config resolution** | `app/core/config.py` | Loads `.env`, then `.env.local` with override priority; SQLite locally, Postgres in prod. |
> | **Keepalive** | `backend/ping_render.sh`, `ping_render_loop.bat`, `keepalive.py`, `crontab_render` | Pings `/api/health` every ~15s to keep the serverless runtime warm. |
>
> ---
>
> ## Part 3 — Dart + Flutter (Mobile App, `mobile/`)
>
> Flutter app for learners. State is managed with `ChangeNotifier` + provider
> (`lib/state/`).
>
> ### 🟢 Level 1 — Models, theme & reusable widgets
>
> | Feature | Where | What it is |
> | --- | --- | --- |
> | **Models** | `lib/models/` | `Course`, `Module`, `Lesson`, `User`, `Enrollment`, `Streak`, `AuthResponse`. |
> | **App theme** | `lib/theme/app_theme.dart` | Colors, dark mode, typography. |
> | **Course card** | `lib/screens/components/course_card.dart` | Reusable catalog card. |
> | **Bottom nav** | `lib/screens/components/bottom_nav.dart` | Courses / Progress / Profile tabs. |
>
> ### 🟡 Level 2 — Screens (one screen, one job)
>
> | Feature | Where | What it is |
> | --- | --- | --- |
> | **Splash** | `lib/screens/splash_screen.dart` | Startup gate → decides auth/onboarding route. |
> | **Onboarding** | `lib/screens/onboarding_screen.dart` | Multi-page intro (interests + goal) that **resumes** where you left off. |
> | **Landing** | `lib/screens/landing_screen.dart` | Marketing screen with sign-up CTA. |
> | **Login / Signup** | `lib/screens/login_screen.dart`, `signup_screen.dart` | Auth forms via `AuthService`. |
> | **Courses list** | `lib/screens/courses_list_screen.dart` | Catalog from the API. |
> | **Course detail** | `lib/screens/course_detail_screen.dart` | Modules + lessons + enroll. |
> | **Lesson screen** | `lib/screens/lesson_screen.dart` | Notes reader, reading-comprehension quiz, ask-Cora dialog, progress update. |
> | **Home** | `lib/screens/home_screen.dart` | Bottom-nav hub (courses/progress/profile). |
> | **Profile** | `lib/screens/profile_screen.dart` | Account info + sign out. |
>
> ### 🟠 Level 3 — State, services & persistence
>
> | Feature | Where | What it is |
> | --- | --- | --- |
> | **Auth state** | `lib/state/auth_state.dart` | Login/logout/session, drives routing. |
> | **Courses state** | `lib/state/courses_state.dart` | Catalog fetch + selection. |
> | **Streak state** | `lib/state/streak_state.dart` | `fetch()` + `restore()` against the streak API. |
> | **Services** | `lib/services/` | `AuthService`, `CourseService`, `LessonsService` — HTTP calls. |
> | **API client** | `lib/core/api_client.dart` | Base HTTP + error handling. |
> | **Secure storage** | `lib/core/storage.dart` | Tokens + onboarding progress + session. |
> | **Notes renderer** | `lib/screens/lesson_screen.dart` (`_LessonNotes`) | Parses the same `##`/`-`/`**` study-note format as the web. |
>
> ### 🔴 Level 4 — Deepest / cross-cutting
>
> | Feature | Where | What it is |
> | --- | --- | --- |
> | **API URL resolution** | `lib/core/config.dart` | Release → Render prod; debug → emulator (`10.0.2.2`) or LAN IP; emulator detected via AVD-name markers, overridable with `--dart-define`. |
> | **Onboarding resume** | `lib/screens/onboarding_screen.dart` + `lib/core/storage.dart` | Interrupted onboarding restores page index + interests + goal. |
> | **Bearer-token auth** | `lib/services/auth_service.dart` + `lib/core/api_client.dart` | Sends `Authorization: Bearer` (this is why the backend supports it). |
>
> ---
>
> ## Part 4 — How a feature flows across all three languages
>
> A "feature" here usually means **one capability spread across all codebases**.
> This is the single most important mental model for understanding the repo:
>
> | Feature | Web (TS/React) | API (Python) | Mobile (Dart) |
> | --- | --- | --- | --- |
> | **Auth** | `LoginForm` → `api/auth.ts` → `auth/session.ts` | `auth.py` (cookies + JWT) | `login_screen` → `AuthService` (Bearer) |
> | **Course catalog** | `CoursesPage` → `api/courses.ts` | `courses.py` list/get | `courses_list_screen` → `CourseService` |
> | **Enroll** | `CourseDetailPage` (`handleEnroll`) | `POST /courses/slug/{slug}/enroll` | `course_detail_screen` |
> | **Course progress** | `DashboardPage` + `CourseDetailPage` | `LessonProgress` + `lessons.py` recompute | `lesson_screen` quiz + `updateProgress` |
> | **Restart course** | `DashboardPage` / `CourseDetailPage` | `POST /courses/slug/{slug}/restart` | — |
> | **Streak** | `StreakPage` | `streak.py` + `streak_service.py` | `StreakState` |
> | **Study notes** | `LessonNotes` renderer | `seed_courses.py` `LESSON_NOTES` content | `_LessonNotes` renderer |
> | **Password reset** | 3-step forms | `auth.py` + `email_service.py` | — |
> | **Settings/nav prefs** | `SettingsPage` + `preferences.ts` | `PATCH /auth/me` | — |
>
> ---
>
> *This document should be kept in sync with `CODEBASE.md` and `AGENTS.md` as
> features change.*