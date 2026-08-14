"""Seed script for the free course catalog.

Strategy:
  * Idempotent by natural key. Categories are keyed on `slug`; courses on
    `slug`; modules on (course, order); lessons on (module, order). Rows
    that already exist are UPDATED in place, missing ones are INSERTED — so
    running this script any number of times converges to this content.
  * Every lesson gets its organized study notes from `LESSON_NOTES` (looked
    up by title) so learners have readable material even without a video.
  * Courses are always forced to `price=0.0` and `is_published=True` so the
    catalog is always free and always visible after seeding.

Run: `python seed_courses.py`.
"""

import asyncio

from sqlalchemy import select

from app.core.database import async_session_maker
from app.models import Category, Course, Lesson, Module


# Structured, readable study notes for every lesson. Used when a lesson has
# no video yet so learners can still complete it. Format: `## Heading` for
# sections, `- ` for bullets, `1. ` for numbered lists, plain lines for
# paragraphs, and `**bold**` for inline emphasis. The web reader renders
# these as organized notes with a check-your-understanding box.
LESSON_NOTES = {
    "How the web page is assembled": """\
## Overview
A web page is a text file that the browser reads, interprets, and paints to your screen. Understanding how the pieces fit together — document structure, styling, behavior, and assets — makes every later lesson easier.

## Key concepts
- **HTML** defines the structure: headings, sections, paragraphs, links, images, and forms.
- **CSS** defines the presentation: colors, spacing, fonts, and layout on different screens.
- **JavaScript** defines the behavior: what happens when a user clicks, types, or submits.
- The browser loads the HTML first, then fetches linked CSS and script files and applies them.
- Elements are nested like a tree — each box can contain other boxes (the DOM tree).

## How to apply it
Open any page in your browser and use **View source** or **Inspect** (F12). You will see the same pattern everywhere: a semantic structure wrapped in styled boxes, with scripts adding interactivity. Name which tags are structure, which rules are style, and which behavior is script.

## Key takeaways
- Structure (HTML), presentation (CSS), and behavior (JS) are separate but work together.
- The DOM tree explains why elements are laid out the way they are.
- Every styling or layout decision starts with a question about structure.

## Check your understanding
- What three jobs do HTML, CSS, and JavaScript each perform on a page?
- Why does nesting matter when you design a page layout?
- Where in the browser can you inspect the structure of any element?""",
    "Responsive layout with flex and grid": """\
## Overview
Responsive design means your layout adapts to the device: phones, tablets, and desktops. CSS Flexbox and Grid give you two powerful tools for arranging content without hand-picking sizes.

## Key concepts
- **Flexbox** arranges items in a single row or column, good for toolbars, cards, and nav bars.
- **Grid** arranges content in rows *and* columns, good for full-page layouts and dashboards.
- `flex-wrap: wrap` lets a row of cards collapse onto multiple lines on small screens.
- `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))` makes columns fluid.
- Media queries switch rules at widths like 640px, 768px, and 1024px.

## How to apply it
Build a course-card layout: use Grid for the page body and Flexbox for the card's internal meta row. Watch it snap between one column (mobile) and three columns (desktop) as the viewport grows.

## Key takeaways
- Flex = one axis; Grid = two axes. Pick by the shape you are arranging.
- Fluid units and wrapping beat fixed pixel widths for responsiveness.
- Test at real phone, tablet, and desktop widths — not just in one browser.

## Check your understanding
- When would you choose Flexbox over Grid, and vice versa?
- What does `minmax(240px, 1fr)` do inside `repeat()`?
- How does a media query change the layout at a breakpoint?""",
    "Props, state, and reusable cards": """\
## Overview
React components are the building blocks of an interface. Props let you feed data into a component, and state lets a component remember and change its own data. Together they let you render a catalog from one reusable card component.

## Key concepts
- **Props** are read-only inputs passed from a parent, like `course={{ title, level }}`.
- **State** is data the component owns and can update with `useState`.
- One component, many instances: a single `CourseCard` can render every course.
- Mapping over an array (`courses.map(c => <CourseCard course={c} />)`) turns data into UI.
- Keys (`key={course.id}`) help React track each item efficiently.

## How to apply it
Turn the course list from static markup into a reusable `<CourseCard>` that receives a `course` prop. Add a `useState` search field and filter the array before mapping it.

## Key takeaways
- Props flow down; state lives where it changes.
- Reusable components reduce duplication and make updates one-place changes.
- Lists in React are just `map()` over data with a stable key.

## Check your understanding
- What is the difference between props and state?
- Why must each item in a mapped list have a unique key?
- How would you reuse one card component for both featured and regular courses?""",
    "Forms and local state": """\
## Overview
Forms capture what the user wants. In React, the classic pattern is a "controlled" input: the input's value lives in state, and every keystroke updates it.

## Key concepts
- A controlled input reads `value={query}` and updates on `onChange`.
- `useState` holds the search text; the input is always in sync with it.
- Filtering is derived state: `courses.filter(c => c.title.includes(query))`.
- `onSubmit` prevents the page reload that a native form would cause.
- Clear feedback — visible results or a friendly empty state — matters more than validation messages.

## How to apply it
Build a course search form: a controlled input, a submit handler, a filtered list, and an empty state saying "No courses match your search."

## Key takeaways
- Controlled inputs keep the DOM and state in one source of truth.
- Derived values (filters) should not be stored — compute them from state.
- Handle both the "results" case and the "nothing found" case.

## Check your understanding
- What does it mean for an input to be "controlled"?
- Why is filtering called derived state?
- What should users see when no courses match their search?""",
    "Variables, lists, and dictionaries": """\
## Overview
Python's core data structures — variables, lists, and dictionaries — are the raw material for every analysis. This lesson builds the toolkit you will use to model real student data.

## Key concepts
- **Variables** give a name to a value: `completion_rate = 0.86`.
- **Lists** hold ordered sequences: `lessons = ["intro", "setup", "review"]`.
- **Dictionaries** map keys to values: `student = {"name": "Ada", "score": 92}`.
- Indexing and slicing pull items out: `lessons[0]`, `scores[-1]`.
- Loops iterate: `for name in names:` runs the block once per item.

## How to apply it
Model three students as a list of dictionaries, then loop over the list to print each name and score. Try appending a fourth student and re-running — the loop handles it without edits.

## Key takeaways
- Pick the structure that matches the shape: sequence → list, keyed lookup → dict.
- Loops let one block of code handle any number of items.
- Naming variables well is half of readable analysis code.

## Check your understanding
- When is a list the right choice, and when is a dictionary?
- What does `for student in students:` do?
- How would you store a whole course (title, level, lessons) in one variable?""",
    "Cleaning a messy table": """\
## Overview
Real datasets arrive messy: missing values, inconsistent names, extra columns. Cleaning is the unglamorous step that decides whether your analysis can be trusted.

## Key concepts
- **pandas** tables are called DataFrames — think "spreadsheet in Python".
- `df.rename(columns={...})` fixes inconsistent column names.
- `df.dropna()` and `df.fillna(value)` handle missing values.
- `df["col"].str.strip().str.lower()` normalizes text like "Intro " vs "intro".
- Keep a copy of the raw data; never overwrite the original blindly.

## How to apply it
Load a CSV of student progress, inspect it with `df.info()` and `df.head()`, then rename columns, fill or drop missing values, and normalize categories before summarizing.

## Key takeaways
- Clean data first — garbage in, garbage out.
- `info()`, `head()`, and `describe()` are your first three calls.
- Document every cleaning decision so the analysis is reproducible.

## Check your understanding
- Why should you inspect before you clean?
- What is the difference between `dropna()` and `fillna()`?
- How do you make "Intro " and "intro" match?""",
    "Group, summarize, and compare": """\
## Overview
Once data is clean, you summarize it to answer questions: What is the average completion rate per category? Which group needs the most support?

## Key concepts
- `df.groupby("category")["completion_rate"].mean()` groups rows and computes one number per group.
- `agg()` lets you compute several stats at once: mean, count, min, max.
- Comparisons across groups surface the biggest gaps.
- Summary numbers are only useful with context — compare them to the overall average.

## How to apply it
Group the progress dataset by course category and compute mean completion and the number of students per category. Rank categories to find where support is most needed.

## Key takeaways
- Groupby splits, applies, and combines in one expressive step.
- Summaries answer questions; they do not end them — follow up with why.
- Always report the group size alongside the average.

## Check your understanding
- What does `groupby(...).mean()` return?
- Why report counts with averages?
- How would you compare each category's completion to the overall average?""",
    "Build a simple chart": """\
## Overview
A chart translates numbers into a story your audience can grasp at a glance. Matplotlib is the standard tool for quick, publication-quality plots in Python.

## Key concepts
- **Bar charts** compare categories (completion rate by course).
- `plt.bar(x, heights)` draws the bars; labels make them legible.
- `plt.title`, `plt.xlabel`, `plt.ylabel` turn a graphic into an explanation.
- A short recommendation sentence beneath the chart completes the analysis.
- Keep charts simple: one idea per chart, clear axis labels, honest scales.

## How to apply it
Take the grouped completion rates, plot them as bars, label the axes, and write one sentence recommending where to focus next.

## Key takeaways
- Charts are for decisions, not decoration.
- Label everything — an unlabeled axis is a guess.
- Pair every chart with a one-line takeaway.

## Check your understanding
- When is a bar chart the right choice?
- What four things does every chart need to be readable?
- How does the chart reinforce the recommendation you wrote?""",
    "Define learner level and outcome": """\
## Overview
A great lesson starts before any content is written: you define who the learner is and what they should be able to do when they finish. This outcome is the contract between you and the learner.

## Key concepts
- A **learning outcome** states what the learner can *do*, not just know: "build a course search form".
- **Prerequisites** list what the learner must already know.
- A **success check** is a small task that proves the outcome is met.
- Level (beginner/intermediate) sets vocabulary, pacing, and examples.
- Prompt the AI with all four and it will draft content that fits.

## How to apply it
Write a prompt like: "For a beginner with basic HTML, create a lesson that ends with the learner able to build a search form. Include a 5-question success check." Then evaluate the draft against your outcome.

## Key takeaways
- Outcomes describe observable behavior, not vague topics.
- Prerequisites + level tune difficulty automatically.
- A success check is how you know the lesson worked.

## Check your understanding
- Rewrite "understand React" as a measurable outcome.
- Why do prerequisites matter for AI-generated content?
- What makes a good success check?""",
    "Generate examples and exercises": """\
## Overview
Examples make abstract ideas concrete, and exercises make them stick. The quality of the prompt controls the quality of both.

## Key concepts
- Ask for **worked examples** that show the full journey, not just the answer.
- Request **varied difficulty**: easy, medium, and stretch exercises.
- Add **constraints** — "no advanced features", "use the same dataset", "under 5 lines" — to match your audience.
- Require an **answer key or rubric** so exercises are usable in the course.
- Iterate: the first draft is a starting point, not the final deliverable.

## How to apply it
Prompt: "Generate three exercises for a beginner lesson on flexbox — one easy, one medium, one stretch — each with a model answer and one common mistake to watch for."

## Key takeaways
- Constrain the prompt and the exercises will fit your audience.
- Every exercise needs an answer or a rubric to be useful.
- Plan for iteration: refine, do not settle.

## Check your understanding
- What three difficulty levels should an exercise set span?
- Why include "common mistakes" in a prompt?
- What is a rubric and when do you need one?""",
    "Check accuracy and tone": """\
## Overview
AI drafts fast, but it can be confidently wrong. A review checklist catches factual errors, mismatched difficulty, and tone that does not fit your course.

## Key concepts
- Verify every factual claim against a trusted source before publishing.
- Confirm the difficulty matches the declared level — AI often drifts harder.
- Check the tone: consistent with your course voice and appropriate for the audience.
- Look at what the content actually teaches: does it hit your stated outcome?
- Keep a changelog of fixes so the lesson improves over time.

## How to apply it
Create a 5-item review checklist (facts, difficulty, tone, outcome alignment, examples) and run it on an AI draft before you publish.

## Key takeaways
- Trust but verify — especially names, numbers, and APIs.
- Difficulty drift is the most common AI editing catch.
- A written checklist makes review consistent across lessons.

## Check your understanding
- What is the most common way AI content misses the target level?
- Why is "outcome alignment" a review step?
- Name three checklist items you would apply to any AI draft.""",
    "Create Cora-style hints": """\
## Overview
A good hint nudges a stuck learner forward without giving the answer away. Cora-style hints use this principle in small, escalating doses.

## Key concepts
- **Hint layers** escalate: a nudge, a clue, then the approach, only after the learner is still stuck.
- Hints ask **questions** ("What should each row in your data represent?") before stating answers.
- Keep hints to **one idea** per message so they are easy to act on.
- Hints should mirror the course's own vocabulary so learners connect the dots.
- Feedback for the "wrong path" matters as much as hints for the "stuck" path.

## How to apply it
Write a three-level hint chain for your last exercise: a nudge, a clue, and a full approach. Keep each level to one or two sentences.

## Key takeaways
- Escalate: nudge → clue → approach.
- Prefer questions over answers.
- One idea per hint, in the course's own words.

## Check your understanding
- Why do hints escalate instead of jumping to the answer?
- Write a nudge, a clue, and an approach for a beginner exercise.
- Why should hints use the course's own vocabulary?""",
    "Native components and layout": """\
## Overview
React Native lets you build mobile apps with JavaScript by composing native components. The same component mindset as the web carries over, but the building blocks are mobile-native.

## Key concepts
- **View** is a container (like a div), **Text** renders strings, **Pressable** handles taps.
- **ScrollView** makes content scrollable on small screens.
- Layout is done with Flexbox — `flexDirection`, `justifyContent`, and `gap` control positioning.
- Styling uses inline objects (`style={{ flex: 1 }}`), not CSS files.
- Touch targets should be comfortably large (44pt minimum) for fingers.

## How to apply it
Build a dashboard screen: a ScrollView wrapping a header, a couple of course cards, and a bottom action button, all laid out with Flexbox.

## Key takeaways
- Components are the same idea as the web; the primitives differ.
- Flexbox is the layout engine on both platforms.
- Design for thumbs, not mice.

## Check your understanding
- Which component do you use for a tappable button?
- How do you make a list of cards scrollable?
- Why should touch targets be at least 44pt?""",
    "Navigation and screens": """\
## Overview
A mobile app is a stack of screens. Navigation moves the user between them while keeping the transition natural and the state preserved.

## Key concepts
- A **stack navigator** pushes and pops screens like a deck of cards.
- Navigation params pass data between screens (`route.params.courseId`).
- The back button and gestures are handled by the navigator for you.
- Keep navigation **shallow**: deep stacks confuse users on small screens.
- Every screen needs a clear title and a way back home.

## How to apply it
Connect a catalog list screen to a course detail screen. Tapping a card navigates with the course id; the detail screen reads it from the params and fetches the course.

## Key takeaways
- Screens + params = a navigable app.
- Let the navigator own back gestures and history.
- Title every screen; keep stacks shallow.

## Check your understanding
- What is a stack navigator?
- How does data travel from the list screen to the detail screen?
- Why should navigation stay shallow on mobile?""",
    "Environment variables and secrets": """\
## Overview
Code and configuration are different things. Environment variables let you keep secrets and environment-specific values out of your source code.

## Key concepts
- **Environment variables** are key/value pairs the runtime provides to your app.
- Separate local, staging, and production config with different values — not different code.
- **Secrets** (API keys, DB passwords, tokens) must never be committed to source control.
- Use `.env` files locally, but keep them out of git; use a secret manager in production.
- Fail loudly if a required variable is missing at startup.

## How to apply it
Move your database URL and API base URL into environment variables. Add a startup check that fails fast when a required variable is absent, and confirm `.env` is gitignored.

## Key takeaways
- Config differs by environment; code does not.
- Secrets live in a secret manager or env, never in the repo.
- Fail fast on missing required variables.

## Check your understanding
- Why should config never live in source code?
- Where do secrets go in production vs locally?
- What should happen when a required variable is missing?""",
    "Build and health checks": """\
## Overview
Deploying is risky until you prove the app is actually healthy. Build checks, health endpoints, and smoke tests turn deployment from a gamble into a checklist.

## Key concepts
- **Build checks** fail the pipeline if code does not compile or type-check.
- A **health endpoint** (`/api/health`) reports whether the app can serve traffic.
- **Smoke tests** verify the critical path after deploy (login → load → read).
- Run checks in a fixed order: build → unit → health → smoke → ship.
- Alert when a health check fails instead of waiting for users to complain.

## How to apply it
Wire a health endpoint, add a script that curls it after deploy, and write one smoke test that signs in and loads the dashboard. Fail the release if any step fails.

## Key takeaways
- Checks catch problems the team has not hit yet.
- Health endpoints turn monitoring into a simple HTTP call.
- Ship only when the whole checklist passes.

## Check your understanding
- What does a health endpoint report?
- What is a smoke test and when do you run it?
- Why run build checks before deploying?""",
    "Catalog decisions": """\
## Overview
The course catalog is where students decide to start. Its design should remove friction, build confidence, and make progress signals obvious.

## Key concepts
- **Course cards** need the essentials: title, topic, level, duration, and a clear action.
- **Filters and search** should narrow without overwhelming — visible but optional.
- **Progress signals** (a progress bar, "continue") pull returning students back in.
- Hierarchy beats decoration: one primary action per card.
- Consistent card anatomy makes scanning fast.

## How to apply it
Audit a catalog page: is there one obvious primary action per card? Can a returning student see where they left off? Are filters clear without instruction?

## Key takeaways
- Decisions, not decoration, drive catalog design.
- Returning students need progress signals at a glance.
- One primary action per card keeps users unblocked.

## Check your understanding
- What five essentials belong on every course card?
- How do progress signals help returning students?
- Why should there be one primary action per card?""",
    "Mascot support patterns": """\
## Overview
A learning helper — like Cora — answers questions and guides without distracting. The design of its prompts decides whether support feels helpful or annoying.

## Key concepts
- **Support appears in context**: alongside the lesson, never popping over it.
- Messages are **short and actionable**: one idea, one next step.
- The helper should **ask before acting**, not interrupt.
- A small, consistent visual identity (shape, colors, placement) builds trust.
- Escalate gracefully: hint → explanation → example → full walkthrough.

## How to apply it
Review the Cora panel in a lesson: does it sit beside the content, answer in one clear idea, and offer escalating help without covering the lesson?

## Key takeaways
- Context-aware, non-blocking support beats pop-ups.
- One idea per message, always with a next step.
- A consistent mascot identity makes help feel familiar.

## Check your understanding
- Where should helper prompts appear relative to the lesson?
- Why should support messages carry one idea and one next step?
- How does escalation work from hint to full walkthrough?""",
}


