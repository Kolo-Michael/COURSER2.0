"""
Vercel Functions entrypoint for the COURSER FastAPI backend.

Vercel's Python runtime looks for an ASGI app named `app` at this module
path (configured via `tool.vercel.entrypoint` in pyproject.toml). This file
is a thin re-export — all business logic lives in `backend/app/main.py`.
"""

# Make `backend.app.*` importable when Vercel bundles this file. The
# backend uses absolute imports (`from app.core.config import settings`)
# so we need both the project root AND the backend directory on sys.path.
import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_HERE)
_BACKEND_DIR = os.path.join(_PROJECT_ROOT, "backend")

for _path in (_PROJECT_ROOT, _BACKEND_DIR):
    if _path not in sys.path:
        sys.path.insert(0, _path)

from backend.app.main import app  # noqa: E402,F401  (re-exported for Vercel)
