from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, courses

app = FastAPI(title="SmartTutor API", description="Course management API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
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
