## Student-Focused Research Instrument

### New: Student Problem Questionnaire (DOCX)

A new research instrument has been produced for the dissertation:
- **File:** `Student_Problem_Questionnaire.docx`
- **Focus:** Student problems and experiences on the learning platform
- **Perspective:** Changed from admin-focused to student-focused — questions target student challenges, engagement, motivation, technical issues, accessibility, and satisfaction
- **Design:** 54 questions across 10 sections (demographics, platform usage, course experience, academic support, peer interaction, assessment, motivation, accessibility, improvement suggestions, and additional comments)
- **References:** 8 research frameworks included (Self-Determination Theory, Constructive Alignment, Learner Centric Design, Accessibility in Higher Education, Student Engagement, Learning Analytics, Technology-Enhanced Learning, Social Cognitive Theory)
- **Use:** For data collection in the dissertation; analyze patterns in student problems to inform platform improvements

## Document Creation Rule

- When the user asks to **create a document** and does **not specify the format**,
  always **ask which format they want** (e.g. Word `.docx`, PDF, Markdown, PPTX)
  before generating it. Do not assume a default format.

## Frontend Auth / Session Cleanup

### Dev cookie scoping fix (login "does nothing")
- Symptom: clicking login appeared to do nothing — page just reloaded back to `/auth`.
- Root cause: dev frontend on `localhost:5173`, API on `127.0.0.1:8000`. Backend
  cookies (`courser_session`, `access_token`, `refresh_token`) are host-scoped to
  `127.0.0.1`, so the page on `localhost` could never read `courser_session`.
  `getSession()` returned null on `/dashboard` → ProtectedRoute bounced to `/auth`.
- Fix: `frontend/vite.config.ts` now adds a `server.proxy` forwarding `/api` →
  `http://127.0.0.1:8000` (changeOrigin). `frontend/src/api/client.ts` no longer
  hardcodes `http://127.0.0.1:8000` in dev; `API_BASE_URL` stays empty so API calls
  are same-origin (`/api` → proxied). Cookies now land on `localhost:5173`.
- Verified: restart `npm run dev`; `GET localhost:5173/api/health` → 200; login via
  proxy returns all three Set-Cookie headers on the `localhost` origin.
- Note: the Vite dev server must be restarted after editing `vite.config.ts`.

### Vite binding fix (127.0.0.1 couldn't connect)
- Symptom: login still "did nothing" even after the proxy fix; browser reloaded
  to `/auth`.
- Root cause: on some Node versions `server.host` defaults to `localhost` which
  resolved to `::1` only — `curl http://127.0.0.1:5173/` returned status 000
  (connection refused) while `http://localhost:5173/` and `http://[::1]:5173/`
  worked. Any browser hitting 127.0.0.1 got no server (or a mismatched cookie host).
- Fix: `frontend/vite.config.ts` sets `server.host: true` (bind all interfaces).
- Verified: after restart, `localhost`, `127.0.0.1`, and the LAN IP all return 200;
  login via `127.0.0.1:5173/api/auth/login` sets all three cookies.

### courser_session cookie encoding fix (login still bounced to /auth)
- Symptom: login succeeded (200 + cookies) but the browser still reloaded to
  `/auth` — `getSession()` returned null even though `courser_session` was set.
- Root cause: Starlette's cookie writer octal-escapes special characters in the
  JSON value (`\054` for `,`, `\"` for quotes). `document.cookie` returned that
  escaped string, so `JSON.parse()` threw and `getSession()` fell through to null.
- Fix (backend): `backend/app/api/auth.py` `_set_session_cookie()` now stores
  `quote(json.dumps(payload))` (URL-encoded) instead of raw JSON.
- Fix (frontend): `frontend/src/auth/session.ts` `getSession()` now uses
  `parseSessionCookie()` which decodes URL-encoding AND normalizes legacy octal
  escapes (`\054`, `\"`) so stale pre-fix cookies don't bounce users either.
- Verified: `courser_session` now set as `%7B%22identifier%22...` (URL-encoded);
  parsed value yields identifier/role/email; build passes.

### Proper server-side logout + cookie clearing
- Verified login→dashboard chain: POST `/api/auth/login` sets `access_token`,
  `refresh_token`, `courser_session` cookies (SameSite=lax); frontend redirects via
  `dashboardFor(role)` → `/dashboard` (ProtectedRoute allows `student`); `/me` returns
  200 while authenticated, 401 after logout.
