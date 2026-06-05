# COURSER2.0

COURSER2.0 is an AI-powered learning platform with a React frontend and FastAPI backend. It supports public course browsing, role-based dashboards, admin course creation, organized modules and lessons, and a mascot-assisted learning environment.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, PostgreSQL
- Auth: Role-based sessions for student, admin, and super admin users

## Local Development

```bash
# Backend
cd backend
cp .env.example .env  # Configure DATABASE_URL
python init_db.py
python create_super_admin.py
python seed_courses.py
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

The frontend runs on `http://127.0.0.1:5173` by default.

Backend setup expects environment values in `backend/.env`. Use `backend/.env.example` as the starting point.

## Deployment to Railway (Free Tier)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Install Railway CLI: `npm install -g @railway/cli`
3. Login: `railway login`

### Step 2: Create Project
```bash
# Create new project (will prompt for settings)
railway init

# Add PostgreSQL plugin
railway add postgresql
```

### Step 3: Deploy
```bash
# Set environment variables
railway variables set SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")

# Deploy
railway up
```

### Step 4: Initialize Database
```bash
# Open shell in deployed container
railway run python init_db.py
railway run python create_super_admin.py
railway run python seed_courses.py
```

### Alternative: Deploy from Railway Dashboard
1. Go to [railway.app](https://railway.app) → New Project
2. Select "Deploy from GitHub repo"
3. Choose your `COURSER2.0` repository
4. Railway will auto-detect the configuration from `railway.json`
5. Add PostgreSQL from the plugins section
6. Click Deploy

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@smarttutor.com | SuperAdmin123! |

## API Documentation

Available at `/docs` endpoint when backend is running (e.g., `https://your-app.railway.app/docs`).

## Project Notes

- `AGENTS.md` tracks active agent ownership and audit history.
- `docs/AGENT_ACTIVITY.md` contains the fuller collaboration log.
- `srs.md` contains the software requirements specification.
- `railway.json` contains Railway deployment configuration.
- `render.yaml` contains Render deployment configuration (alternative).
