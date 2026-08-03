"""FastAPI app entrypoint.

Pieces:

  * CORSMiddleware — only the explicitly allowed origins, with cookies.
  * SecurityHeadersMiddleware — adds CSP / HSTS / X-Frame-Options / etc.
  * slowapi rate limiter — keyed by IP, default 200/minute; tighter
    limits live on the auth routes.
  * Routers: /auth, /courses, /newsletter.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.api import auth, courses, newsletter
from app.core.database import engine


# --- rate limiter (must be wired before the app starts) ------------------

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


# --- security headers middleware -----------------------------------------

def _build_csp_header() -> str:
    """Build a CSP that locks down resources to known origins.

    `unsafe-inline` is required for styles because Vite injects inline
    `<style>` tags at runtime; tightening this further needs nonces."""
    frontend_origins = os.getenv("FRONTEND_ORIGINS", "https://courser2.vercel.app")
    api_origin = os.getenv("API_ORIGIN", "https://courser2.vercel.app")
    connect = " ".join(
        ["'self'", api_origin] + [o.strip() for o in frontend_origins.split(",") if o.strip()]
    )
    return (
        "default-src 'self'; "
        "img-src 'self' data:; "
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; "
        "font-src 'self' data: https://cdnjs.cloudflare.com; "
        f"connect-src {connect}; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'"
    )


SECURITY_HEADERS = {
    "Content-Security-Policy": _build_csp_header(),
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Stamp a fixed set of security headers on every response.

    These are the browser-side defense headers that protect against
    clickjacking (X-Frame-Options + CSP frame-ancestors), MIME sniffing
    (X-Content-Type-Options), protocol downgrade (HSTS), referrer
    leakage, and unwanted device APIs (Permissions-Policy)."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        for name, value in SECURITY_HEADERS.items():
            response.headers.setdefault(name, value)
        return response


# --- lifespan ------------------------------------------------------------


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


# --- app construction ----------------------------------------------------


# The API itself — every route and middleware lives here. It is mounted
# under `/api` by the gateway below so a single Vercel project can serve
# both the SPA and the API on one origin (/api/auth/login, /api/courses,
# /api/health). Local dev runs the same gateway (`uvicorn app.main:app`),
# so what you hit locally matches production exactly.
api_app = FastAPI(
    title="COURSER API",
    description="Course management API",
    version="1.0.0",
)

# Rate limiter state — slowapi looks this up to apply per-route limits.
api_app.state.limiter = limiter
api_app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
api_app.add_middleware(SlowAPIMiddleware)
api_app.add_middleware(SecurityHeadersMiddleware)


# CORS — cookies are required, so origins must be explicit (no "*").
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

# Allow common Vercel/hosted roots.
allowed_origins.extend(
    [
        "https://courser2.vercel.app",
        "https://courser-frontend.vercel.app",
    ]
)

api_app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=600,
)


# --- routers -------------------------------------------------------------

api_app.include_router(auth.router, prefix="/auth", tags=["auth"])
api_app.include_router(courses.router, prefix="/courses", tags=["courses"])
api_app.include_router(newsletter.router, prefix="/newsletter", tags=["newsletter"])


@api_app.get("/")
async def root():
    return {"message": "COURSER API"}


@api_app.get("/health")
async def health():
    return {"status": "healthy"}


# --- Vercel gateway ------------------------------------------------------
#
# The ASGI app uvicorn and Vercel load (`app.main:app`). It mounts api_app
# under `/api` so the SPA and API share one origin and auth cookies work
# with SameSite=Lax. The lifespan runs here because Starlette does NOT run
# the lifespan of mounted sub-apps.
app = FastAPI(
    title="COURSER API",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan,
)

# For mounted requests `request.app` resolves to this gateway — slowapi
# reads the limiter off it, so mirror the state here too.
app.state.limiter = limiter
app.mount("/api", api_app)


@app.get("/")
async def gateway_root():
    return {"message": "COURSER API", "docs": "/api/docs", "health": "/api/health"}
