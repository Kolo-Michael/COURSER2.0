import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, courses
from app.core.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Vercel Functions are serverless — the engine is created lazily on
    each cold start. We yield immediately and dispose the engine on
    shutdown (Vercel gives ~500ms for cleanup).
    """
    yield
    try:
        await engine.dispose()
    except Exception:
        # Best-effort — never fail the response because of cleanup.
        pass


app = FastAPI(
    title="COURSER API",
    description="Course management API",
    version="1.0.0",
    lifespan=lifespan,
)

frontend_origin = os.getenv("FRONTEND_ORIGIN")
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Comma-separated list of extra allowed origins — used so Vercel preview
# URLs and the production deployment can hit the API without per-deploy env
# changes.
extra_origins = os.getenv("FRONTEND_ORIGINS")
if extra_origins:
    allowed_origins.extend(
        [origin.strip() for origin in extra_origins.split(",") if origin.strip()]
    )

if frontend_origin:
    allowed_origins.append(frontend_origin)

# Allow any vercel.app subdomain (preview + production) — wildcard isn't
# supported by the CORS spec, so we just list the common host roots here and
# rely on FRONTEND_ORIGINS for additional environments.
allowed_origins.extend(
    [
        "https://courser2.vercel.app",
        "https://courser-frontend.vercel.app",
    ]
)

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
    return {"message": "COURSER API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
