# COURSER Backend — Node.js/TypeScript port

API-contract-compatible reimplementation of the FastAPI backend in
`../backend`. Same routes, same response shapes, same cookie behavior, same
security headers. It reads the **existing** Neon (Postgres) schema — no
migrations, no schema changes.

## Stack

- Express 4 + TypeScript (NodeNext ESM)
- `pg` (node-postgres) with raw SQL — no ORM, so the API contract stays under
  our control
- `bcryptjs` for password hashing (verifies existing `$2b$` passlib hashes)
- `jsonwebtoken` for HS256 access/refresh tokens
- `zod` for request validation (renders FastAPI-style 422 `{ detail }`)
- `express-rate-limit` for the global 200/min + per-route auth limits
- `nodemailer` for SMTP (dev prints to console)
- `vitest` + `supertest` for tests

## Run

```bash
npm install
npm run dev        # tsx watch src/index.ts, listens on :8000
```

Env is loaded from `.env` then `.env.local` — including the shared
`../backend/.env` / `../backend/.env.local` files, so it picks up the Neon
`DATABASE_URL` and `SECRET_KEY` you already have. Copy `.env.example` to
`.env.local` to override anything.

## Verify

```bash
npm run typecheck  # tsc --noEmit
npm test           # vitest run (12 tests)
```

Smoke test against a running instance:

```bash
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/ping        # 200, empty body (keepalive contract)
curl http://127.0.0.1:8000/api/courses
curl -c /tmp/j -X POST http://127.0.0.1:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"student@courser.com","password":"Student@123"}'
curl -b /tmp/j http://127.0.0.1:8000/api/auth/me
curl -b /tmp/j http://127.0.0.1:8000/api/streak
```

## Ported routes (1:1 with the Python API)

| Area | Routes |
| --- | --- |
| auth | `POST /auth/register` `POST /auth/signup` `POST /auth/login` `POST /auth/refresh` `POST /auth/logout` `GET /auth/me` `PATCH /auth/me` `POST /auth/change-password` `POST /auth/admin` `POST /auth/forgot-password` `POST /auth/verify-code` `POST /auth/reset-password` |
| courses | `GET /courses` `GET /courses/categories` `GET /courses/{id}` `GET /courses/slug/{slug}` `POST /courses` `PATCH /courses/{id}` `DELETE /courses/{id}` `GET /courses/enrollments/me` `POST /courses/slug/{slug}/enroll` `POST /courses/slug/{slug}/restart` `GET/POST/DELETE /courses/slug/{slug}/conversation(s)` `POST /courses/slug/{slug}/ask` |
| lessons | `GET /lessons/{id}` `POST /lessons/{id}/complete` `PATCH /lessons/{id}/progress` |
| streak | `GET /streak` `POST /streak/restore` |
| newsletter | `POST /newsletter/subscribe` |
| meta | `GET /` `GET /health` `GET /ping` (0-byte, for cron-job.org) |

## Behavior notes (deliberate parity decisions)

- **Cookies**: access/refresh are HttpOnly SameSite=Lax (dev) / None+Secure
  (prod); `courser_session` is a non-HttpOnly URL-encoded JSON cookie. Express
  `maxAge` is in **milliseconds** (Python's `max_age` was seconds) — handled.
- **bcrypt prefix**: bcryptjs mints `$2a$` salts. Existing users (hashed with
  passlib `$2b$`) still authenticate because bcryptjs verifies `$2b$`; new
  accounts created here also work if you ever switch back to the Python app.
- **Datetime serialization**: DB `timestamp` values are returned as raw
  strings and normalized to Pydantic's naive `YYYY-MM-DDTHH:MM:SS[.ffffff]`
  (no trailing zeros), so responses match the Python API byte-for-byte.
- **Fallback catalog**: `/courses` and `/courses/categories` return the
  hardcoded fallback courses when the DB is unreachable, exactly like the
  Python `FALLBACK_COURSES`.
- **Rate limits**: global 200/min; auth routes signup 3/hr, login 5/min,
  refresh 30/min, admin 20/hr, forgot 3/hr, verify 10/min, reset 5/hr.
- **Email**: dev prints the code; production sends via SMTP. Missing SMTP
  creds fail soft (reset flow still returns success) — matches the Python
  anti-enumeration behavior.

## Database tooling (Python → TypeScript)

The one-off Python tooling (`init_db.py`, `seed_courses.py`, `keepalive.py`,
`create_super_admin.py`, `fix_super_admin.py`, `migrate_*.py`) has been ported
to TS so the repo can fully drop Python. All scripts read the same
`.env`/`.env.local` config as the app:

```bash
npm run init:db    # create tables + idempotent migrations (was init_db.py / migrate_*.py)
npm run seed       # idempotent catalog upsert — 6 courses, 18 lessons w/ study notes (was seed_courses.py)
npm run superadmin # upsert superadmin@smarttutor.com / SuperAdmin123! (was create_/fix_super_admin.py)
npm run keepalive [URL]            # single ping (default https://courser-api-18uo.onrender.com/api/health)
npm run keepalive -- --loop [URL]  # ping every 15s forever; --interval N for custom seconds (was keepalive.py)
```

`init:db` is a no-op against an already-migrated Neon DB; `seed` converges by
natural key (category/course slug, module/lesson order) so re-runs never
duplicate rows.

## Deploy (Render)

`render.yaml` is a blueprint for a `courser-api-node` web service (Node,
`npm ci && npm run build`, `npm start`, health check `/api/health`). Set
`SECRET_KEY`, `DATABASE_URL`, `OPENAI_API_KEY`, and SMTP vars in the
dashboard. Keep the old `courser-api-18uo` service running until the new one
is verified, then:

1. Point cron-job.org / the keepalive at `https://<node-host>/api/ping`.
2. Add the new host to `FRONTEND_ORIGINS`/`API_ORIGIN` (or point the frontend
   proxy at it).

## Layout

```
src/
  app.ts          Express app construction (importable by tests)
  index.ts        Boot: listen() + DB ping
  config.ts       Env loading + settings (mirrors core/config.py)
  db.ts           pg pool + query/get helpers (raw strings for timestamps)
  db/schema.ts    CREATE_TABLES DDL + idempotent MIGRATIONS (was init_db.py)
  db/init.ts      init:db runner (--reset)
  db/seed.ts      idempotent catalog seeder (was seed_courses.py)
  seed/courseSeedData.ts  CATEGORIES / LESSON_NOTES / COURSES data
  security.ts     bcrypt + JWT + token/auth helpers (core/security.py)
  errors.ts       HttpError + FastAPI {detail} error middleware
  headers.ts      Security headers + CORS origins (main.py)
  rateLimit.ts    Global + per-route limiters (auth.py)
  validate.ts     zod -> FastAPI 422 helper + email normalizer
  serialize.ts    Pydantic-style datetime normalization
  fallbacks.ts    FALLBACK_CATEGORIES / FALLBACK_COURSES constants
  middleware/auth.ts  requireUser / requireUserRow / requireAdmin
  services/       authService, streakService, aiService, emailService
  routes/         auth, courses, lessons, streak, newsletter
  public.test.ts  vitest + supertest suite
scripts/
  keepalive.ts        keepalive pinger (was backend/keepalive.py)
  createSuperAdmin.ts super admin upsert (was create_/fix_super_admin.py)
```