- `frontend/src/api/auth.ts` — added `logout()` (POST `/api/auth/logout`,
  `credentials: 'include'`) and a `rememberMe` param on `login()` that sends
  `remember_me`.
- `frontend/src/api/client.ts` — `apiRequest` now returns `undefined` for 204
  (logout previously threw "Unexpected end of JSON input").
- `frontend/src/auth/session.ts` — `clearSession()` now clears all COURSER cookies
  (`courser_session`, `access_token`, `refresh_token`) client-side in addition to the
  legacy localStorage key.
- `frontend/src/components/layout/DashboardLayout.tsx` + `frontend/src/pages/DashboardPage.tsx`
  — logout buttons now call `logout()` (revokes server session) before
  `clearSession()` + redirect to `/auth`. Old `Link to="/auth"` replaced.
- `frontend/src/components/auth/LoginForm.tsx` — "Remember me" checkbox is now wired
  to `remember_me` state and sent to the API.
- Backend `/auth/logout` confirmed idempotent 204 that clears all three cookies
  (Max-Age=0); verified via curl that `/me` returns 401 afterwards.
- Note: stale browser-saved logins (autofilled 422s) are cleared by the user from
  browser password settings — not handled in app code.

## Web Frontend Aesthetic Upgrade

### Glassmorphism + subtle gradients (all public & dashboard pages)
- `frontend/src/index.css` — `body` now gets a fixed soft gradient wash (faint blue +
  orange radial glows over a gentle vertical fade) so frosted surfaces have something
  to blur. `.courser-card` is now translucent (`bg-white/70`) with `backdrop-blur-md`;
  added `.courser-glass` utility for headers/sidebars/panels.
- `frontend/src/components/layout/SiteHeader.tsx` — sticky header is frosted
  (`bg-white/75 backdrop-blur-xl`); "Sign up" CTA uses a subtle orange gradient.
- `frontend/src/components/layout/DashboardLayout.tsx` — sidebar and top bar use the
  frosted glass treatment.
- `frontend/src/components/landing/Hero.tsx` — soft diagonal blue→orange gradient
  overlay; spotlight card and "Get started" CTA upgraded to glass/gradient.
- `frontend/src/pages/AuthPage.tsx`, `CoursesPage.tsx`, `CourseDetailPage.tsx`,
  `DashboardPage.tsx`, `AdminPage.tsx`, `SuperAdminPage.tsx` — primary/accent CTAs
  use subtle `bg-gradient-to-br` gradients; solid-white panels switched to frosted
  glass. Also fixed near-invisible hero text in the logged-in courses hero
  (`text-blue-100`/`text-stone-200` on light bg → accent/stone-600 with dark variants).

## Mobile Onboarding → Auth + Device Testing

### Persisted onboarding progress (`mobile/lib/core/storage.dart`)
- Added `readOnboardingPage`, `readOnboardingInterests`, `readOnboardingGoal`,
  `saveOnboardingProgress`, and `clearOnboardingProgress` to `SecureStore`.
- Progress (page index + selected interests + goal) is stored in secure
  storage so an interrupted onboarding session resumes where it left off.

### Resume support (`mobile/lib/screens/onboarding_screen.dart`)
- `OnboardingScreen` now restores saved progress on `initState` and jumps the
  PageController back to the saved page.
- Every page change, interest toggle, and goal selection is persisted.
- Get Started / Skip still lead to the auth page (`/login`).
- Router already redirects to `/onboarding` whenever no account is logged in,
  so onboarding always runs first and resumes rather than restarting.

### Emulator detection fix (`mobile/lib/core/config.dart`)
- Physical Android devices (Pixel 6a) report hostname `localhost`, which the
  old heuristic mistook for an emulator and sent API traffic to `10.0.2.2`.
- Detection now relies on AVD-name markers (`emulator`/`qemu`/`sdk_gphone`);
  override with `--dart-define=COURSER_EMULATOR=true/false`.
- Physical device on the LAN uses `http://192.168.1.192:8000/api`.

### Device verification (Pixel 6a, adb)
- `flutter build apk --debug` + `adb install -r`; app boots to onboarding with
  no account, hits `http://192.168.1.192:8000/api/courses` → 200.
- Confirmed resume: app relaunched at the last onboarding page (one tap on
  "Get started" went straight to `/login`).
- Note: backend uvicorn must run on `0.0.0.0:8000`; Windows firewall allows
  python.exe on the Public profile.

## Keepalive / Health Monitoring

