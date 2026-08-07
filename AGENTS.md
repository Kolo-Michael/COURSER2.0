# Activity Log

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

