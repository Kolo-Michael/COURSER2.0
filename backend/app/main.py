import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from app.api import auth, courses

app = FastAPI(title="SmartTutor API", description="Course management API", version="1.0.0")

frontend_origin = os.getenv("FRONTEND_ORIGIN")
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if frontend_origin:
    allowed_origins.append(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(courses.router, prefix="/courses", tags=["courses"])


@app.get("/")
async def root():
    return {"message": "SmartTutor API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


frontend_dist = Path(__file__).resolve().parents[3] / "frontend" / "dist"

if frontend_dist.exists():
    assets_path = frontend_dist / "assets"
    if assets_path.exists():
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        requested_path = frontend_dist / full_path
        if requested_path.is_file():
            return FileResponse(requested_path)
        return FileResponse(frontend_dist / "index.html")
