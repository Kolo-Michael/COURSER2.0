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

The frontend runs on `http://127.0.0.1:5173` and the API on `http://127.0.0.1:8000`. API docs are at `/docs` when the backend is running.
