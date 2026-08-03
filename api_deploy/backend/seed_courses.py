import asyncio

from sqlalchemy import select

from app.core.database import async_session_maker
from app.models import Category, Course, Lesson, Module


async def get_or_create_category(db, categories, data):
    result = await db.execute(select(Category).where(Category.slug == data["slug"]))
    category = result.scalar_one_or_none()
    if category is None:
        category = Category(**data)
        db.add(category)
        await db.flush()
    else:
        for field, value in data.items():
            setattr(category, field, value)

    categories[data["slug"]] = category
    return category


async def upsert_course(db, categories, data):
    result = await db.execute(select(Course).where(Course.slug == data["slug"]))
    course = result.scalar_one_or_none()

    category = categories.get(data.pop("category_slug"))
    modules_data = data.pop("modules")
    data["price"] = 0.0
    data["is_published"] = True

    if course is None:
        course = Course(category_id=category.id if category else None, **data)
        db.add(course)
        await db.flush()
    else:
        for field, value in data.items():
            setattr(course, field, value)
        course.category_id = category.id if category else None
        await db.flush()

    for module_data in modules_data:
        lessons_data = module_data.pop("lessons")
        result = await db.execute(
            select(Module).where(Module.course_id == course.id, Module.order == module_data["order"])
        )
        module = result.scalar_one_or_none()
        if module is None:
            module = Module(course_id=course.id, **module_data)
            db.add(module)
            await db.flush()
        else:
            for field, value in module_data.items():
                setattr(module, field, value)

        for lesson_data in lessons_data:
            result = await db.execute(
                select(Lesson).where(Lesson.module_id == module.id, Lesson.order == lesson_data["order"])
            )
            lesson = result.scalar_one_or_none()
            lesson_data["is_published"] = True
            if lesson is None:
                db.add(Lesson(module_id=module.id, **lesson_data))
            else:
                for field, value in lesson_data.items():
                    setattr(lesson, field, value)


