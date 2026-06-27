# Dockerfile for Fly.io — runs the FastAPI backend on a single uvicorn worker.
# Multi-stage would be overkill for a 256 MB shared-cpu VM; we install into the
# runtime image directly.

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install deps first for layer caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# uvicorn needs to find the `app` package — backend/ on PYTHONPATH
ENV PYTHONPATH=/app/backend

EXPOSE 8080

# 1 worker is correct for a 256 MB VM. asyncpg + asyncio handle concurrency
# within that single worker. If you scale up the VM, bump --workers.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1", "--proxy-headers"]