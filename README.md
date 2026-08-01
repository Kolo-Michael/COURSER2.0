# COURSER2.0

COURSER is an AI-powered learning platform — a free, structured LMS where learners browse courses, enroll in seconds, and follow guided lessons. Built with a React frontend and FastAPI backend.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** FastAPI, SQLAlchemy, PostgreSQL (Neon)
- **Auth:** JWT-based role sessions (student, admin, super_admin)
- **AI Tutor:** Cora mascot built into every lesson workspace

## Local Development

```bash
# Backend
cd backend
cp .env.example .env   # Set DATABASE_URL + SECRET_KEY
pip install -r requirements.txt
python init_db.py
python create_super_admin.py
python seed_courses.py
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

The frontend runs on `http://127.0.0.1:5173` and the API on `http://127.0.0.1:8000`. API docs are at `/api/docs` when the backend is running.

## Deploy on Vercel (single project)

The SPA and the FastAPI backend are one Vercel project served from one
domain, so auth cookies work same-origin (`SameSite=Lax`). The backend
is mounted under `/api` (`/api/auth/login`, `/api/courses`, `/api/health`,
`/api/docs`); the root `vercel.json` builds the frontend and routes
`/api/*` to the Python function, everything else to the SPA.

1. Push this repo to GitHub, then in Vercel: **Add New → Project → import
   this repo.** Root Directory stays `/`.
2. Set these Environment Variables (Settings → Environment Variables) for
   the production/preview environments:
   - `DATABASE_URL` — your Neon pooler string:
     `postgresql+asyncpg://USER:PASS@ep-xxx-pooler.REGION.aws.neon.tech/Courser?sslmode=require`
   - `SECRET_KEY` — long random value
   - `FRONTEND_ORIGINS` — your Vercel domain(s), comma-separated
3. Deploy. `/api/health` returns `{"status":"healthy"}` once it's live.
4. Run DB setup once from your machine pointed at the same Neon URL:
   `python init_db.py`, `python create_super_admin.py`, `python seed_courses.py`.

Because functions are serverless, each request creates/tears down a DB
connection (`NullPool`) — Neon's pooler absorbs that. Run `init_db.py`
yourself after schema changes; there is no per-deploy hook on Vercel.

## Keeping the API warm

Vercel Hobby Functions go idle and pay a cold-start cost on the next
request. Pinging `/api/health` every 5 minutes keeps the Python runtime
warm. This repo ships a **GitHub Actions workflow** that does exactly
that, free (unlimited minutes on public repos):

1. Push this repo to GitHub — `.github/workflows/keep-alive.yml` pings
   `https://courser2.vercel.app/api/health` every 5 min automatically.
2. If the app ever moves hosts, set a repo **Variable** named `HEALTH_URL`
   (Settings → Secrets and variables → Actions → Variables).
3. If you see cold starts anyway (GitHub can delay a scheduled run, and
   disables schedules after ~60 days of repo inactivity), add a free
   external monitor as a backup:

   - [UptimeRobot](https://uptimerobot.com) (or
     [cron-job.org](https://cron-job.org)) — free tier
   - **Type:** HTTP(S), **URL:** `https://courser2.vercel.app/api/health`,
     **Interval:** 5 minutes

For schedulers that run commands instead of HTTP checks, use
`backend/keepalive.py` (stdlib only):

```bash
python backend/keepalive.py            # pings the default production URL
HEALTH_URL=https://... python backend/keepalive.py
```