async def seed_courses():
    async with async_session_maker() as db:
        categories = {}
        for category_data in [
            {"name": "Web Development", "slug": "web-development", "icon": "fa-globe"},
            {"name": "Data Science", "slug": "data-science", "icon": "fa-database"},
            {"name": "Mobile Development", "slug": "mobile-development", "icon": "fa-mobile"},
            {"name": "DevOps", "slug": "devops", "icon": "fa-server"},
            {"name": "AI & Machine Learning", "slug": "ai-ml", "icon": "fa-brain"},
            {"name": "Product & Design", "slug": "product-design", "icon": "fa-pen-ruler"},
        ]:
            await get_or_create_category(db, categories, category_data)

        courses_data = [
            {
                "title": "Frontend Foundations with React",
                "slug": "frontend-foundations-react",
                "description": "Build responsive interfaces with HTML, CSS, JavaScript, React components, and reusable UI patterns.",
                "short_description": "Create polished React pages from the ground up.",
                "level": "beginner",
                "duration": "4 weeks",
                "is_featured": True,
                "is_ai_generated": False,
                "category_slug": "web-development",
                "modules": [
                    {
                        "title": "Build the page structure",
                        "description": "Start with semantic HTML and layout thinking.",
                        "order": 1,
                        "lessons": [
                            {
                                "title": "How the web page is assembled",
                                "content": "You will learn how headings, sections, links, images, and forms create a meaningful page structure before styling begins.",
                                "duration": "12 min",
                                "order": 1,
                            },
                            {
                                "title": "Responsive layout with flex and grid",
                                "content": "Practice building a course-card layout that works on mobile, tablet, and desktop screens.",
                                "duration": "18 min",
                                "order": 2,
                            },
                        ],
                    },
                    {
                        "title": "React components",
                        "description": "Turn repeated UI into maintainable components.",
                        "order": 2,
                        "lessons": [
                            {
                                "title": "Props, state, and reusable cards",
                                "content": "Create a reusable course card component, pass data into it, and render a catalog from an array.",
                                "duration": "22 min",
                                "order": 1,
                            },
                            {
                                "title": "Forms and local state",
                                "content": "Build a course search form and connect its input to filtered catalog results.",
                                "duration": "20 min",
                                "order": 2,
                            },
                        ],
                    },
                ],
            },
            {
                "title": "Python Data Analysis Starter",
                "slug": "python-data-analysis-starter",
                "description": "Use Python, pandas, and charts to clean data, answer questions, and explain insights.",
                "short_description": "Analyze real datasets with Python basics and pandas.",
                "level": "beginner",
                "duration": "3 weeks",
                "is_featured": True,
                "is_ai_generated": False,
                "category_slug": "data-science",
                "modules": [
                    {
                        "title": "Python for data work",
                        "description": "Learn the minimum Python needed for analysis.",
                        "order": 1,
                        "lessons": [
                            {
                                "title": "Variables, lists, and dictionaries",
                                "content": "Model student names, scores, and course progress using Python data structures.",
                                "duration": "15 min",
                                "order": 1,
                            },
                            {
                                "title": "Cleaning a messy table",
                                "content": "Use pandas to rename columns, handle missing values, and prepare a dataset for reporting.",
                                "duration": "24 min",
                                "order": 2,
                            },
                        ],
                    },
                    {
                        "title": "Explain the insight",
                        "description": "Move from numbers to decisions.",
                        "order": 2,
                        "lessons": [
                            {
                                "title": "Group, summarize, and compare",
                                "content": "Calculate completion rate by course category and identify where students need support.",
                                "duration": "21 min",
                                "order": 1,
                            },
                            {
                                "title": "Build a simple chart",
                                "content": "Create a bar chart and write a short recommendation from the result.",
                                "duration": "18 min",
                                "order": 2,
                            },
                        ],
                    },
                ],
            },
            {
                "title": "AI Prompting for Course Creators",
                "slug": "ai-prompting-course-creators",
                "description": "Plan lessons, quizzes, examples, and feedback using practical AI prompting workflows.",
                "short_description": "Use AI to draft better lessons and support learners.",
                "level": "intermediate",
                "duration": "2 weeks",
                "is_featured": True,
                "is_ai_generated": False,
                "category_slug": "ai-ml",
                "modules": [
                    {
                        "title": "Prompt with purpose",
                        "description": "Write prompts that produce usable teaching material.",
                        "order": 1,
                        "lessons": [
                            {
                                "title": "Define learner level and outcome",
                                "content": "Turn a broad topic into a clear learning objective, prerequisite list, and success check.",
                                "duration": "14 min",
                                "order": 1,
                            },
                            {
                                "title": "Generate examples and exercises",
                                "content": "Ask AI for examples, then improve them with constraints that match your course audience.",
                                "duration": "19 min",
                                "order": 2,
                            },
                        ],
                    },
                    {
                        "title": "Review and improve",
                        "description": "Use AI without losing quality control.",
                        "order": 2,
                        "lessons": [
                            {
                                "title": "Check accuracy and tone",
                                "content": "Create a review checklist for AI lesson drafts before publishing.",
                                "duration": "17 min",
                                "order": 1,
                            },
                            {
                                "title": "Create Cora-style hints",
                                "content": "Write mascot responses that guide learners without giving away every answer.",
                                "duration": "20 min",
                                "order": 2,
                            },
                        ],
                    },
                ],
            },
            {
                "title": "Mobile App Basics with React Native",
                "slug": "mobile-app-basics-react-native",
                "description": "Create a simple mobile learning app screen with navigation, cards, and touch-friendly components.",
                "short_description": "Build mobile screens with React Native fundamentals.",
                "level": "intermediate",
                "duration": "4 weeks",
                "is_featured": False,
                "is_ai_generated": False,
                "category_slug": "mobile-development",
                "modules": [
                    {
                        "title": "Mobile UI essentials",
                        "description": "Design for smaller screens and touch interactions.",
                        "order": 1,
                        "lessons": [
                            {
                                "title": "Native components and layout",
                                "content": "Use View, Text, Pressable, and ScrollView to build a course dashboard screen.",
                                "duration": "20 min",
                                "order": 1,
                            },
                            {
                                "title": "Navigation and screens",
                                "content": "Connect a catalog screen to a course detail screen using navigation patterns.",
                                "duration": "22 min",
                                "order": 2,
                            },
                        ],
                    }
                ],
            },
            {
                "title": "DevOps Launch Checklist",
                "slug": "devops-launch-checklist",
                "description": "Prepare a web app for release with environment variables, build checks, health checks, and deployment habits.",
                "short_description": "Ship applications with repeatable checks.",
                "level": "intermediate",
                "duration": "3 weeks",
                "is_featured": False,
                "is_ai_generated": False,
                "category_slug": "devops",
                "modules": [
                    {
                        "title": "Release readiness",
                        "description": "Make deployment less fragile.",
                        "order": 1,
                        "lessons": [
                            {
                                "title": "Environment variables and secrets",
                                "content": "Separate local, staging, and production configuration without leaking sensitive values.",
                                "duration": "16 min",
                                "order": 1,
                            },
                            {
                                "title": "Build and health checks",
                                "content": "Run frontend builds, backend health checks, and smoke tests before shipping.",
                                "duration": "18 min",
                                "order": 2,
                            },
                        ],
                    }
                ],
            },
            {
                "title": "Product Design for Learning Platforms",
                "slug": "product-design-learning-platforms",
                "description": "Design course catalogs, learning dashboards, lesson screens, and helper mascots for student progress.",
                "short_description": "Design focused learning experiences like a product team.",
                "level": "beginner",
                "duration": "3 weeks",
                "is_featured": False,
                "is_ai_generated": False,
                "category_slug": "product-design",
                "modules": [
                    {
                        "title": "Learning experience design",
                        "description": "Make pages help students decide, start, and continue.",
                        "order": 1,
                        "lessons": [
                            {
                                "title": "Catalog decisions",
                                "content": "Organize course cards, filters, levels, and progress signals so students can choose confidently.",
                                "duration": "15 min",
                                "order": 1,
                            },
                            {
                                "title": "Mascot support patterns",
                                "content": "Design helper prompts that answer questions without distracting from the lesson.",
                                "duration": "18 min",
                                "order": 2,
                            },
                        ],
                    }
                ],
            },
        ]

        for raw_course_data in courses_data:
            await upsert_course(db, categories, raw_course_data.copy())

        await db.commit()
        print("Free learning courses seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_courses())