### Added `backend/ping_render.sh`
- Shell script that pings the Render health endpoint (`/api/health`) 4 times per
  minute (15-second interval) to keep the serverless runtime warm.
- Designed for cron scheduling at `* * * * *` (cron's minimum granularity).
- Endpoint URL is configurable via `RENDER_HEALTH_URL` env var.
- Logs: `ping_render.sh >> /var/log/render_ping.log 2>&1`

### Added `backend/crontab_render`
- Ready-to-install crontab file for the Render keepalive ping.
- Install with: `crontab backend/crontab_render`

### Added `backend/ping_render_loop.bat`
- Windows equivalent for continuous 15-second pinging.
- Run directly or schedule with Task Scheduler (1-minute trigger).
- Usage: `ping_render_loop.bat` (default 15s) or `ping_render_loop.bat 5` (5s).

### Updated `backend/keepalive.py`
- Changed default URL to `https://courser-api-18uo.onrender.com/api/health`.
- Added `--loop` mode for continuous pinging without cron (useful in dev
  containers or Windows background tasks).
- Added `--interval` option (default 15 seconds).
- Refactored with argparse for cleaner CLI usage.

## Backend / Auth Fixes

### Fixed `backend/app/core/security.py` — `get_access_token()`
- Added Authorization header (Bearer token) support alongside cookie-based auth.
- Previous code only read from cookies; the Flutter mobile client sends Bearer
  tokens in the `Authorization` header, which caused all mobile API calls to
  return 401.
- Now checks `Authorization: Bearer <token>` header first, falls back to
  `access_token` cookie.

### Fixed `backend/app/main.py` — CORS origins
- Added `https://courser-api-18uo.onrender.com` to `allowed_origins`.
- Added `http://localhost:8000` / `http://127.0.0.1:8000` for local development.

## Mobile Client Updates

### Updated `mobile/lib/core/config.dart`
- Changed `apiBaseUrl` to `https://courser-api-18uo.onrender.com/api`.
- Now supports local development: detects `dart.vm.product` (debug vs release).
  In debug mode, uses `http://127.0.0.1:8000/api` (iOS) or
  `http://10.0.2.2:8000/api` (Android emulator). Physical devices can override
  with `--dart-define=COURSER_API_URL=http://<LAN_IP>:8000/api`.

### Updated `mobile/lib/app.dart`
- Replaced hardcoded URL strings with `Config.apiBaseUrl` for both `AuthState`
  and `CoursesState` providers.
- Added `import 'core/config.dart'`.

## Local Development (SQLite)

### Switched models to generic SQLAlchemy `UUID`
- All 4 model files now import `UUID as SA_UUID` from `sqlalchemy` instead of
  `sqlalchemy.dialects.postgresql`.
- The generic type works with both PostgreSQL (production) and SQLite (local).

### Added `aiosqlite` dependency
- `backend/requirements.txt` now includes `aiosqlite==0.20.0` for async SQLite.

### Created `backend/.env.local`
- Local dev config: `DATABASE_URL=sqlite+aiosqlite:///./courser_local.db`,
  `APP_ENV=development`.

### Updated `backend/app/core/config.py`
- `load_env_file()` now loads `.env` first, then `.env.local` with override
  priority (like Vercel's env file resolution).

### Added startup scripts
- `backend/run_local.sh` (Linux/macOS) and `backend/run_local.bat` (Windows)
  — one-command: install deps → init SQLite DB → seed courses → start uvicorn.

## Student Dashboard / Progress / Settings Feature Wave

> First full codebase map documented in `CODEBASE.md` (frontend/backend/mobile).

### DB-driven course progress + restartable courses
- `backend/app/models/course.py` — new `LessonProgress` model (user_id,
  lesson_id, progress 0–100, is_completed, quiz_score, completed_at, updated_at;
  unique `uq_user_lesson_progress`).
- `backend/app/api/lessons.py` — per-(user,lesson) progress persisted via
  `_upsert_lesson_progress`; enrollment progress recomputed as lesson average
  (`_recompute_course_progress`); `POST /{lesson_id}/complete` and
  `PATCH /{lesson_id}/progress` both record learning days.
- `backend/app/api/courses.py` — `GET /courses/enrollments/me` returns real
  counts (completed/total lessons, percent); `POST /courses/slug/{slug}/restart`
  deletes LessonProgress + zeroes enrollment; `GET /courses/slug/{slug}` attaches
  per-lesson progress when authenticated.
- `frontend/src/pages/DashboardPage.tsx` — dashboard now shows real stats
  (enrolled/completed/lessons done/avg progress), continue-learning cards with
  progress bars + restart (with confirm) + Continue/Review.
- `frontend/src/pages/CourseDetailPage.tsx` — clickable lesson list; video player
  when `video_url` exists else "Video not yet available" placeholder (text is
  ready); transcript tab; "Mark lesson complete" → updates course/enrollment
  state; restart button for enrolled users; per-course notes in localStorage.

### Collapsible sidebar + floating nav (student settings)
- `frontend/src/components/layout/DashboardLayout.tsx` — rewritten. Sidebar mode:
  desktop collapse toggle (icon-only `w-20`, labels/tooltips hidden, profile +
  Cora box hidden) + mobile hamburger overlay; collapse is desktop-only via a
  matchMedia `isDesktop` gate so mobile always shows full labels. Floating mode:
  FAB bottom-left expands a glass panel (nav, switch-back-to-sidebar, outside
  click / Escape to close).
- `frontend/src/pages/SettingsPage.tsx` — new `/settings` route (all roles),
  categorized: Profile (avatar upload → data URL), Navigation (sidebar vs
  floating + start-collapsed), Security (change password), Account.
- `backend/app/models/user.py` — `avatar_url`, `nav_style` (sidebar|floating),
  `nav_collapsed` columns; migrated via `init_db.py` `_USER_MIGRATION_COLUMNS`.
- `backend/app/api/auth.py` — `PATCH /auth/me` (profile/settings, refreshes
  session cookie) + `POST /auth/change-password` (bcrypt verify + rehash).
- `frontend/src/auth/preferences.ts` — nav style/collapsed prefs (localStorage +
  fire-and-forget profile sync).
- `frontend/src/pages/StreakPage.tsx` — rewritten on real `getStreak()` /
  `restoreStreakDay()`.

### No-color-gradient flat surfaces (both themes)
- All `bg-gradient-to-br` CTAs (Hero, SiteHeader, Login/Signup forms,
  Landing/Courses/Admin/SuperAdmin pages) replaced with solid `bg-primary` /
  `bg-accent` (+ dark variants).
- `frontend/src/index.css` — body is flat warm stone (light `#F7F6F4` / dark
  `#0C0A09`); the only radial-gradients left are the intentional dot-grid
  textures (`.courser-bg-dots` / `-dense`) that the frosted-glass panels blur.
- Hero overlay is now a flat `bg-primary/5` tint instead of the blue→orange
  diagonal fade.

## Organized Study Notes + Completion Flow

### Structured notes for every lesson (no video required)
- `backend/seed_courses.py` — every seeded lesson (18 across 6 courses) now
  ships with organized, readable study notes via the `LESSON_NOTES` dict
  (keyed by lesson title). Format: `## Heading` sections, `- ` bullets,
  paragraphs, and **bold** emphasis. Seeding is idempotent (content is
  re-applied on every run).
- `frontend/src/pages/CourseDetailPage.tsx` — new `LessonNotes` renderer
  (`parseNotes`/`NoteBody`) turns the structured text into professional notes
  with tinted "Key takeaways" (accent) and "Check your understanding"
  (primary) boxes; tabs renamed `Transcript` → `Study notes`; per-lesson
  status chip + lesson position + **Previous/Next lesson** navigation added so
  learners can work through and complete the course.
- `mobile/lib/screens/lesson_screen.dart` — new `_LessonNotes` widget parses
  the same `##`/`-`/`**` format on Android/iOS instead of printing raw text.

### Completion is measured end-to-end
- Lesson progress (0–100) is persisted per (user, lesson) via
  `PATCH /lessons/{id}/progress` and `POST /lessons/{id}/complete`
  (`backend/app/api/lessons.py`); enrollment progress = lesson average
  (`_recompute_course_progress`), surfaced as `progress_percent` on
  `GET /courses/enrollments/me` and the course detail card.

### Dashboard access for all roles
- `frontend/src/App.tsx` — `/dashboard` now allows `student`, `admin`, and
  `super_admin` so the "Student view" link in the admin/super-admin sidebars
  works instead of bouncing back.

## Cora AI Tutor (real RAG, wired 12 Aug 2026)

- `backend/app/services/ai_service.py` — NEW. Retrieval-augmented Q&A over a
  course's lesson notes. `retrieve_context()` ranks every published lesson
  against the question by term overlap (lexical, no embeddings needed) and
  returns the top 4 chunks; `generate_answer()` calls an OpenAI-compatible
  `/chat/completions` endpoint (httpx) with the notes pinned into a system
  prompt; `get_or_create_conversation()` / `append_message()` persist one
  thread per (user, course). `answer_course_question()` orchestrates and
  degrades to a canned reply when `OPENAI_API_KEY` is missing.
- `backend/app/api/courses.py` — `ask_cora` now runs the real flow (was a
  stub) and adds `GET /courses/slug/{slug}/conversation` for chat history.
- `backend/app/schemas/course.py` — added `ConversationMessageResponse`.
- `backend/requirements.txt` — added `httpx==0.28.1`.
- Env: `OPENAI_API_KEY`, `OPENAI_BASE_URL` (default `https://api.openai.com/v1`),
  `OPENAI_MODEL` (default `gpt-4o-mini`). Without the key the UI still works
  (fallback answer).
- `frontend/src/api/courses.ts` — `getCourseConversation()` +
  `ApiChatMessage` type; the shared `CourseWorkspacePanel` (rendered by
  `CourseDetailPage` and embedded on the dashboard) loads the saved
  conversation on mount (signed-in) so the Cora sidebar isn't wiped on
  reload.
- NOTE: the `Conversation`/`Message` models already existed and were already
  created by `init_db.py`; they're now actually used.

## Commenting pass (12 Aug 2026)

- All ~90 source files across `backend/`, `frontend/`, and `mobile/` received
  explanatory comments (module headers, function/class docstrings, and line
  comments on non-obvious logic) at the user's explicit request. Comment-only
  edits; verified via `py_compile`, `npx tsc -b`, `flutter analyze`.
- ⚠️ Watch-out: during that pass a sub-agent went off-script and half-extracted
  a `CourseWorkspacePanel` + `auth/course.ts` (last-course localStorage
  tracker) from `CourseDetailPage`, leaving the build broken (an unused local).
  The user asked to **keep** that feature, so it was finished instead of
  deleted: the unused `workCourse` state was dropped, the panel is now the
  single lesson workspace used by both `CourseDetailPage` and `DashboardPage`,
  the Cora chat history is loaded inside the panel, and the build is green.
 - Note: `CourseDetailPage` delegates its reading flow to
   `CourseWorkspacePanel` (see `frontend/src/components/course/`); the seeded
   study-notes renderer lives in `lessonNotes.tsx` as `LessonNotes`/`parseNotes`.
 - Note: if a background sub-agent is still running (watch file mtimes / `git
   status`), it can silently rewrite these files mid-task. Stop it in your
   terminal/IDE before committing or hand-editing the workspace pages.

## Dashboard workspace + stable Cora (13 Aug 2026)

 - `CourseWorkspacePanel` — the module view lives *inside* the reading-workspace
   grid as a header bar **above the lesson** (grid is now
   `grid-cols-1 lg:grid-cols-[1fr_320px]`): only the module containing the active
   lesson is displayed (heading "Module N of M" + title + its lessons, with
   **Previous module / Next module** controls), so the modules stay clearly
   visible and reading controls sit below the active module. Lesson prev/next are
   scoped within the current module, and the pane offers "Next module" when the
   lesson list is exhausted. The module banner is `sticky top-0`; the Cora rail
   is `lg:sticky` pinned to the right with a fixed-height scrollable transcript +
   always-visible input.
 - `DashboardPage` — embeds `CourseWorkspacePanel` for the learner's most-
   advanced in-progress enrollment (course detail fetched on demand via
   `getCourseBySlug`/`getLastCourseSlug`), and injects a "Course workspace"
   sidebar entry pointing at the last-open course so the workspace is reachable
   from every dashboard page.
 - Cora rail — made `lg:sticky lg:top-24` and fixed-height with a scrollable
   transcript + always-visible input, so the assistant stays pinned to the right
   of the lesson and question-asking never scrolls out of reach.

## Hidden scrollbars + fixed expanded chat (13 Aug 2026)

 - `frontend/src/index.css` — app-wide scrollbar hiding (`scrollbar-width: none`,
   `-ms-overflow-style: none`, `*::-webkit-scrollbar { display: none }`).
   Scrolling still works; only the visible bar is removed.
 - `frontend/src/components/course/CoraChat.tsx` — the expanded (full-screen)
   Cora chat now locks the background page scroll while open
   (`document.body.style.overflow = 'hidden'`, restored on close/unmount), so
   the chat space never moves with the page.

## Neon "Invalid token" / resource-loading fix (13 Aug 2026)

 - Symptom: authenticated endpoints (incl. Cora `/ask`) returned errors; a
   valid bearer token got 500 on `/api/auth/me` instead of 200/404.
 - Root cause 1: `backend/.env.local` was replaced (by the user) with a Neon
   `DATABASE_URL` + a **new `SECRET_KEY`** (`8b02d163...`). The running uvicorn
   had restarted and adopted the new secret, so access-token cookies signed
   under the OLD dev secret (in the browser) now fail `decode_token` → 401
   "Invalid token". Fix for that: re-login (cookies are re-issued under the new
   secret).
 - Root cause 2 (the 500): the Neon `users` table was created before the
   `avatar_url` / `nav_style` / `nav_collapsed` columns existed, so
   `select(User)` (which selects all mapped columns) blew up on
   `UndefinedColumn`. Running `python init_db.py` applies the idempotent
   `_USER_MIGRATION_COLUMNS` ALTERs against Neon; afterwards `/auth/me` and
   Cora `/ask` return 200. Re-run `init_db.py` whenever Neon is re-provisioned.
 - Groq key in `.env`/`.env.local` verified live (200); backend `/api/health`
   verified 200; DB connectivity through app config verified (12 users).

## Cookie flag + refresh 401s fixed (13 Aug 2026)

 - Symptom 1: `api/auth/login` returned 200 with cookies but every
   authenticated call (`/me`, enrollments, streak) returned 401 "Not
   authenticated". Root cause: the user's new `backend/.env.local` had dropped
   `APP_ENV=development`, so `_cookie_secure()` returned True → cookies were
   set `Secure; SameSite=None` — which browsers refuse to send back over plain
   HTTP `localhost`. Fix: restored `APP_ENV=development` in `.env.local`
   (keeps the Neon `DATABASE_URL`; only flips cookie flags to non-Secure,
   SameSite=Lax). Backend must be restarted after env edits — `--reload` does
   NOT watch `.env` files.
 - Symptom 2: `POST /api/auth/refresh` returned 500. Root cause: Neon stores
   `user_sessions` timestamps as `timestamptz` (timezone-aware), but the code
   compared them against naive UTC `_utcnow_naive()` → `TypeError: can't
   compare offset-naive and offset-aware datetimes`. Fix: added
   `_to_naive_utc()` in `backend/app/services/auth_service.py` and wrapped the
   DB-read values (`expires_at`, `last_used`, `created_at`, `locked_until`) in
   `authenticate_user` and `rotate_refresh_token`.
 - Frontend resilience: `frontend/src/api/client.ts` now handles 401
   globally — on an authenticated call it POSTs `/api/auth/refresh` once
   (single-flight) and transparently retries; if refresh fails it clears the
   `courser_session`/`access_token`/`refresh_token` cookies and redirects to
   `/auth`. This ends the "phantom login" loop where a stale (not-signed)
   `courser_session` cookie kept the app calling authenticated endpoints with
   an access token signed under an old `SECRET_KEY`. Auth endpoints whose 401
   is a normal business result (login/signup/forgot/verify/reset) are excluded
   from this path. `apiRequestOnce` guards so a request is only refreshed once.
 - Verified end-to-end after fixes: login → 200, refresh → 200, `/me` → 200,
   enrollments/me → 200, streak → 200, with `SameSite=lax` cookies over
   http://127.0.0.1:8000.

## SQLite → Neon account migration (13 Aug 2026)

 - Symptom: `student@courser.com` (and `admin@courser.com`) returned 401
   "Invalid email or password" after the backend switched to the Neon
   DATABASE_URL. Root cause: those seed accounts lived only in the old
   SQLite DB (`backend/courser_local.db`); the Neon `users` table never had
   them, so login correctly rejected them.
 - Fix: one-off migration script inserted the test accounts into Neon,
   preserving their bcrypt hashes and original UUIDs (idempotent — skips
   existing email/username). `superadmin@courser.com` was skipped because a
   `superadmin` username already existed in Neon (that one uses
   `superadmin@smarttutor.com` / `SuperAdmin123!`).
 - `student@courser.com` password was not recoverable (bcrypt, no docs), so
   it was reset to `Student@123`.
 - Verified: login → 200, `/me` → 200, enrollments → 200 (`[]`).

