# Local Development — COURSER Backend

No external hosting or database required. Everything runs locally on SQLite.

## Quick Start (Windows)

```powershell
cd backend
.\run_local.bat
```

## Quick Start (Linux/macOS)

```bash
cd backend
bash run_local.sh
```

This script will:
1. Install Python dependencies (`pip install -r requirements.txt`)
2. Create local SQLite database (`courser_local.db`)
3. Seed 6 starter courses across 6 categories
4. Start the API server on `http://127.0.0.1:8000` with auto-reload

## Manual Setup (alternative)

```bash
cd backend
pip install -r requirements.txt
python init_db.py --reset
python seed_courses.py
python create_super_admin.py          # optional: creates superadmin@smarttutor.com / SuperAdmin123!
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Connecting the Web Frontend

The frontend auto-detects `http://127.0.0.1:8000` in dev mode:

```bash
cd frontend
npm install
npm run dev             # opens http://localhost:5173
```

## Connecting the Mobile App

The mobile app automatically uses `http://10.0.2.2:8000` (Android emulator)
or `http://127.0.0.1:8000` (iOS simulator) when `dart.vm.product` is `false`
(i.e. in debug mode).

**Physical device** — you need your machine's LAN IP:

```bash
flutter run --dart-define=COURSER_API_URL=http://192.168.1.100:8000/api
```

(Replace `192.168.1.100` with your actual local IP.)

## Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | Health check |
| `GET /api/docs` | Swagger UI (interactive docs) |
| `POST /api/auth/signup` | Register new user |
| `POST /api/auth/login` | Login (returns token in JSON body) |
| `GET /api/auth/me` | Get current user |
| `GET /api/courses` | List all published courses |
| `GET /api/courses/{id}` | Get a course by ID |
| `GET /api/courses/slug/{slug}` | Get a course by slug |
| `POST /api/courses/slug/{slug}/enroll` | Enroll in a course |
| `POST /api/courses/slug/{slug}/ask` | Ask Cora a question |

## Default Credentials

- **Super Admin:** `superadmin@smarttutor.com` / `SuperAdmin123!`
- Register new users via `POST /api/auth/signup`
