#!/usr/bin/env bash
# One-command local development server for the COURSER backend.
#
# Uses SQLite (no external database required). Creates the SQLite file,
# seeds starter courses, then serves the API on http://127.0.0.1:8000
#
# Usage:  bash backend/run_local.sh
set -euo pipefail

cd "$(dirname "$0")"

echo "=== Installing backend dependencies ==="
pip install -r requirements.txt --quiet

echo "=== Initializing local SQLite database ==="
python init_db.py --reset

echo "=== Seeding starter courses ==="
python seed_courses.py

echo "=== Starting backend server (Ctrl+C to stop) ==="
echo "   API:    http://127.0.0.1:8000"
echo "   Health: http://127.0.0.1:8000/api/health"
echo "   Docs:   http://127.0.0.1:8000/api/docs"
echo ""
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
