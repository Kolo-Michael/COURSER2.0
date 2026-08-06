# opencode.md — COURSER Project Assistant

## Role
I am **opencode**, an AI coding agent that works directly in your terminal. I can read/write files, run commands, search code, and deploy infrastructure.

## What I've Done for COURSER

### 1. Fixed Authentication (401 Login Error)
- **Root cause:** `create_super_admin.py` used SHA-256 password hashing, but auth system uses bcrypt
- **Fix:** Created `fix_super_admin.py` to re-hash password with bcrypt
- **Result:** Login now works at `https://api-black-six-17.vercel.app/api/auth/login`

### 2. Fixed Cross-Origin Cookie Issues
- **Problem:** Frontend (`courser-2-0.vercel.app`) and API (`api-black-six-17.vercel.app`) on different origins — `SameSite=lax` blocked cookies
- **Fix:** Changed cookie settings to `SameSite=none; Secure` in `backend/app/api/auth.py`
- **Result:** Cross-origin auth works

### 3. Deployed Frontend to Vercel
- **URL:** `https://courser-2-0.vercel.app`
- **Config:** `vercel.json` builds frontend only, points `VITE_API_BASE_URL` to API

### 4. Built Complete Password Reset Flow
**Backend (`backend/app/`):**
- `schemas/auth.py` — Added `ForgotPasswordRequest`, `VerifyCodeRequest`, `ResetPasswordRequest`
- `models/user.py` — Added `PasswordResetToken` model (6-digit code, 15-min expiry, 3-attempt limit)
- `services/email_service.py` — Email sending (logs in dev, SMTP in prod)
- `services/auth_service.py` — `request_password_reset()`, `verify_reset_code()`, `reset_password()`
- `api/auth.py` — Endpoints: `/forgot-password`, `/verify-code`, `/reset-password`

**Frontend (`frontend/src/components/auth/`):**
- `ForgotPasswordForm.tsx` — Email input, sends code
- `VerifyCodeForm.tsx` — 6-digit code input, auto-focus, paste support, resend timer
- `ResetPasswordForm.tsx` — New password + confirm, validation
- `AuthPage.tsx` — Routes: `login`, `signup`, `forgot-password`, `verify-code`, `reset-password`

### 5. API Deployment Challenge
**Problem:** Vercel's Python builder uses 3.14 which breaks `pydantic-core` (pyo3 0.24.1 incompatible)

**Solution:** Deploy API to Render/Railway/Fly.io (Python 3.13 support)

**Configs created:**
- `render.yaml` — Render Blueprint (web service, rootDir: backend)
- `railway.toml` — Railway config
- `fly.toml` — Fly.io config
- `backend/Dockerfile` — Python 3.13 slim
- `backend/railway.toml` — Railway nixpacks config

### 6. Render Deployment (In Progress)
- Build: ✅ Successful
- Health check: Fixed path to `/api/health`
- Need: Add env vars in Render dashboard, wait for cold start

## Current Status

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | ✅ Live | `https://courser-2-0.vercel.app` |
| Auth API | ✅ Working | `https://api-black-six-17.vercel.app/api/auth/*` |
| Password Reset | ✅ Code complete | Ready |
| API Hosting | 🔄 In progress | Deploying to Render |

## Next Steps
1. In Render Dashboard → Add env vars (DATABASE_URL, SECRET_KEY, etc.)
2. Wait for service to wake up (free tier cold start ~60s)
3. Copy Render URL → Vercel Dashboard → `api-url` env var
4. Redeploy frontend (auto on env change)

## Key Files Modified
```
backend/app/api/auth.py           # Cookie settings, new endpoints
backend/app/services/auth_service.py  # Password reset logic
backend/app/services/email_service.py # Email sending
backend/app/models/user.py        # PasswordResetToken model
backend/app/schemas/auth.py       # New request schemas
frontend/src/api/auth.ts          # New API functions
frontend/src/components/auth/     # 3 new form components
frontend/src/pages/AuthPage.tsx   # Updated routing
vercel.json                       # Frontend-only deploy
render.yaml                       # Render Blueprint
```

## How to Work With Me
- Ask me to **edit files**, **run commands**, **search code**, **debug issues**
- I work in your terminal — changes are real
- I'll ask before destructive actions
- Say "continue" if I pause mid-task