# AGENTS.md - COURSER Project Audit Log

## Active Agents
- **Cursor:** Previous UI/UX & Frontend Lead.
- **Claude Code:** Backend, Security & API Architect.
- **Antigravity:** Overall Project Manager (SRS Compliance).
- **Codex:** UI/UX & Frontend Lead, AI Content Generation Specialist.

## Project Roadmap (Based on SRS v1.0)
- [ ] **Phase 1: Foundation** (Database Setup, Auth System)
- [ ] **Phase 2: Core Features** (Landing Page, Course Browsing)
- [ ] **Phase 3: Management** (Admin Dashboards, AI Generation)
- [ ] **Phase 4: Student Experience** (Student Dashboard, Progress Tracking)

## Activity Log
| Date | Agent | Task Performed | Files Changed | Status |
| :--- | :--- | :--- | :--- | :--- |
| 2026-05-09 | System | Initialized SRS.md and Rules | `SRS.md`, `.cursorrules` | Completed |
| 2026-05-09 | User | Defined Tech Stack & ERD | `SRS.md` | Completed |
| 2026-05-09 | Cursor | Frontend scaffold with Tailwind theme (`primary`, `accent`); Landing hero (LAND-1) | `frontend/*` | Completed |
| 2026-05-09 | Cursor | All SRS routes: auth, catalog, detail, dashboards, layouts, mock catalog data | `frontend/src/pages`, `frontend/src/components` | Completed |
| 2026-05-09 | Codex | Verified backend and frontend startup; backend healthy on `127.0.0.1:8000`, frontend healthy on `127.0.0.1:5173`; added missing backend dependency manifest and courses router; cleaned frontend title/copy punctuation | `backend/requirements.txt`, `backend/app/api/*`, `backend/app/core/database.py`, `frontend/index.html`, `frontend/src/components/landing/Hero.tsx` | Completed |
| 2026-05-09 | Codex | Created agent responsibility and activity documentation | `docs/AGENT_ACTIVITY.md`, `AGENTS.md` | Completed |
| 2026-05-10 | Codex | Took over Cursor frontend rules; added mock role-based login sessions and protected dashboard routing for student, admin, and super admin users | `.cursorrules`, `frontend/src/auth/session.ts`, `frontend/src/App.tsx`, `frontend/src/components/auth/LoginForm.tsx`, `frontend/src/components/layout/DashboardLayout.tsx`, `frontend/src/pages/*`, `AGENTS.md`, `docs/AGENT_ACTIVITY.md` | Completed |
| 2026-05-10 | Codex | Connected backend to Neon PostgreSQL, created schema, seeded starter catalog and super admin, fixed asyncpg SSL config and user self-reference, wired frontend auth/catalog/detail views to FastAPI | `backend/.env.example`, `backend/app/core/*`, `backend/app/models/user.py`, `backend/app/api/courses.py`, `backend/init_db.py`, `backend/seed_courses.py`, `backend/migrate_created_by_fk.py`, `frontend/src/api/*`, `frontend/src/components/auth/*`, `frontend/src/pages/CoursesPage.tsx`, `frontend/src/pages/CourseDetailPage.tsx`, `.gitignore`, `AGENTS.md`, `docs/AGENT_ACTIVITY.md` | Completed |
| 2026-05-13 | Codex | Removed public dashboard nav, split logged-in courses from public catalog, made course UI free by default, added default mascot-assisted learning environment, and added admin-only course/environment setup UI | `frontend/src/components/layout/SiteHeader.tsx`, `frontend/src/pages/CoursesPage.tsx`, `frontend/src/pages/CourseDetailPage.tsx`, `frontend/src/pages/AdminPage.tsx`, `frontend/src/api/courses.ts`, `frontend/src/App.tsx`, `AGENTS.md`, `docs/AGENT_ACTIVITY.md` | Completed |
| 2026-05-13 | Codex | Added floating dashboard navigation, expanded landing/student/super-admin pages with COURSER-owned stats and workflow features, upgraded lesson detail content, reseeded free real courses, added backend catalog fallback handling, and restarted backend after seed | `frontend/src/components/layout/DashboardLayout.tsx`, `frontend/src/pages/LandingPage.tsx`, `frontend/src/pages/DashboardPage.tsx`, `frontend/src/pages/SuperAdminPage.tsx`, `frontend/src/pages/CourseDetailPage.tsx`, `backend/app/api/courses.py`, `backend/app/core/database.py`, `backend/seed_courses.py`, `AGENTS.md`, `docs/AGENT_ACTIVITY.md` | Completed |
| 2026-05-20 | Codex | Added organized course-outline creation with modules and nested lessons from the admin builder through the course API | `frontend/src/pages/AdminPage.tsx`, `frontend/src/api/courses.ts`, `backend/app/api/courses.py`, `backend/app/schemas/course.py`, `AGENTS.md`, `docs/AGENT_ACTIVITY.md` | Completed |
| 2026-05-22 | Codex | Split logged-in courses into a distinct dashboard-library experience while keeping the COURSER visual design and removing login/signup prompts from the signed-in course flow | `frontend/src/pages/CoursesPage.tsx`, `frontend/src/pages/CourseDetailPage.tsx`, `AGENTS.md`, `docs/AGENT_ACTIVITY.md` | Completed |
| 2026-05-22 | Codex | Added show/hide password controls to login and signup forms | `frontend/src/components/auth/LoginForm.tsx`, `frontend/src/components/auth/SignupForm.tsx`, `AGENTS.md`, `docs/AGENT_ACTIVITY.md` | Completed |
| 2026-05-22 | Codex | Prepared repository handoff for GitHub, added README, and set project push policy for future completed changes | `README.md`, `AGENTS.md`, `docs/AGENT_ACTIVITY.md` | Completed |
| 2026-05-22 | Codex | Added free Render deployment blueprint and production same-origin frontend/API serving | `render.yaml`, `backend/app/main.py`, `frontend/src/api/client.ts`, `AGENTS.md`, `docs/AGENT_ACTIVITY.md` | Completed |

## Current Instructions
- **Next Task (Claude):** Review backend startup fixes, wire real database configuration/migrations, validate `backend/app/api/courses.py` against SRS Section 6.2, and complete any missing auth/course API behavior.
- **Next Task (Codex):** Continue Cursor's frontend lane: add landing feature sections (LAND-2-LAND-7), complete enrollment/progress UI, persist admin learning-environment settings when backend support is ready, and replace remaining placeholder dashboard widgets with API-backed data.
- **Project Watch:** Keep `docs/AGENT_ACTIVITY.md` and this audit log synchronized after each significant frontend, backend, SRS, or AI-content change.
- **Repository Push Policy:** After each completed project change, commit and push to `https://github.com/Kolo-Michael/COURSER2.0.git` unless the user explicitly says not to push.