async def get_or_create_category(db, categories, data):
    """Fetch a category by slug, creating or updating it, and index it.

    Keyed on slug so the same categories survive re-runs without dupes.
    The returned/updated object is cached in the `categories` dict for
    later course lookups.
    """
    result = await db.execute(select(Category).where(Category.slug == data["slug"]))
    category = result.scalar_one_or_none()
    if category is None:
        category = Category(**data)
        db.add(category)
        await db.flush()  # flush to get the id for FK references
    else:
        # Existing category — apply fresh values (names/icons can change).
        for field, value in data.items():
            setattr(category, field, value)

    categories[data["slug"]] = category
    return category


async def upsert_course(db, categories, data):
    """Insert-or-update a course, its modules, and their lessons.

    `data` uses `category_slug` + `modules` shorthand; those are pulled out
    and resolved to real objects before the row is built. Each level
    (course → module → lesson) is upserted by its natural key so the seed
    is fully idempotent.
    """
    result = await db.execute(select(Course).where(Course.slug == data["slug"]))
    course = result.scalar_one_or_none()

    category = categories.get(data.pop("category_slug"))
    modules_data = data.pop("modules")
    # Course catalog is always free and always published after seeding.
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
            # Every lesson ships with organized, readable notes (even without
            # a video) so learners can always study and complete the course.
            lesson_data["content"] = LESSON_NOTES.get(lesson_data["title"], lesson_data.get("content", ""))
            if lesson is None:
                db.add(Lesson(module_id=module.id, **lesson_data))
            else:
                for field, value in lesson_data.items():
                    setattr(lesson, field, value)


async def seed_courses():
    """Seed all categories and courses, then commit once at the end."""
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
            # `.copy()` so the shared raw dict isn't mutated across loops.
            await upsert_course(db, categories, raw_course_data.copy())

        # One commit for the whole seed — either everything lands or nothing.
        await db.commit()
        print("Free learning courses seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_courses())
