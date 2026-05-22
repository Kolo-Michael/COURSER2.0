# CLAUDE.md - Backend Instructions

## Technical Environment
- **Python:** 3.11+
- **Framework:** FastAPI with Uvicorn.
- **Database Logic:** Use Pydantic schemas for data validation and SQLAlchemy for ORM.

## Specific Task Instructions
- **AI Course Generation (CMGT-2):** When drafting AI services, use a structured JSON prompt to ensure the output matches the `Modules` and `Lessons` schema in SRS Section 6.2.
- **Auth (AUTH-1 to 8):** Implement role-based access control (RBAC) specifically for 'student', 'admin', and 'super_admin'.

## Automation
- Before finishing, check for the existence of `init_db.py` to ensure migrations are handled.
- Log all backend API changes to the "Activity Log" in `AGENTS.md`.