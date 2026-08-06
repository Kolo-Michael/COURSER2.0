# Activity Log

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

