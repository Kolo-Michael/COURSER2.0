# COURSER2.0

COURSER2.0 is an AI-powered learning platform with a React frontend and FastAPI backend. It supports public course browsing, role-based dashboards, admin course creation, organized modules and lessons, and a mascot-assisted learning environment.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, PostgreSQL
- Auth: Role-based sessions for student, admin, and super admin users

## Local Development

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://127.0.0.1:5173` by default.

Backend setup expects environment values in `backend/.env`. Use `backend/.env.example` as the starting point.

## Project Notes

- `AGENTS.md` tracks active agent ownership and audit history.
- `docs/AGENT_ACTIVITY.md` contains the fuller collaboration log.
- `srs.md` contains the software requirements specification.
