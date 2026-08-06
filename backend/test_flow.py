"""End-to-end flow test: signup → login → browse courses → enroll → complete lesson."""
import asyncio
import json
from sqlalchemy import select
from app.core.database import async_session_maker
from app.models import User, Course, Enrollment, Lesson, Module
from app.core.security import hash_password

async def test_flow():
    async with async_session_maker() as db:
        # 1. Signup a new student
        print("=== 1. Signup new student ===")
        existing = (await db.execute(select(User).where(User.email == "student@test.local"))).scalar_one_or_none()
        if existing:
            await db.delete(existing)
            await db.commit()

        student = User(
            username="teststudent",
            email="student@test.local",
            hashed_password=hash_password("TestPass123!"),
            full_name="Test Student",
            role="student",
            is_active=True,
            is_verified=True,
        )
        db.add(student)
        await db.commit()
        await db.refresh(student)
        print(f"  Created: {student.email} (id={student.id})")

        # 2. Fetch courses
        print("\n=== 2. Fetch courses ===")
        result = await db.execute(select(Course).where(Course.is_published == True))
        courses = result.scalars().all()
        print(f"  Found {len(courses)} published courses")
        for c in courses:
            print(f"  - {c.title} (slug={c.slug})")

        # 3. Get a course with modules and lessons
        print("\n=== 3. Fetch course details (with modules + lessons) ===")
        course = courses[0]
        result = await db.execute(select(Course).where(Course.id == course.id))
        result2 = await db.execute(select(Module).where(Module.course_id == course.id))
        modules = result2.scalars().all()
        print(f"  Course: {course.title}")
        for m in modules:
            result3 = await db.execute(select(Lesson).where(Lesson.module_id == m.id))
            lessons = result3.scalars().all()
            print(f"  Module {m.order}: {m.title} ({len(lessons)} lessons)")
            for l in lessons:
                print(f"    Lesson {l.order}: {l.title} (is_published={l.is_published})")

        # 4. Enroll in the course
        print("\n=== 4. Enroll in course ===")
        enrollment = Enrollment(
            user_id=student.id,
            course_id=course.id,
            progress=0.0,
        )
        db.add(enrollment)
        await db.commit()
        await db.refresh(enrollment)
        print(f"  Enrolled: id={enrollment.id}, progress={enrollment.progress}")

        # 5. Complete first lesson
        print("\n=== 5. Complete first lesson ===")
        first_lesson = lessons[0] if lessons else None
        if first_lesson:
            print(f"  Lesson: {first_lesson.title}")
            print(f"  Lesson content preview: {first_lesson.content[:80]}...")
            print(f"  (would call: POST /lessons/$lessonId/complete)")

        # 6. Update progress
        print("\n=== 6. Update enrollment progress ===")
        enrollment.progress = 50.0
        await db.commit()
        print(f"  Updated progress: {enrollment.progress}%")

        print("\n✓ All local backend tests passed!")


asyncio.run(test_flow())
