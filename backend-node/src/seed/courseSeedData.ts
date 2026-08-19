/**
 * Seed data — direct port of backend/seed_courses.py constants.
 *
 * CATEGORIES / COURSES are the free catalog; LESSON_NOTES is the structured
 * study-notes content injected into every lesson so learners have readable
 * material even without a video.
 */

export interface SeedCategory {
  name: string;
  slug: string;
  icon: string | null;
}

export interface SeedLink {
  title: string;
  url: string;
  license?: string;
}

export interface SeedQuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
}

export interface SeedQuiz {
  pass_percent: number;
  questions: SeedQuizQuestion[];
}

export interface SeedLesson {
  title: string;
  content: string;
  duration: string | null;
  order: number;
  is_published: boolean;
  /** Curated links to the best free resources for this lesson. */
  resources?: SeedLink[];
  /** Per-lesson mastery self-check quiz (locks the "next" step when failed). */
  quiz?: SeedQuiz;
}

export interface SeedModule {
  title: string;
  description: string | null;
  order: number;
  lessons: SeedLesson[];
  /** End-of-module self-check quiz (levels / mastery check). */
  quiz?: SeedQuiz;
}

export interface SeedCourse {
  title: string;
  slug: string;
  description: string;
  short_description: string;
  level: string;
  duration: string;
  is_featured: boolean;
  is_ai_generated: boolean;
  /** Self-hosted cover image path (e.g. `/course-covers/python.svg`). */
  image_url?: string | null;
  category_slug: string;
  modules: SeedModule[];
}

export const CATEGORIES: SeedCategory[] = [
  { name: "Web Development", slug: "web-development", icon: "fa-globe" },
  { name: "Programming Languages", slug: "programming-languages", icon: "fa-code" },
  { name: "Data Science", slug: "data-science", icon: "fa-database" },
  { name: "Mobile Development", slug: "mobile-development", icon: "fa-mobile" },
  { name: "DevOps", slug: "devops", icon: "fa-server" },
  { name: "AI & Machine Learning", slug: "ai-ml", icon: "fa-brain" },
  { name: "Product & Design", slug: "product-design", icon: "fa-pen-ruler" },
];

/** Structured, readable study notes for every lesson. Same format as the
 * Python LESSON_NOTES: `## Heading` sections, `- ` bullets, `1. ` numbered
 * lists, plain paragraphs, and `**bold**` emphasis. */
export const LESSON_NOTES: Record<string, string> = {
  "How the web page is assembled": `## Overview
Every web page you have ever opened is just a text file that your browser downloads, reads, and paints onto the screen. Before you write a single line of code, it helps to understand how the pieces fit together: the document that holds the content, the rules that style it, and the scripts that make it respond. That mental model is the foundation for every lesson that follows.

## What you will learn
- How HTML, CSS, and JavaScript split the work of building a page.
- Why the browser sees your page as a tree of nested boxes (the DOM).
- How the browser loads a page from start to finish.
- Where to inspect any page's structure with browser tools.

## The three languages of the web
A web page is usually built from three languages, and each one has exactly one job.

- **HTML (HyperText Markup Language)** defines the *structure*: the headings, paragraphs, links, images, forms, and buttons that make up the content. HTML answers "what is on the page?"
- **CSS (Cascading Style Sheets)** defines the *presentation*: colors, fonts, spacing, and how the layout changes across screens. CSS answers "how does it look?"
- **JavaScript** defines the *behavior*: what happens when a user clicks a button, types into a form, or scrolls. JavaScript answers "what does it do?"

Think of a page as a person: HTML is the skeleton, CSS is the clothes, and JavaScript is the personality that reacts to you.

## How the browser assembles a page
When you open a URL, the browser does four jobs in order:

1. **Fetch** the HTML file over the network.
2. **Parse** the HTML into an in-memory tree of elements called the **DOM** (Document Object Model).
3. **Apply** any linked CSS files, plus CSS in \`<style>\` tags, to decide how each element looks.
4. **Execute** any JavaScript, which can read and change the DOM — adding, removing, or restyling elements.

Here is a minimal page that uses all three layers:

\`\`\`html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <h1>Hello</h1>
    <button onclick="alert('Hi!')">Say hi</button>
  </body>
</html>
\`\`\`

The \`<link>\` tag tells the browser to fetch \`style.css\` for styling, and the \`onclick\` attribute runs a tiny bit of JavaScript when the button is pressed.

## The DOM is a tree of nested boxes
Elements nest inside each other like boxes inside boxes. A \`<div>\` can contain a heading, a paragraph, and a button — each of those is its own box. The browser treats every element as a rectangular box and lays the boxes out according to your CSS.

\`\`\`
body
├── header
│   └── h1 "My course"
└── main
    ├── p "Lesson one"
    └── button "Start"
\`\`\`

When a page looks broken, the first question to ask is always structural: *is the content nested the way I think it is?*

## How to inspect any page
Open any website and press **F12** (or right-click → **Inspect**). In the Elements/Inspector panel you can:

- See the exact HTML that produced what you are looking at.
- Hover over a line to highlight the matching box on the page.
- Temporarily edit CSS values to test changes live.

Practicing on real sites is the fastest way to train your eye for structure.

## Common mistakes
- **Mixing the three jobs**: using \`<br>\` tags to create spacing (that is CSS's job) or sprinkling \`onclick\` handlers everywhere when a proper script would be cleaner.
- **Forgetting to close tags**, which makes the browser guess and nest elements wrongly.
- **Assuming the DOM equals the file you wrote** — JavaScript can change the DOM after load, so inspect the live tree, not just the source file.

## Key takeaways
- HTML builds the structure, CSS the appearance, and JavaScript the behavior.
- The browser parses HTML into the DOM — a tree of nested boxes.
- Load order matters: HTML first, then CSS, then scripts run.
- Browser dev tools turn any page into a live lesson.

## Check your understanding
- What three jobs do HTML, CSS, and JavaScript each perform on a page?
- Why does nesting matter when you design a page layout?
- Where in the browser can you inspect the structure of any element?
- What is the first structural question to ask when a layout looks wrong?`,

  "Responsive layout with flex and grid": `## Overview
Responsive design means your layout adapts to the device — phones, tablets, and desktops — instead of guessing one fixed size. CSS Flexbox and Grid are the two modern tools for arranging content without hand-picking pixel widths. Learn which tool to reach for and your pages will stay readable on every screen.

## What you will learn
- When to use Flexbox vs. Grid (the one-axis / two-axis rule).
- How \`flex-wrap\` lets a row of cards collapse onto multiple lines.
- How \`grid-template-columns\` with \`minmax()\` builds fluid columns.
- How media queries switch a layout at defined breakpoints.

## Flexbox: layout on one axis
Flexbox arranges items in a single direction — a row or a column. It is perfect for small, repeating structures like a navbar, a row of badges, or the meta row under a card title.

- \`display: flex\` turns the container into a flex row (left to right by default).
- \`flex-direction: column\` stacks the items vertically.
- \`justify-content\` distributes space along the main axis.
- \`align-items\` lines items up on the cross axis.

The power move for responsiveness is \`flex-wrap: wrap\`: instead of squashing children into one row, the browser lets them wrap onto new lines when space runs out.

\`\`\`css
.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
\`\`\`

That single rule turns a fixed row of chips into one that flows naturally on a 320px phone screen.

## Grid: layout on two axes
Grid arranges content in rows *and* columns at the same time — the right tool for whole-page layouts, dashboards, and card grids. You define the tracks, and the items fall into place.

- \`grid-template-columns: 1fr 1fr 1fr\` makes three equal columns.
- \`gap\` (or \`grid-gap\`) spaces the cells.
- \`grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))\` is the classic fluid pattern: "as many columns of at least 240px as will fit, sharing the leftover space equally."

\`\`\`css
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}
\`\`\`

On a phone this renders one column; on a desktop it renders as many as fit. No media query needed for the common case.

## Media queries: explicit switches
Sometimes you want an explicit layout change at a width — for example, moving a sidebar below the content on small screens. Media queries give you that switch:

\`\`\`css
@media (min-width: 768px) {
  .sidebar { position: sticky; top: 1rem; }
}
\`\`\`

Common breakpoints in this codebase are 640px, 768px, and 1024px. Rules outside the query are the mobile default; queries *add* desktop behavior.

## The one-axis / two-axis rule
The fastest way to choose a tool:

- Arranging items in **one line** (nav, buttons, chips, a row of stats) → **Flexbox**.
- Arranging content in a **grid of rows and columns** (course catalog, dashboard, page skeleton) → **Grid**.

Flexbox can fake a grid and Grid can fake a single row, but picking the tool that matches the shape of your content keeps the CSS short and obvious.

## Common mistakes
- **Using fixed pixel widths** for cards, then wondering why they overflow on mobile — prefer \`minmax()\`, percentages, and \`flex-wrap\`.
- **Forgetting \`gap\`** and adding margin hacks to space items.
- **Testing in one browser only** — layout bugs usually appear on a real phone or a narrow devtools viewport.
- **Writing too many media queries** — a fluid Grid or wrapped Flexbox removes the need for most of them.

## Key takeaways
- Flex = one axis; Grid = two axes. Pick by the shape you are arranging.
- \`flex-wrap: wrap\` and \`minmax(240px, 1fr)\` cover most responsive needs without queries.
- Media queries are for explicit switches, not for every small adjustment.
- Test at real phone, tablet, and desktop widths.

## Check your understanding
- When would you choose Flexbox over Grid, and vice versa?
- What does \`minmax(240px, 1fr)\` do inside \`repeat()\`?
- How does a media query change the layout at a breakpoint?
- Why is \`flex-wrap: wrap\` important on small screens?`,

  "Props, state, and reusable cards": `## Overview
React components are the building blocks of an interface. The two ideas that make them powerful are **props** — data passed *into* a component — and **state** — data a component owns and can change. Together they let you render an entire course catalog from one reusable card component instead of copying markup for every course.

## What you will learn
- What props are and how data flows from parent to child.
- What state is and why \`useState\` exists.
- How one component can render many different courses.
- Why every mapped item needs a stable \`key\`.

## Props: data flows down
A prop is a read-only input passed to a component, the same way you pass arguments to a function. The parent decides what the child shows; the child never changes its own props.

\`\`\`jsx
function CourseCard({ course }) {
  return <h3>{course.title}</h3>
}

<CourseCard course={{ title: 'React Basics', level: 'beginner' }} />
\`\`\`

The rule of thumb: **props flow down**. A child that needs to tell its parent something should call a function prop provided by the parent, not mutate its own props.

## State: data the component owns
State is data a component remembers between renders and can update over time. In function components you declare it with \`useState\`, which returns the current value and a setter.

\`\`\`jsx
const [isOpen, setIsOpen] = useState(false)

<button onClick={() => setIsOpen(!isOpen)}>
  {isOpen ? 'Close' : 'Open'}
</button>
\`\`\`

When the setter runs, React re-renders the component with the new value. Everything that depends on that state — like the button label — updates automatically.

## One component, many instances
Because a component is just a reusable template, you can feed it different props and get different output:

\`\`\`jsx
{courses.map((course) => (
  <CourseCard key={course.id} course={course} />
))}
\`\`\`

Mapping an array into components is the standard React pattern for lists: a single \`CourseCard\` renders every course, and adding a course to the array automatically adds a card to the page. You change the design in one place instead of a dozen.

## Why keys matter
The \`key\` prop helps React track each item as the list changes. Use a stable, unique value — almost always a database \`id\`:

- **Stable**: the id never changes for the same item.
- **Unique**: no two items share it.

Using the array index as a key works for a static list but causes subtle bugs when items are added, removed, or reordered. Prefer ids.

## Common mistakes
- **Mutating props** — props are read-only; store changing values in state instead.
- **Storing what you can derive** — a filtered list should be computed from state and props on each render, not copied into its own state.
- **Using the array index as \`key\`** for lists that change.
- **Lifting too much state up** — keep state as close as possible to where it changes.

## Key takeaways
- Props flow down; state lives where it changes.
- Reusable components reduce duplication and make updates one-place changes.
- Lists in React are \`map()\` over data with a stable key.
- Derive values on render; store the minimum truth in state.

## Check your understanding
- What is the difference between props and state?
- Why must each item in a mapped list have a unique key?
- How would you reuse one card component for both featured and regular courses?
- Why should a filtered list be computed on render instead of stored in state?`,

  "Forms and local state": `## Overview
A form is how your app asks the user what they want. In React the classic pattern is a **controlled input**: the input's value lives in component state, and every keystroke updates that state. This keeps the DOM and your data in one place — one source of truth — which makes validation, filtering, and clearing trivially easy.

## What you will learn
- What it means for an input to be "controlled".
- How \`onChange\` keeps state in sync with what the user types.
- Why filtering should be *derived* from state, not stored.
- How to prevent the page reload a native form would trigger.

## The controlled input pattern
A controlled input does two things: its \`value\` comes from state, and its \`onChange\` writes back to that state.

\`\`\`jsx
const [query, setQuery] = useState('')

<input
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  placeholder="Search courses..."
/>
\`\`\`

Because the input *always* renders whatever \`query\` holds, the two can never drift apart. Every keystroke: \`onChange\` fires → state updates → React re-renders → the input shows the new value.

## Filtering is derived state
A filtered list is not something you store — it is something you *compute* on every render from the input state and the data:

\`\`\`jsx
const filtered = courses.filter((course) =>
  course.title.toLowerCase().includes(query.trim().toLowerCase())
)
\`\`\`

Deriving values keeps your state minimal. If you copied the filtered list into state, you would have two sources of truth fighting each other.

## Handling submit without a reload
A native \`<form>\` reloads the page on submit — usually not what you want in a single-page app. Handle the submit event and prevent the default:

\`\`\`jsx
function handleSubmit(event) {
  event.preventDefault()
  // run the search
}
\`\`\`

Keeping the form tag still helps: pressing Enter in the input triggers \`onSubmit\`, which is the behavior users expect.

## Always design the empty state
A search box is only half the feature; the other half is what the user sees when nothing matches. Show a friendly message instead of a blank area:

- "No courses match your search." plus a way to reset.
- Never leave the list silently empty.

## Common mistakes
- **Uncontrolled inputs** — reading the DOM via a ref for every keystroke when state is simpler and more predictable.
- **Storing derived data** — copying a filter result into state instead of computing it.
- **Letting the form reload the page** — forgetting \`preventDefault()\`.
- **Ignoring the empty result** — a blank screen makes users think the app is broken.

## Key takeaways
- Controlled inputs keep the DOM and state in one source of truth.
- Derived values (filters) should not be stored — compute them from state.
- Always \`preventDefault()\` on submit in a single-page app.
- Handle both the "results" case and the "nothing found" case.

## Check your understanding
- What does it mean for an input to be "controlled"?
- Why is filtering called derived state?
- What should users see when no courses match their search?
- Why call \`event.preventDefault()\` on a form submit?`,

  "Variables, lists, and dictionaries": `## Overview
Python's core data structures — variables, lists, and dictionaries — are the raw material for every analysis. This lesson builds the small toolkit you will use to model real student data: giving values names, storing ordered sequences, and looking things up by key.

## What you will learn
- How to give a value a name with a variable.
- When to choose a list vs. a dictionary.
- How indexing, slicing, and loops work over lists.
- How to model a "record" like a student or a course.

## Variables: names for values
A variable stores a value under a name so you can refer to it later instead of repeating the literal:

\`\`\`python
completion_rate = 0.86
course_title = "Frontend Foundations"
lessons_taken = 12
\`\`\`

Name variables for what they *mean*, not what they look like. \`completion_rate\` tells a reader what the number is; \`x\` does not. Well-named variables are half of readable analysis code.

## Lists: ordered sequences
A list holds items in a specific order. Use one when the position of each item matters:

\`\`\`python
lessons = ["intro", "setup", "review"]
first = lessons[0]     # "intro"
last = lessons[-1]     # "review"
\`\`\`

- Indexing starts at \`0\`, so \`lessons[0]\` is the first item.
- Negative indices count from the end: \`lessons[-1]\` is the last.
- Lists are **mutable** — you can append, change, or remove items.

## Dictionaries: keyed lookups
A dictionary maps keys to values. Use one when you want to look something up by name rather than by position:

\`\`\`python
student = {"name": "Ada", "score": 92, "active": True}
print(student["name"])   # Ada
student["score"] = 95    # update a value
\`\`\`

Dictionaries are the natural way to model a *record* — one entity with several named attributes.

## Modeling a small dataset
Real data is almost always a list of records: a list of dictionaries.

\`\`\`python
students = [
    {"name": "Ada",  "score": 92},
    {"name": "Grace","score": 88},
    {"name": "Alan", "score": 95},
]
\`\`\`

Now loops can process any number of students without edits:

\`\`\`python
for student in students:
    print(student["name"], student["score"])
\`\`\`

Adding a fourth student to the list works immediately — the loop just runs one more time. This is why separating data (the list) from behavior (the loop) is so powerful.

## Choosing the right structure
- **Sequence?** (first, second, third) → a **list**.
- **Named lookup?** ("give me the score for Ada") → a **dictionary**.
- **Many records?** → a **list of dictionaries**.

## Common mistakes
- **Using a dictionary where a list fits** and then relying on insertion order — order is not the point of a dict.
- **Indexing off by one** — \`list[1]\` is the second item, not the first.
- **Mutable default confusion** — a variable pointing to a list shares the list with anything else pointing to it.
- **Poor names** — \`d\`, \`x\`, \`data\` force readers to guess.

## Key takeaways
- Pick the structure that matches the shape: sequence → list, keyed lookup → dict.
- Lists of dictionaries model whole datasets cleanly.
- Loops let one block of code handle any number of items.
- Naming variables well is half of readable analysis code.

## Check your understanding
- When is a list the right choice, and when is a dictionary?
- What does \`for student in students:\` do?
- How would you store a whole course (title, level, lessons) in one variable?
- Why does a loop handle a growing list without code changes?`,

  "Cleaning a messy table": `## Overview
Real datasets arrive messy: missing values, inconsistent names, extra columns, and typos. Cleaning is the unglamorous step that decides whether your analysis can be trusted — the rule is simple: **garbage in, garbage out**. This lesson teaches the pandas operations that turn a messy spreadsheet into a dependable table.

## What you will learn
- What a pandas **DataFrame** is and why it is a good mental model.
- Your first three inspection calls: \`info()\`, \`head()\`, \`describe()\`.
- How to fix column names, missing values, and inconsistent text.
- Why you should never overwrite the raw data blindly.

## Inspect before you clean
You cannot fix what you have not looked at. Start every cleaning job with three calls:

\`\`\`python
import pandas as pd

df = pd.read_csv("student_progress.csv")
df.info()      # columns, non-null counts, dtypes
df.head()      # first 5 rows — a quick visual
df.describe()  # summary stats for numeric columns
\`\`\`

\`info()\` immediately shows which columns have missing values (non-null counts below the row count) and whether numbers were read as text.

## Fixing column names
Inconsistent names wreck joins and summaries later. Normalize them once:

\`\`\`python
df = df.rename(columns={
    "Course Name": "course",
    "completion%": "completion_rate",
})
\`\`\`

Aim for a single convention: lowercase, underscores, no spaces.

## Handling missing values
Missing data shows up as \`NaN\`. You have two main choices:

\`\`\`python
df.dropna()            # remove any row with a missing value
df["score"] = df["score"].fillna(0)   # fill with a sensible default
\`\`\`

- \`dropna()\` is right when a row is useless without the missing cell.
- \`fillna()\` is right when a default value is meaningful (0 attempts, "not started").

Deciding which to use *per column* — not globally — is a real analytical choice, not a shortcut.

## Normalizing text
Values like "Intro ", "intro", and "INTRO" all describe the same thing but will be counted separately. Normalize with string methods chained in a pipeline:

\`\`\`python
df["status"] = df["status"].str.strip().str.lower()
\`\`\`

\`strip()\` removes surrounding whitespace; \`lower()\` makes the case uniform.

## Protect the raw data
Always keep a copy of the original before mutating:

\`\`\`python
raw = df.copy()
# ... cleaning happens on df ...
\`\`\`

If a later decision turns out wrong, you can restart from \`raw\` instead of re-downloading.

## Common mistakes
- **Cleaning without inspecting** — you will "fix" the wrong column.
- **Dropping rows you meant to fill** (or vice versa) — the choice is per-column.
- **Overwriting the source file** — keep \`raw\` and save cleaned output to a new name.
- **Silently losing data** — note how many rows \`dropna()\` removed so the loss is visible.

## Key takeaways
- Clean data first — garbage in, garbage out.
- \`info()\`, \`head()\`, and \`describe()\` are your first three calls.
- Normalize names and text once, up front.
- Document every cleaning decision so the analysis is reproducible.

## Check your understanding
- Why should you inspect before you clean?
- What is the difference between \`dropna()\` and \`fillna()\`?
- How do you make "Intro " and "intro" match?
- Why keep a copy of the raw data?`,

  "Group, summarize, and compare": `## Overview
Once data is clean, you summarize it to answer real questions: *What is the average completion rate per category? Which group needs the most support?* The pandas \`groupby()\` pattern — split, apply, combine — is the single most useful tool for turning raw rows into insights.

## What you will learn
- The split-apply-combine mental model behind \`groupby()\`.
- How to compute several statistics at once with \`agg()\`.
- Why group size matters alongside averages.
- How to compare groups against the overall average.

## Split, apply, combine
\`groupby()\` does three steps in one expression:

\`\`\`python
df.groupby("category")["completion_rate"].mean()
\`\`\`

1. **Split** the rows by \`category\`.
2. **Apply** \`mean()\` to the \`completion_rate\` column of each group.
3. **Combine** the results into a small table — one row per category.

The result is a compact table like this:

\`\`\`
category        completion_rate
web-development       0.72
data-science          0.58
mobile-development    0.41
\`\`\`

One line of code turned thousands of rows into four numbers that answer a question.

## Several stats at once with agg()
\`mean()\` gives one number per group. When you need multiple statistics — say the average *and* the number of students in each group — use \`agg()\`:

\`\`\`python
df.groupby("category")["completion_rate"].agg(["mean", "count", "min", "max"])
\`\`\`

Reporting **count alongside mean** is critical: an average of 0.9 based on two students means something very different from one based on two hundred.

## Compare against the baseline
A group number only has meaning in context. Compare each group to the overall average to find real gaps:

\`\`\`python
overall = df["completion_rate"].mean()
groups = df.groupby("category")["completion_rate"].mean()
print(groups - overall)   # how far each category is from the baseline
\`\`\`

A category that sits far below the baseline is where support (or investigation) is most needed.

## Common mistakes
- **Averaging groups without counts** — a tiny group can look great or terrible by chance.
- **Grouping by too much** — the table gets noisy; group by the question you are asking.
- **Treating summaries as conclusions** — a gap in averages raises a question ("why?"), it does not end the analysis.
- **Forgetting \`reset_index()\`** when you want the group key back as a normal column for charts.

## Key takeaways
- Groupby splits, applies, and combines in one expressive step.
- Summaries answer questions; they do not end them — follow up with why.
- Always report the group size alongside the average.
- Compare groups to the baseline, not just to each other.

## Check your understanding
- What does \`groupby(...).mean()\` return?
- Why report counts with averages?
- How would you compare each category's completion to the overall average?
- What is the split-apply-combine pattern in your own words?`,

  "Build a simple chart": `## Overview
A chart translates numbers into a story your audience can grasp at a glance. Matplotlib is the standard tool for quick, publication-quality plots in Python, and the bar chart is the right place to start because it compares categories directly.

## What you will learn
- When a bar chart is the right choice.
- How \`plt.bar()\` turns grouped numbers into a visual.
- The four labels every chart needs to be readable.
- Why every chart should be paired with a one-line takeaway.

## The right chart for the job
A **bar chart** compares categories: completion rate by course, students per category, clicks per day. If the question is "how does this group compare to that group?", bars are usually the clearest answer. Line charts are for change over time; scatter plots are for relationships between two numbers.

## Drawing the bars
Feed the grouped summary straight into \`plt.bar()\`:

\`\`\`python
import matplotlib.pyplot as plt

cats = ["Web", "Data", "Mobile"]
rates = [0.72, 0.58, 0.41]

plt.bar(cats, rates)
plt.title("Completion rate by category")
plt.xlabel("Category")
plt.ylabel("Completion rate")
plt.show()
\`\`\`

The data comes from the \`groupby()\` work in the previous lesson — a chart is just a summary made visual.

## Label everything
An unlabeled axis is a guess. Every chart needs at least:

1. A **title** — what is this showing?
2. An **x label** — what are the categories?
3. A **y label** — what is being measured?
4. An **honest scale** — start the y-axis at zero for bar charts so bar heights are not misleading.

## Pair the chart with a takeaway
A chart on its own is decoration; a chart plus one sentence is an insight. Under every chart write the decision or recommendation:

- "Mobile shows the lowest completion — the team should review the mobile lesson difficulty."
- "Data Science is 14 points below the overall average — plan an intervention."

The chart makes the number visible; the sentence makes it actionable.

## Common mistakes
- **Truncating the y-axis** — starting bars at 40 instead of 0 exaggerates differences.
- **Too many categories** — twenty bars say nothing; aggregate or filter first.
- **Missing labels** — a reader cannot interpret unlabeled axes.
- **Chart without a takeaway** — the reader is left to guess the point.

## Key takeaways
- Charts are for decisions, not decoration.
- Label everything — an unlabeled axis is a guess.
- Pair every chart with a one-line takeaway.
- Keep one idea per chart; honest scales beat flashy ones.

## Check your understanding
- When is a bar chart the right choice?
- What four things does every chart need to be readable?
- How does the chart reinforce the recommendation you wrote?
- Why should the y-axis start at zero for bar charts?`,

  "Define learner level and outcome": `## Overview
A great lesson starts before any content is written. You define **who** the learner is and **what they can do** when they finish — this outcome is the contract between you and the learner, and it is also the steering wheel for any AI you use to draft content.

## What you will learn
- How to write a measurable **learning outcome**.
- Why **prerequisites** and **level** tune difficulty automatically.
- What a **success check** is and why you need one.
- How to prompt an AI with all four so the draft fits.

## Outcomes describe observable behavior
A learning outcome states what the learner can *do* — not what they know. Weak outcomes use verbs like "understand" or "learn" that you cannot observe:

- ❌ "Understand React state."
- ✅ "Build a controlled search form with \`useState\`."

The test for a good outcome: *could you watch a learner and tell whether they did it?* If yes, it is measurable.

## Prerequisites + level tune difficulty
Two small inputs control how much the content can assume:

- **Prerequisites** list what the learner must already know — "basic HTML", "familiar with \`<form>\`".
- **Level** (beginner / intermediate / advanced) sets vocabulary, pacing, and the complexity of examples.

When you tell the AI "beginner with basic HTML", it automatically avoids jargon and starts from first principles. Change the level and the same prompt drafts a different lesson.

## The success check proves the outcome
A **success check** is a small task the learner completes that proves the outcome is met. For "build a search form", the check is: build a form that filters a list as you type. If the learner can do it, the lesson worked; if not, the lesson needs revision.

## One prompt that carries all four
Put the pieces together and the AI draft lands close to the target:

\`\`\`text
For a beginner who knows basic HTML, create a lesson that ends with the
learner able to build a search form that filters a list as you type.
Include a 5-question success check.
\`\`\`

Evaluate the draft *against the outcome*: does the content actually enable the behavior the outcome promises? If not, edit or regenerate.

## Common mistakes
- **Outcomes that cannot be observed** — "understand", "appreciate", "know about".
- **Skipping prerequisites** — the AI (or you) drifts into assumed knowledge and loses beginners.
- **No success check** — no way to tell if the lesson worked.
- **Level and content disagree** — a "beginner" lesson that jumps straight into hooks.

## Key takeaways
- Outcomes describe observable behavior, not vague topics.
- Prerequisites + level tune difficulty automatically.
- A success check is how you know the lesson worked.
- Evaluate every draft against its outcome.

## Check your understanding
- Rewrite "understand React" as a measurable outcome.
- Why do prerequisites matter for AI-generated content?
- What makes a good success check?
- How do you test whether an outcome is measurable?`,

  "Generate examples and exercises": `## Overview
Examples make abstract ideas concrete, and exercises make them stick. The quality of the prompt controls the quality of both — ask for worked examples, varied difficulty, and explicit constraints, and the AI will produce material that is actually usable in your course.

## What you will learn
- Why **worked examples** matter more than bare answers.
- How to request easy, medium, and stretch exercises.
- How **constraints** keep exercises at your audience's level.
- Why every exercise needs an answer key or rubric.

## Ask for the journey, not just the answer
A worked example shows the full path: the problem, the thinking, the steps, and the result. Ask for it explicitly:

\`\`\`text
Show a worked example of centering a card with Flexbox: the problem,
the reasoning, the CSS, and why each property is needed.
\`\`\`

Learners can follow a journey; a bare answer leaves them to reverse-engineer the thinking.

## Cover three difficulty levels
Good exercise sets span the range from confidence-building to stretch:

- **Easy** — one concept, one step (e.g., "make a row of three buttons wrap on small screens").
- **Medium** — combines two concepts (flex + gap + media query).
- **Stretch** — near-real task that requires deciding what to use ("build a responsive card grid").

Prompt the AI to label each exercise with its level so you can place it correctly.

## Constrain, constrain, constrain
Unconstrained prompts produce generic exercises. Constraints tailor them:

- "No advanced features — Flexbox and Grid only."
- "Use the same dataset from the earlier lesson."
- "Each exercise under 8 lines of code."
- "Match the difficulty to a beginner who finished lesson 2."

Constraints are how one prompt template serves every audience.

## Require an answer key or rubric
An exercise is only usable if you can grade it:

- Closed questions need a **model answer**.
- Open/build tasks need a **rubric** — the things a good solution must include.

Ask for both in the same prompt so grading material ships with the exercise.

## Iterate on the first draft
The first draft is a starting point, not the deliverable. Run it against your outcome and audience, then refine: tighten the language, adjust difficulty, add the missing constraint. Good exercises are the product of a prompt *and* a revision pass.

## Common mistakes
- **Asking for exercises only, no worked examples** — learners miss the "how".
- **All exercises at one difficulty** — either boring or impossible for the audience.
- **No constraints** — the AI picks its own (wrong) level.
- **Exercises without answers** — you cannot ship them to learners.

## Key takeaways
- Constrain the prompt and the exercises will fit your audience.
- Every exercise needs an answer or a rubric to be useful.
- Worked examples carry the explanation; exercises make it stick.
- Plan for iteration: refine, do not settle.

## Check your understanding
- What three difficulty levels should an exercise set span?
- Why include "common mistakes" in a prompt?
- What is a rubric and when do you need one?
- Why does a bare answer fail as a worked example?`,

  "Check accuracy and tone": `## Overview
AI drafts fast, but it can be confidently wrong. A short review checklist catches factual errors, mismatched difficulty, and tone that does not fit your course — turning "a fast draft" into "publishable content". Reviewing is not optional; it is the step that makes AI-generated material trustworthy.

## What you will learn
- What to verify before any AI content goes live.
- Why **difficulty drift** is the most common catch.
- How to check tone and outcome alignment.
- How a written checklist keeps review consistent.

## Verify every factual claim
AI fluently invents names, numbers, versions, and API details. Before publishing:

- Check every fact against a trusted source.
- Especially verify **proper nouns** (library names, function names), **numbers**, and **API syntax** — the most common hallucination sites.
- Run the code yourself; do not trust a snippet that looks right.

## Check the difficulty actually matches
AI content tends to drift harder than declared — a "beginner" lesson slowly acquires jargon and advanced features. Read for:

- Vocabulary the declared level would not know.
- Features not introduced in earlier lessons.
- Examples that assume more than the prerequisites state.

Difficulty drift is the single most common editing catch because it is subtle: each sentence is fine; the *compound* level is wrong.

## Check the tone
Tone is part of the brand. The same facts can be delivered as a friendly tutorial, a terse reference, or an academic lecture. Ask:

- Is the voice consistent with the rest of the course?
- Is it appropriate for the audience (never condescending, never cryptic)?
- Does it avoid filler ("In conclusion…") and stay actionable?

## Check outcome alignment
Re-read the lesson's stated outcome (from the previous lessons in this course) and ask: *does this content actually teach what it promises?* It is easy for a draft to be interesting and still miss the outcome. If it misses, edit toward the outcome, not toward the draft.

## Keep a changelog of fixes
Record what you corrected and why (in the lesson, or a notes file). The changelog does two things: it prevents the same error from being reintroduced on the next AI pass, and it documents your quality bar.

## Common mistakes
- **Publishing unverified facts** — names, numbers, and APIs are the riskiest.
- **Skipping the difficulty check** — the most common miss.
- **Approve-and-ship** without reading — trust but verify.
- **No checklist** — each lesson is reviewed differently, so errors slip through.

## Key takeaways
- Trust but verify — especially names, numbers, and APIs.
- Difficulty drift is the most common AI editing catch.
- A written checklist makes review consistent across lessons.
- Every draft gets measured against its outcome.

## Check your understanding
- What is the most common way AI content misses the target level?
- Why is "outcome alignment" a review step?
- Name three checklist items you would apply to any AI draft.
- Why keep a changelog of fixes?`,

  "Create Cora-style hints": `## Overview
A good hint nudges a stuck learner forward without giving the answer away. The Cora-style hint system uses small, escalating doses — a nudge, then a clue, then the approach — so learners stay in the driver's seat and build the skill instead of copying the solution.

## What you will learn
- The three hint layers and when to use each.
- Why questions work better than statements in hints.
- Why hints stay to one idea per message.
- How to write hints in the course's own vocabulary.

## The three escalating layers
Never jump straight to the answer. Give the learner a chance at each level:

1. **Nudge** — a tiny push in the right direction: "Look at how you're grouping the rows."
2. **Clue** — a more specific pointer: "Rows that share a category should be grouped before you average."
3. **Approach** — the method, but not the code: "Use \`groupby\` on \`category\`, then take the mean of \`completion_rate\`."

Escalation only advances when the learner is still stuck, so each level is genuinely earned — and the learner often solves it at the nudge or clue stage.

## Prefer questions over answers
A hint phrased as a question hands the thinking back to the learner:

- ✅ "What should each row in your data represent?"
- ❌ "Each row is a single student."

Questions prompt recall; statements prompt copying. Write the nudge and clue as questions and you have taught the thinking, not just the fix.

## One idea per message
A hint that lists three things overwhelms and its parts get ignored. Keep each hint to one idea and one next step:

- ✅ "Start by normalizing the status column, then re-run your summary."
- ❌ "Normalize status, fix the missing scores, rename two columns, and check the dtypes."

Short, single-idea hints are easy to act on, which is the whole point of a hint.

## Speak the course's vocabulary
Use the exact terms the course has already taught (\`DataFrame\`, \`groupby\`, \`controlled input\`). When a hint uses known vocabulary, learners connect the hint to the lesson they just read — the dots join, and the skill sticks.

## Support the wrong path too
Learners get stuck *and* go down wrong paths. Hints for the "wrong path" matter just as much as hints for "stuck":

- "That filters instead of grouping. What method divides rows into categories first?"

This turns an error into a lesson instead of a dead end.

## Common mistakes
- **Jumping to the approach or answer** — skips the learning.
- **Hint + answer in the same message** — the learner reads the answer and never tries.
- **Long multi-part hints** — nothing is actionable.
- **Vague vocabulary** — "use the thing we learned" is noise.

## Key takeaways
- Escalate: nudge → clue → approach.
- Prefer questions over answers.
- One idea per hint, in the course's own words.
- Cover both the stuck path and the wrong path.

## Check your understanding
- Why do hints escalate instead of jumping to the answer?
- Write a nudge, a clue, and an approach for a beginner exercise.
- Why should hints use the course's own vocabulary?
- How does a hint phrased as a question help more than one phrased as a statement?`,

  "Native components and layout": `## Overview
React Native lets you build mobile apps with JavaScript by composing *native* components — the same component mindset as the web, but with building blocks that map to the phone's own UI toolkit. This lesson gives you the small set of primitives you need to lay out a mobile screen.

## What you will learn
- The core primitives: \`View\`, \`Text\`, \`Pressable\`, \`ScrollView\`.
- Why Flexbox is the layout engine on mobile too.
- How inline style objects replace CSS files.
- The 44pt touch-target rule and why it matters.

## The essential primitives
React Native has a deliberately small set of building blocks:

- **View** — a container (the equivalent of a \`div\`). Layout happens here.
- **Text** — renders a string. Unlike the web, *all text* must live in a \`Text\` component.
- **Pressable** — a tappable area with press feedback (the button).
- **ScrollView** — makes content scrollable on small screens.

\`\`\`jsx
import { View, Text, Pressable, ScrollView } from 'react-native'

export default function Dashboard() {
  return (
    <ScrollView>
      <Text>My courses</Text>
      <Pressable onPress={() => console.log('tapped')}>
        <Text>Open course</Text>
      </Pressable>
    </ScrollView>
  )
}
\`\`\`

Note that even the button label is wrapped in \`Text\` — on mobile, text and layout are different concerns than on the web.

## Flexbox is the layout engine
Flexbox works the same on mobile as on the web — \`flexDirection\`, \`justifyContent\`, \`alignItems\`, and \`gap\` control positioning:

\`\`\`jsx
<View style={{ flex: 1, justifyContent: 'space-between', gap: 12 }}>
  <Text>Header</Text>
  <Text>Footer</Text>
</View>
\`\`\`

Learn Flexbox once and you can lay out screens on both platforms; the syntax differs only in that styles are **inline objects**, not CSS files.

## Inline style objects
Styles are JavaScript objects, not CSS files:

\`\`\`jsx
<Text style={{ fontSize: 18, fontWeight: 'bold' }}>Title</Text>
\`\`\`

For reusable styles you can define a StyleSheet — still just objects, but named and shared:

\`\`\`jsx
import { StyleSheet } from 'react-native'
const styles = StyleSheet.create({ title: { fontSize: 18, fontWeight: 'bold' } })
\`\`\`

## Design for thumbs, not mice
A finger is much bigger than a cursor. Keep touch targets at least **44pt** on each side (Apple's guidance; Android recommends 48dp). A button that looks fine at 24pt is frustrating on a phone. When in doubt, make it bigger.

## Common mistakes
- **Putting text outside \`Text\`** — it will not render.
- **Using \`div\`/web tags** from habit — they do not exist in React Native.
- **Fighting Flexbox** instead of learning it — it is the layout engine; use it.
- **Tiny touch targets** — under 44pt taps get missed.

## Key takeaways
- Components are the same idea as the web; the primitives differ.
- Flexbox is the layout engine on both platforms.
- Styles are inline objects or StyleSheets, not CSS files.
- Design for thumbs, not mice — 44pt minimum targets.

## Check your understanding
- Which component do you use for a tappable button?
- How do you make a list of cards scrollable?
- Why should touch targets be at least 44pt?
- Where does all text have to live in React Native?`,

  "Navigation and screens": `## Overview
A mobile app is a stack of screens, and navigation is how users move between them. The stack navigator — the most common pattern — pushes and pops screens like a deck of cards, keeping history, back gestures, and state handling out of your hands so you can focus on the screens themselves.

## What you will learn
- What a **stack navigator** is and why it is the default.
- How params pass data from one screen to the next.
- What the navigator handles for you automatically.
- Why navigation should stay **shallow** on mobile.

## A stack of screens
Think of the navigator as a deck of cards:

- **Push** a screen → it slides on top (Catalog → CourseDetail).
- **Pop** a screen → it slides away, revealing the one below.
- The **back button and swipe gesture** pop automatically — you never wire them yourself.

\`\`\`jsx
// navigation/native — conceptual
navigation.navigate('CourseDetail', { courseId: course.id })
\`\`\`

The back behavior, transitions, and history are owned by the navigator. Your job is naming the screens and navigating between them.

## Params carry the data
To show a detail screen, the list screen passes the minimum needed — usually an id:

\`\`\`jsx
// List screen pushes with params
navigation.navigate('CourseDetail', { courseId })

// Detail screen reads them
const { courseId } = route.params
\`\`\`

The detail screen then fetches the full course by id. Passing an id (not the whole object) keeps the param payload small and the data fresh.

## Keep navigation shallow
Deep stacks confuse users on small screens — five pushes deep, the back button becomes a maze. Best practices:

- Two to three levels per flow: Catalog → Detail → Lesson.
- Every screen has a **clear title** and an obvious way back home.
- Provide a "back to catalog" affordance, not just the hardware back.

## Common mistakes
- **Navigating without params** — the detail screen has nothing to render.
- **Passing huge objects in params** — stale data and slow navigation; pass ids.
- **Building custom back buttons** — the navigator already handles them.
- **Deep unlabeled stacks** — users lose their bearings.

## Key takeaways
- Screens + params = a navigable app.
- Let the navigator own back gestures and history.
- Pass ids, not objects; fetch the rest on the destination screen.
- Title every screen; keep stacks shallow.

## Check your understanding
- What is a stack navigator?
- How does data travel from the list screen to the detail screen?
- Why should navigation stay shallow on mobile?
- Why pass an id rather than the whole course object in params?`,

  "Environment variables and secrets": `## Overview
Code and configuration are different things. Hardcoding a database URL or an API key in your source code breaks the moment the environment changes and — worse — leaks secrets into version control. **Environment variables** keep secrets and environment-specific values out of your code entirely.

## What you will learn
- What an environment variable is and how the runtime provides it.
- Why config differs by environment while code does not.
- Where secrets live in production vs. locally.
- How to fail fast when a required variable is missing.

## Config differs by environment; code does not
The same code runs in local, staging, and production — only the configuration changes:

\`\`\`text
# local
DATABASE_URL=postgres://localhost:5432/courser

# production
DATABASE_URL=postgres://user:secret@prod-host:5432/courser
\`\`\`

Your app reads \`DATABASE_URL\` and behaves correctly in both. This is the core principle: **values vary by environment, behavior does not.**

## Secrets never go in the repo
API keys, database passwords, and signing tokens are **secrets** — they must never be committed. The practical rules:

- Locally, use a \`.env\` file to hold them.
- Add \`.env\` to \`.gitignore\` so it never lands in the repo.
- In production, use the platform's **secret manager** (Render dashboard, Vercel env vars, etc.), not a committed file.

A leaked key in a commit is nearly impossible to fully retract — treat every secret as valuable.

## Reading variables in code
Access an environment variable through the runtime's standard API:

\`\`\`js
const dbUrl = process.env.DATABASE_URL
\`\`\`

Nothing in this line reveals what the value is — only that the app needs it.

## Fail loudly at startup
A missing variable should crash early with a clear message, not fail silently halfway through a request:

\`\`\`js
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required — check your .env file')
}
\`\`\`

Failing fast at boot means the deploy pipeline catches the mistake immediately, instead of a user discovering it at 2 a.m.

## Common mistakes
- **Committing \`.env\`** — the most damaging, most common mistake.
- **Hardcoding config in source** — forces code changes per environment.
- **Same secret in code and env** — now the secret is in two places to leak.
- **Silent defaults for required values** — the app runs on wrong config.

## Key takeaways
- Config differs by environment; code does not.
- Secrets live in a secret manager or env, never in the repo.
- Fail fast on missing required variables.
- Keep \`.env\` gitignored everywhere.

## Check your understanding
- Why should config never live in source code?
- Where do secrets go in production vs locally?
- What should happen when a required variable is missing?
- What is the single most damaging config mistake?`,

  "Build and health checks": `## Overview
Deploying is risky until you prove the app is actually healthy. Build checks, health endpoints, and smoke tests turn deployment from a gamble into a checklist — and turn monitoring from "wait for complaints" into a simple HTTP call.

## What you will learn
- What a **build check** catches and where it runs.
- What a **health endpoint** reports and why it is just one call.
- What a **smoke test** is and when to run it.
- The order of checks on the way to release.

## Build checks catch it before users do
A build check runs before anything ships: compile, type-check, lint. It answers one question — *does this code even build?* — and fails the pipeline if not.

\`\`\`text
1. npm install
2. npm run build     # compile + type-check
3. npm test          # unit/integration
4. npm run health    # curl the health endpoint after deploy
5. smoke test        # sign in → load → read
\`\`\`

A CI pipeline (GitHub Actions, Render, Vercel) runs these automatically on every push, so a broken build never reaches a user.

## The health endpoint: monitoring as one HTTP call
A **health endpoint** (\`/api/health\`) reports whether the app can serve traffic. It typically checks that the app is up and its critical dependencies (like the database) respond:

\`\`\`bash
curl https://your-app.com/api/health
# {"status":"healthy"}     <- 200, app is serving
\`\`\`

Because it is a plain HTTP call, any uptime monitor — cron-job.org, UptimeRobot, Render's own checks — can watch it and alert on failure. This is exactly how the keepalive pinger in this repo keeps the free tier warm.

## Smoke tests verify the critical path
A smoke test is the shortest real-user journey, run right after deploy:

1. Sign in with a test account.
2. Load the dashboard.
3. Read a course.

If the critical path works, the release is probably sound; if not, nothing else matters. Smoke tests are few, fast, and shallow — depth is for the test suite, smoke is for confidence.

## Run checks in a fixed order
Order matters: an app that does not build cannot be smoke-tested.

\`\`\`
build → unit tests → health check → smoke test → ship
\`\`\`

Every step must pass before the next runs. Any failure stops the release at the cheapest possible moment.

## Common mistakes
- **Skipping the build check** — pushing broken code to staging.
- **A health endpoint that only returns 200** — it must actually check dependencies.
- **No smoke test** — shipping a release nobody verified end-to-end.
- **Waiting for users to complain** — the health check is your early warning.

## Key takeaways
- Checks catch problems the team has not hit yet.
- Health endpoints turn monitoring into a simple HTTP call.
- Ship only when the whole checklist passes.
- Order matters: build → tests → health → smoke.

## Check your understanding
- What does a health endpoint report?
- What is a smoke test and when do you run it?
- Why run build checks before deploying?
- Why should a health check look at dependencies, not just "I'm up"?`,

  "Catalog decisions": `## Overview
The course catalog is where students decide to start — and where returning students decide to continue. Its design should remove friction, build confidence, and make progress signals obvious at a glance. Every decision here is about helping the student act, not decorating a page.

## What you will learn
- The five essentials every course card needs.
- Why filters should be visible but optional.
- How progress signals pull returning students back in.
- Why one primary action per card wins.

## The card anatomy that matters
Every course card earns its place with five essentials:

1. **Title** — what the course is.
2. **Topic/category** — what field it belongs to.
3. **Level** — is it for me right now?
4. **Duration** — how long will this take?
5. **A clear action** — start, continue, or view.

Everything else is secondary. A card that shows these five things lets a student scan and decide in seconds.

## Filters: visible but optional
Filters and search should narrow the catalog without owning it:

- Put them in reach (top of the grid, or a slim sidebar) — not hidden behind menus.
- Default to "all" so a new visitor sees the whole catalog.
- Never require a filter to browse.

The goal is to *reduce* the decision space, not add another decision ("how do I filter?").

## Progress signals bring students back
A returning student's most valuable question is "where was I?" The catalog should answer it in the card itself:

- A progress bar or "X% complete" badge.
- A "Continue" action that jumps to the next lesson — not a generic "View details".

Students who can resume in one tap return; students who must hunt for their place drift away.

## Hierarchy beats decoration
Give each card **one primary action** and make everything else quiet:

- Primary action styled with the accent color; secondary links muted.
- Avoid several competing buttons per card.
- Consistent anatomy across cards so scanning is fast.

A card that shouts in five places is a card that is read nowhere.

## Common mistakes
- **Cards missing essentials** — no duration or level, so the student must click to decide.
- **Buried filters** — students cannot narrow a large catalog.
- **No progress signal** — returning students start over or leave.
- **Competing actions** — two or three loud buttons per card.

## Key takeaways
- Decisions, not decoration, drive catalog design.
- Returning students need progress signals at a glance.
- One primary action per card keeps users unblocked.
- Card essentials: title, topic, level, duration, action.

## Check your understanding
- What five essentials belong on every course card?
- How do progress signals help returning students?
- Why should there be one primary action per card?
- Why should filters default to showing everything?`,

  "Mascot support patterns": `## Overview
A learning helper — like Cora — answers questions and guides without distracting. The design of its prompts decides whether support feels helpful or annoying: it must appear in context, say one thing at a time, and escalate gently instead of hovering or interrupting.

## What you will learn
- Where helper prompts should appear relative to the lesson.
- Why messages stay short and actionable.
- How to escalate from a hint to a full walkthrough.
- Why a consistent visual identity builds trust.

## Support appears in context
Help belongs *beside* the lesson, never popping over it:

- The assistant sits in a side panel or under the content — visible, not blocking.
- It does not auto-launch, auto-scroll, or cover the text.
- The learner summons help when they need it; the panel is always reachable.

Context-aware, non-blocking support lets the learner choose the moment — which is exactly when a hint is most useful.

## One idea, one next step
A support message works best when it is minimal:

- One idea per message — no lists of three suggestions.
- Always paired with a next step: "Try grouping by category, then re-run the summary."
- Short sentences; room to breathe.

A message that says everything says nothing — the learner cannot act on it.

## Escalate gently
Never dump the answer on the first click. Escalate in levels as the learner stays stuck:

1. **Hint** — a small nudge in the right direction.
2. **Explanation** — the concept behind the problem.
3. **Example** — a concrete worked snippet.
4. **Full walkthrough** — step by step, last resort.

Each level is a separate response the learner can decline, so the learner stays in control.

## Ask before acting
A helper that changes the page — scrolling, opening a modal, prefilling a form — should ask first. The trust equation is simple: support that only *responds* is trusted; support that *intrudes* is muted or dismissed.

## A consistent identity builds trust
A small, consistent visual identity — shape, colors, and placement — makes help feel familiar:

- Same avatar, same spot on every screen.
- Same tone of voice in every answer.
- Predictable behavior: where you found help once, you find it again.

Familiarity is what turns a feature into a trusted helper.

## Common mistakes
- **Pop-ups and overlays** — help that covers the lesson is help that fights the learner.
- **Three ideas per message** — nothing is actionable.
- **Jumping straight to the answer** — the learner copies instead of learns.
- **Moving around** — a helper that changes position is a helper that is ignored.

## Key takeaways
- Context-aware, non-blocking support beats pop-ups.
- One idea per message, always with a next step.
- Escalate: hint → explanation → example → walkthrough.
- A consistent mascot identity makes help feel familiar.

## Check your understanding
- Where should helper prompts appear relative to the lesson?
- Why should support messages carry one idea and one next step?
- How does escalation work from hint to full walkthrough?
- Why ask before the helper acts on the page?`,
};

/** Per-lesson mastery quizzes, keyed by lesson title (same lookup pattern as
 *  LESSON_NOTES). writeCourse.ts attaches these to every lesson at write time
 *  when the lesson doesn't already carry its own `quiz`, so both the seeded
 *  catalog and the markdown-imported courses get a self-check per lesson. */
export const LESSON_QUIZZES: Record<string, SeedQuiz> = {
  "How the web page is assembled": {
    pass_percent: 70,
    questions: [
      {
        question: "Which language defines the structure and content of a web page?",
        options: ["HTML", "CSS", "JavaScript", "Python"],
        correct_index: 0,
        explanation: "HTML marks up headings, paragraphs, links, images, and forms — the skeleton of the page.",
      },
      {
        question: "What does the browser build from a page's HTML so it can paint it?",
        options: ["A spreadsheet", "An in-memory tree of elements (the DOM)", "A ZIP file", "A server log"],
        correct_index: 1,
        explanation: "After parsing HTML, the browser builds the DOM — a tree of element nodes it can render and script.",
      },
      {
        question: "Which browser tool lets you inspect any page's live structure?",
        options: ["The address bar", "DevTools (right-click → Inspect)", "The print dialog", "Bookmark manager"],
        correct_index: 1,
        explanation: "DevTools' Elements panel shows the DOM tree, styles, and lets you try changes live.",
      },
    ],
  },
  "Responsive layout with flex and grid": {
    pass_percent: 70,
    questions: [
      {
        question: "Which flex rule makes items drop to a new line on narrow screens?",
        options: ["flex-wrap: wrap", "display: none", "overflow: hidden", "position: fixed"],
        correct_index: 0,
        explanation: "flex-wrap: wrap lets flex items wrap onto additional lines when they run out of room.",
      },
      {
        question: "Which grid snippet creates a fluid set of columns that collapse on small screens?",
        options: ["repeat(auto-fit, minmax(200px, 1fr))", "grid-template-columns: 200px 200px", "display: block", "grid-gap: none"],
        correct_index: 0,
        explanation: "auto-fit with minmax() lets the browser place as many fixed-minimum columns as fit, wrapping naturally.",
      },
      {
        question: "What is the main difference between flexbox and grid?",
        options: ["Flexbox is one-dimensional, grid is two-dimensional", "Grid is only for text", "Flexbox cannot wrap", "They are identical"],
        correct_index: 0,
        explanation: "Flexbox lays out along one axis (row or column); grid controls rows and columns together.",
      },
    ],
  },
  "Props, state, and reusable cards": {
    pass_percent: 70,
    questions: [
      {
        question: "How does a parent component pass data to a child?",
        options: ["Through props", "Through the DOM", "Through cookies", "Through global CSS"],
        correct_index: 0,
        explanation: "Props flow downward from parent to child as JSX attributes.",
      },
      {
        question: "What does useState return?",
        options: ["A DOM node", "A pair: the current value and a setter", "The component's props", "An array of styles"],
        correct_index: 1,
        explanation: "useState returns [value, setValue]; calling the setter re-renders the component.",
      },
      {
        question: "Which pattern renders one card per course from an array?",
        options: ["courses.map(c => <CourseCard ... />)", "courses.push(<Card />)", "document.write(courses)", "for (c of courses) print(c)"],
        correct_index: 0,
        explanation: "Mapping the array into JSX is the idiomatic React way to render lists.",
      },
    ],
  },
  "Forms and local state": {
    pass_percent: 70,
    questions: [
      {
        question: "What is a controlled input?",
        options: [
          "Its value is stored only on the server",
          "Its value comes from React state and updates via onChange",
          "An input that is disabled",
          "An input that posts a form",
        ],
        correct_index: 1,
        explanation: "value + onChange bind the input to React state so the UI and data stay in sync.",
      },
      {
        question: "How do you filter a course list as the user types?",
        options: ["courses.filter(c => c.title.toLowerCase().includes(query))", "courses.splice(0)", "document.querySelectorAll", "alert(query)"],
        correct_index: 0,
        explanation: "filter() returns matching items; combined with state it gives live search-as-you-type.",
      },
      {
        question: "Why call e.preventDefault() in a form's submit handler?",
        options: [
          "To stop the full-page reload",
          "To make the form faster",
          "To clear the input",
          "To hide the button",
        ],
        correct_index: 0,
        explanation: "Preventing the default keeps the page from reloading so React can handle the submit in-place.",
      },
    ],
  },
  "Variables, lists, and dictionaries": {
    pass_percent: 70,
    questions: [
      {
        question: "Which Python structure maps keys to values?",
        options: ["list", "dictionary", "tuple", "set"],
        correct_index: 1,
        explanation: "A dict stores key→value pairs, e.g. {'student': 'Ada', 'score': 92}.",
      },
      {
        question: "How do you get the second item of a list named scores?",
        options: ["scores[1]", "scores[2]", "scores.get(2)", "scores.last"],
        correct_index: 0,
        explanation: "Python lists are 0-indexed, so the second element is scores[1].",
      },
      {
        question: "What does len(students) return?",
        options: ["The number of items in the list", "The longest name", "The total score", "An error"],
        correct_index: 0,
        explanation: "len() returns the number of elements in a list or other sequence.",
      },
    ],
  },
  "Cleaning a messy table": {
    pass_percent: 70,
    questions: [
      {
        question: "How do you rename a column in pandas?",
        options: ["df.rename(columns={'old': 'new'})", "df.columns = 'new'", "df.drop('old')", "pd.new_column('old')"],
        correct_index: 0,
        explanation: "rename() with a columns mapping is the standard way to relabel columns.",
      },
      {
        question: "What does df.isna().sum() tell you?",
        options: ["The number of missing values per column", "The total of all numbers", "The row count", "The column count"],
        correct_index: 0,
        explanation: "isna() flags missing values; summing the flags counts them per column.",
      },
      {
        question: "Which call fills missing numeric values with each column's average?",
        options: ["df.fillna(df.mean())", "df.dropna()", "df.ffill()", "df.replace(0)"],
        correct_index: 0,
        explanation: "fillna(df.mean()) imputes NaNs using the column means — a common cleaning step.",
      },
    ],
  },
  "Group, summarize, and compare": {
    pass_percent: 70,
    questions: [
      {
        question: "Which pandas call groups a DataFrame by a column?",
        options: ["df.groupby('category')", "df.sort_values('category')", "df.filter('category')", "df.pivot('category')"],
        correct_index: 0,
        explanation: "groupby() splits the data into groups you can then summarize with agg() or mean().",
      },
      {
        question: "What does df.groupby('category')['completion'].mean() return?",
        options: [
          "One average completion rate per category",
          "Every row with a mean column",
          "A single number",
          "The row count",
        ],
        correct_index: 0,
        explanation: "It computes the mean of 'completion' within each category — perfect for comparisons.",
      },
      {
        question: "When comparing completion rates across categories, what is clearest?",
        options: ["A bar chart", "A 50-column table", "A single total", "A raw dump"],
        correct_index: 0,
        explanation: "Bars make category-to-category differences immediately visible.",
      },
    ],
  },
  "Build a simple chart": {
    pass_percent: 70,
    questions: [
      {
        question: "Which matplotlib call draws a bar chart?",
        options: ["plt.bar(x, height)", "plt.plot(x, y)", "plt.scatter(x, y)", "plt.hist(x)"],
        correct_index: 0,
        explanation: "plt.bar() renders vertical bars from category positions and heights.",
      },
      {
        question: "How do you show the chart in a notebook?",
        options: ["plt.show()", "print(plt)", "chart.display()", "plt.save()"],
        correct_index: 0,
        explanation: "plt.show() renders the current figure to the screen/notebook.",
      },
      {
        question: "What must labels on a chart include?",
        options: [
          "Clear axis titles and a descriptive title",
          "Only colors",
          "A random seed",
          "The file path",
        ],
        correct_index: 0,
        explanation: "Labels make the chart legible so readers know what the bars represent.",
      },
    ],
  },
  "Define learner level and outcome": {
    pass_percent: 70,
    questions: [
      {
        question: "Which prompt is most specific about the audience?",
        options: [
          "'Write a 10-minute beginner lesson on flexbox for adults new to coding'",
          "'Write a lesson'",
          "'Write about flexbox'",
          "'Make it good'",
        ],
        correct_index: 0,
        explanation: "Level, length, and audience give the model constraints that produce usable material.",
      },
      {
        question: "What is a learning objective for?",
        options: [
          "To define what a learner can do after the lesson",
          "To name the module",
          "To fill a footer",
          "To count words",
        ],
        correct_index: 0,
        explanation: "An objective states the measurable outcome, e.g. 'learners can center a card with flexbox'.",
      },
      {
        question: "Which verb best starts a measurable objective?",
        options: ["Build", "Understand", "Feel", "Appreciate"],
        correct_index: 0,
        explanation: "Observable verbs like 'build' or 'explain' are verifiable; 'understand' is vague.",
      },
    ],
  },
  "Generate examples and exercises": {
    pass_percent: 70,
    questions: [
      {
        question: "After AI drafts an exercise, what should you do first?",
        options: [
          "Check it against your objective and audience level",
          "Publish it immediately",
          "Delete the draft",
          "Add random numbers",
        ],
        correct_index: 0,
        explanation: "Drafts are starting points — review accuracy, tone, and fit before publishing.",
      },
      {
        question: "Why include an example of the expected output in a prompt?",
        options: [
          "It anchors the model to the right format and style",
          "It wastes tokens",
          "It hides the instructions",
          "It disables the model",
        ],
        correct_index: 0,
        explanation: "Few-shot examples steer the model toward the exact structure you want.",
      },
      {
        question: "Which constraint makes a generated example more useful?",
        options: [
          "A concrete scenario plus a length limit",
          "No constraints at all",
          "Only a topic name",
          "A single keyword",
        ],
        correct_index: 0,
        explanation: "Constraints like context, length, and audience turn generic output into usable material.",
      },
    ],
  },
  "Check accuracy and tone": {
    pass_percent: 70,
    questions: [
      {
        question: "AI drafts can sound confident and be wrong. What should you do?",
        options: [
          "Verify facts against a reliable source",
          "Trust them blindly",
          "Never use AI text",
          "Only check spelling",
        ],
        correct_index: 0,
        explanation: "Verify accuracy, tone, and alignment with the objective before publishing.",
      },
      {
        question: "Which tone is best for lesson text aimed at beginners?",
        options: [
          "Plain, warm, and direct",
          "Dense academic jargon",
          "Legalese",
          "Abrupt commands",
        ],
        correct_index: 0,
        explanation: "Plain language reduces cognitive load and keeps learners engaged.",
      },
      {
        question: "What is the point of a review checklist?",
        options: [
          "To catch errors the AI missed before publishing",
          "To make publishing slower",
          "To hide the content",
          "To delete examples",
        ],
        correct_index: 0,
        explanation: "A checklist forces consistent checks for facts, tone, and fit on every lesson.",
      },
    ],
  },
  "Create Cora-style hints": {
    pass_percent: 70,
    questions: [
      {
        question: "What is instructional scaffolding?",
        options: [
          "Support that fades as the learner gains skill",
          "Removing all help",
          "Making lessons longer",
          "Randomizing answers",
        ],
        correct_index: 0,
        explanation: "Scaffolding gives structure early, then withdraws it as the learner becomes independent.",
      },
      {
        question: "A good hint should…",
        options: [
          "Guide one step at a time and leave a next action",
          "Give the answer immediately",
          "List every error at once",
          "Never mention the lesson",
        ],
        correct_index: 0,
        explanation: "One idea + one next step keeps attention on the current problem.",
      },
      {
        question: "Which escalation order supports a stuck learner best?",
        options: [
          "Hint → explanation → example → walkthrough",
          "Walkthrough → hint → example",
          "Answer → walkthrough → hint",
          "No help at all",
        ],
        correct_index: 0,
        explanation: "Start with the smallest nudge and escalate only when the learner is still stuck.",
      },
    ],
  },
  "Native components and layout": {
    pass_percent: 70,
    questions: [
      {
        question: "Which React Native component renders plain text?",
        options: ["<Text>", "<View>", "<Image>", "<ScrollView>"],
        correct_index: 0,
        explanation: "<Text> is the only component that renders text content in React Native.",
      },
      {
        question: "Which component should wrap a long scrolling list of lessons?",
        options: ["<ScrollView>", "<Modal>", "<Pressable>", "<StatusBar>"],
        correct_index: 0,
        explanation: "ScrollView scrolls its children; FlatList is better for large data-driven lists.",
      },
      {
        question: "Why use <Pressable> instead of a plain <View> for touch targets?",
        options: [
          "It adds accessibility and press states",
          "It is faster than anything",
          "It renders HTML",
          "It disables touch",
        ],
        correct_index: 0,
        explanation: "Pressable gives pressed/disabled/accessible states out of the box.",
      },
    ],
  },
  "Navigation and screens": {
    pass_percent: 70,
    questions: [
      {
        question: "What is the recommended way to move between screens in React Native?",
        options: [
          "A navigation library such as React Navigation",
          "window.location",
          "document.write",
          "alert()",
        ],
        correct_index: 0,
        explanation: "React Navigation (or Expo Router) is the standard; there is no URL bar on native.",
      },
      {
        question: "How do you pass data to a detail screen?",
        options: [
          "As route parameters",
          "Via the global window object",
          "Through CSS",
          "You can't",
        ],
        correct_index: 0,
        explanation: "Navigation params carry the id/data the next screen needs to render.",
      },
      {
        question: "What should the back behavior do on a detail screen?",
        options: [
          "Return to the previous screen preserving state",
          "Restart the app",
          "Log the user out",
          "Close the whole app",
        ],
        correct_index: 0,
        explanation: "Stack navigation keeps the previous screen mounted so back returns to it.",
      },
    ],
  },
  "Environment variables and secrets": {
    pass_percent: 70,
    questions: [
      {
        question: "Where should secrets live in production?",
        options: [
          "In platform secret managers / env vars, never in code",
          "Committed to the repo",
          "In the README",
          "In client-side JS",
        ],
        correct_index: 0,
        explanation: "Secrets come from the platform at runtime; anything in git is compromised.",
      },
      {
        question: "What is the 12-Factor rule about configuration?",
        options: [
          "Store config in environment variables",
          "Hard-code config",
          "Put config in the database",
          "Ship config files in the image",
        ],
        correct_index: 0,
        explanation: "Env vars keep config out of code so the same build runs in any environment.",
      },
      {
        question: "Which value is safe to put in a frontend bundle?",
        options: [
          "The public API base URL",
          "A database password",
          "An SMTP secret",
          "A private signing key",
        ],
        correct_index: 0,
        explanation: "Public values like an API URL are fine; secrets must stay server-side.",
      },
    ],
  },
  "Build and health checks": {
    pass_percent: 70,
    questions: [
      {
        question: "What is the purpose of a health check?",
        options: [
          "To let the platform know the app is alive and ready",
          "To make the app slower",
          "To delete data",
          "To log secrets",
        ],
        correct_index: 0,
        explanation: "Health endpoints (e.g. /api/health) feed load balancers and alerts.",
      },
      {
        question: "Before shipping, a good pipeline runs…",
        options: [
          "Typecheck + tests + build + smoke test",
          "Nothing",
          "Only git commit",
          "Only a favicon update",
        ],
        correct_index: 0,
        explanation: "Automated checks catch regressions before users do.",
      },
      {
        question: "Why keep dev, staging, and production environments similar?",
        options: [
          "So what works locally behaves the same in production",
          "So the code can differ per environment",
          "So secrets can be skipped",
          "So tests never run",
        ],
        correct_index: 0,
        explanation: "Dev/prod parity reduces 'works on my machine' surprises.",
      },
    ],
  },
  "Catalog decisions": {
    pass_percent: 70,
    questions: [
      {
        question: "Why do clear level labels matter on course cards?",
        options: [
          "They help learners pick content that matches their skill",
          "They add decoration",
          "They hide courses",
          "They replace titles",
        ],
        correct_index: 0,
        explanation: "Levels set expectations and reduce abandonment from too-hard or too-easy content.",
      },
      {
        question: "A progress signal on a course card helps students…",
        options: [
          "Decide what to continue next",
          "Get lost",
          "Skip the catalog",
          "Hide completion",
        ],
        correct_index: 0,
        explanation: "Seeing '60% complete' motivates continuation and orientates return visits.",
      },
      {
        question: "What is Hick's law about catalogs?",
        options: [
          "More choices slow decisions",
          "More choices speed decisions",
          "Color decides everything",
          "Filters are always bad",
        ],
        correct_index: 0,
        explanation: "Limiting visible options and offering filters helps learners choose confidently.",
      },
    ],
  },
  "Mascot support patterns": {
    pass_percent: 70,
    questions: [
      {
        question: "A helper hint should appear…",
        options: [
          "In-context, near the task, without blocking reading",
          "Over the entire lesson",
          "Only in emails",
          "Never",
        ],
        correct_index: 0,
        explanation: "Context-aware, non-blocking help (like Cora's rail) supports without distracting.",
      },
      {
        question: "Why ask before a helper acts on the page?",
        options: [
          "It respects user control and avoids surprise changes",
          "It is slower",
          "It is cheaper",
          "It hides features",
        ],
        correct_index: 0,
        explanation: "Consent keeps learners in control of their own page and progress.",
      },
      {
        question: "What makes a mascot's help feel familiar?",
        options: [
          "A consistent identity and tone across every message",
          "A different look each time",
          "Random emoji everywhere",
          "Long paragraphs",
        ],
        correct_index: 0,
        explanation: "Consistent identity and one-idea messages make support predictable and trustworthy.",
      },
    ],
  },
  "Tables, rows, and keys": {
    pass_percent: 70,
    questions: [
      {
        question: "What uniquely identifies each row in a table?",
        options: ["Primary key", "Foreign key", "Column count", "Table name"],
        correct_index: 0,
        explanation: "A primary key gives each row a unique identifier.",
      },
      {
        question: "A foreign key is used to…",
        options: [
          "Reference a row in another table",
          "Replace the primary key",
          "Rename a column",
          "Delete a row",
        ],
        correct_index: 0,
        explanation: "Foreign keys link tables so related data can be joined.",
      },
      {
        question: "In a students table, which column is usually the primary key?",
        options: ["id", "first_name", "city", "age"],
        correct_index: 0,
        explanation: "An id column is the typical stable, unique key for each student.",
      },
    ],
  },
  "Selecting data with SELECT": {
    pass_percent: 70,
    questions: [
      {
        question: "Which query returns only the name and score columns?",
        options: ["SELECT name, score FROM students", "SELECT * FROM students", "DELETE name, score", "INSERT INTO students"],
        correct_index: 0,
        explanation: "Listing columns after SELECT returns just those columns.",
      },
      {
        question: "How do you filter rows where score is above 80?",
        options: ["WHERE score > 80", "LIMIT score 80", "ORDER BY score 80", "HAVING score = 80"],
        correct_index: 0,
        explanation: "WHERE filters rows before they are returned.",
      },
      {
        question: "How do you sort results by score descending?",
        options: ["ORDER BY score DESC", "SORT score ASC", "GROUP BY score", "LIMIT score DESC"],
        correct_index: 0,
        explanation: "ORDER BY score DESC returns the highest scores first.",
      },
    ],
  },
  "Joins that make sense": {
    pass_percent: 70,
    questions: [
      {
        question: "Which join returns only matching rows from both tables?",
        options: ["INNER JOIN", "LEFT JOIN", "FULL JOIN", "CROSS JOIN"],
        correct_index: 0,
        explanation: "INNER JOIN keeps only rows that match on the join condition.",
      },
      {
        question: "A LEFT JOIN keeps…",
        options: [
          "All rows from the left table plus matches from the right",
          "Only exact matches",
          "Only the right table",
          "Duplicate rows",
        ],
        correct_index: 0,
        explanation: "Left rows without a match appear with NULLs for the right columns.",
      },
      {
        question: "What goes in the ON clause of a join?",
        options: [
          "The condition linking the two tables (e.g. students.id = enrollments.student_id)",
          "A random column name",
          "An ORDER BY",
          "A LIMIT",
        ],
        correct_index: 0,
        explanation: "ON states how rows in the two tables correspond.",
      },
    ],
  },
  "Grouping and counting": {
    pass_percent: 70,
    questions: [
      {
        question: "Which clause groups rows for aggregation?",
        options: ["GROUP BY", "WHERE", "ORDER BY", "LIMIT"],
        correct_index: 0,
        explanation: "GROUP BY collapses rows into groups so COUNT/SUM can run per group.",
      },
      {
        question: "SELECT category, COUNT(*) FROM courses GROUP BY category counts…",
        options: [
          "How many courses are in each category",
          "All courses combined",
          "The categories list",
          "Nothing",
        ],
        correct_index: 0,
        explanation: "COUNT(*) counts rows within each category group.",
      },
      {
        question: "How do you filter groups (not rows) after grouping?",
        options: ["HAVING", "WHERE", "DISTINCT", "OFFSET"],
        correct_index: 0,
        explanation: "HAVING filters aggregated groups; WHERE filters rows before grouping.",
      },
    ],
  },
  "Commits — saving checkpoints": {
    pass_percent: 70,
    questions: [
      {
        question: "What does a commit do?",
        options: [
          "Saves a named checkpoint of your changes",
          "Deletes your files",
          "Uploads to the cloud",
          "Merges branches",
        ],
        correct_index: 0,
        explanation: "A commit captures the project state with a message you can return to.",
      },
      {
        question: "Which command stages changes before committing?",
        options: ["git add", "git commit --direct", "git fetch", "git clone"],
        correct_index: 0,
        explanation: "git add moves changes into the staging area; git commit records them.",
      },
      {
        question: "What makes a commit message most useful?",
        options: [
          "A short description of what and why",
          "Random numbers",
          "An empty message",
          "Your password",
        ],
        correct_index: 0,
        explanation: "Clear messages make history searchable and understandable.",
      },
    ],
  },
  "Undoing work safely": {
    pass_percent: 70,
    questions: [
      {
        question: "Which command discards uncommitted changes to a file?",
        options: ["git restore <file>", "git push", "git clone", "git stash list"],
        correct_index: 0,
        explanation: "git restore reverts a working-tree file to the last committed state.",
      },
      {
        question: "How do you undo the last commit while keeping the changes?",
        options: ["git reset --soft HEAD~1", "git rm -rf .", "git branch -d main", "git fetch origin"],
        correct_index: 0,
        explanation: "--soft moves HEAD back but keeps the changes staged for editing.",
      },
      {
        question: "What is the safest way to revisit an old commit's code?",
        options: [
          "Check out a branch at that commit",
          "Delete the repository",
          "Edit history by force",
          "Ignore it",
        ],
        correct_index: 0,
        explanation: "Working on a branch avoids rewriting shared history.",
      },
    ],
  },
  "Branches — parallel work": {
    pass_percent: 70,
    questions: [
      {
        question: "What is a branch?",
        options: [
          "A separate line of development from the main code",
          "A copy of your computer",
          "A database",
          "A commit message",
        ],
        correct_index: 0,
        explanation: "Branches let you work in parallel without affecting the main line.",
      },
      {
        question: "Which command creates a new branch?",
        options: ["git branch <name>", "git commit", "git clone", "git push"],
        correct_index: 0,
        explanation: "git branch creates a branch; git checkout/switch moves onto it.",
      },
      {
        question: "What happens when you merge a branch into main?",
        options: [
          "Its changes are combined into main",
          "The branch deletes main",
          "Everything is lost",
          "A new repo is created",
        ],
        correct_index: 0,
        explanation: "Merging brings the branch's commits into the target branch.",
      },
    ],
  },
  "Working with a remote": {
    pass_percent: 70,
    questions: [
      {
        question: "Which command uploads your commits to the remote?",
        options: ["git push", "git pull", "git clone", "git status"],
        correct_index: 0,
        explanation: "push sends your local commits to the remote repository.",
      },
      {
        question: "Which command downloads and merges the remote's changes?",
        options: ["git pull", "git push", "git add", "git log"],
        correct_index: 0,
        explanation: "pull fetches remote changes and merges them into your branch.",
      },
      {
        question: "What does git clone do?",
        options: [
          "Copies a remote repo to your machine",
          "Deletes a repo",
          "Renames a branch",
          "Starts a server",
        ],
        correct_index: 0,
        explanation: "clone downloads the whole repository so you can work locally.",
      },
    ],
  },
  "Setting up and your first class": {
    pass_percent: 70,
    questions: [
      {
        question: "Which method must every Java program's main class have?",
        options: ["public static void main(String[] args)", "public void run()", "public String toString()", "static void boot()"],
        correct_index: 0,
        explanation: "The JVM starts execution at main(String[] args).",
      },
      {
        question: "What is the file name rule for a public class named App?",
        options: ["App.java", "app.java", "main.java", "class.java"],
        correct_index: 0,
        explanation: "A public class must live in a file named after it.",
      },
      {
        question: "Which command compiles App.java?",
        options: ["javac App.java", "java App.java", "compile App", "run App"],
        correct_index: 0,
        explanation: "javac produces the .class bytecode; java runs it.",
      },
    ],
  },
  "Variables and typed data": {
    pass_percent: 70,
    questions: [
      {
        question: "Which type holds a whole number?",
        options: ["int", "String", "boolean", "double"],
        correct_index: 0,
        explanation: "int stores integers; double stores decimals.",
      },
      {
        question: "How do you declare an integer variable named age set to 18?",
        options: ["int age = 18;", "var age = '18';", "age int = 18", "integer age 18"],
        correct_index: 0,
        explanation: "Java requires a type before the variable name.",
      },
      {
        question: "What does the compiler check before your code runs?",
        options: [
          "That types and references are correct",
          "Nothing",
          "Only comments",
          "Only line numbers",
        ],
        correct_index: 0,
        explanation: "Type-checking catches many bugs at compile time.",
      },
    ],
  },
  "If, loops, and arrays": {
    pass_percent: 70,
    questions: [
      {
        question: "Which syntax runs code when a condition is true?",
        options: ["if (score > 60) { ... }", "when score > 60", "do score > 60", "loop score"],
        correct_index: 0,
        explanation: "if statements branch on a boolean condition.",
      },
      {
        question: "Which loop runs a fixed number of times?",
        options: ["for (int i = 0; i < 5; i++)", "if (i < 5)", "boolean b = true", "return i"],
        correct_index: 0,
        explanation: "The classic for loop iterates a counted range.",
      },
      {
        question: "What is the index of the first element in an array?",
        options: ["0", "1", "-1", "length"],
        correct_index: 0,
        explanation: "Arrays are 0-indexed in Java.",
      },
    ],
  },
  "Methods — reusable behavior": {
    pass_percent: 70,
    questions: [
      {
        question: "What is a method?",
        options: [
          "A named block of reusable behavior",
          "A variable",
          "A file",
          "A loop",
        ],
        correct_index: 0,
        explanation: "Methods package behavior that can be called with parameters.",
      },
      {
        question: "How do you return a value from a method?",
        options: [
          "Use the return keyword with a value",
          "Print it",
          "Set a global",
          "Assign null",
        ],
        correct_index: 0,
        explanation: "return hands a value back to the caller.",
      },
      {
        question: "What does a method's signature include?",
        options: [
          "Return type, name, and parameters",
          "Only its name",
          "Only comments",
          "The file path",
        ],
        correct_index: 0,
        explanation: "The signature defines how the method is called.",
      },
    ],
  },
  "Semantic page structure": {
    pass_percent: 70,
    questions: [
      {
        question: "Which element marks the main navigation of a page?",
        options: ["<nav>", "<div>", "<span>", "<b>"],
        correct_index: 0,
        explanation: "<nav> conveys that its links are navigation, helping both users and SEO.",
      },
      {
        question: "Which heading should be used once for the page title?",
        options: ["<h1>", "<h6>", "<p>", "<img>"],
        correct_index: 0,
        explanation: "One <h1> per page states the page's main topic.",
      },
      {
        question: "Why prefer semantic elements over generic <div>s?",
        options: [
          "They give meaning to assistive tech and search engines",
          "They are faster",
          "They hide content",
          "They disable CSS",
        ],
        correct_index: 0,
        explanation: "Semantic tags communicate structure to screen readers and crawlers.",
      },
    ],
  },
  "Text, links, and images": {
    pass_percent: 70,
    questions: [
      {
        question: "Which attribute sets the destination of a link?",
        options: ["href", "src", "alt", "class"],
        correct_index: 0,
        explanation: "<a href=\"...\"> points the link to its target URL.",
      },
      {
        question: "What does alt text on an image do?",
        options: [
          "Describes the image for screen readers and when it fails to load",
          "Changes the image size",
          "Adds a border",
          "Stores the URL",
        ],
        correct_index: 0,
        explanation: "alt is essential accessibility and a fallback description.",
      },
      {
        question: "Which element wraps a paragraph of text?",
        options: ["<p>", "<h1>", "<img>", "<a>"],
        correct_index: 0,
        explanation: "<p> marks a paragraph block of text.",
      },
    ],
  },
  "Selectors, colors, and the box model": {
    pass_percent: 70,
    questions: [
      {
        question: "Which selector targets elements with class=\"card\"?",
        options: [".card", "#card", "card", "*card"],
        correct_index: 0,
        explanation: "A leading dot selects by class; a hash selects by id.",
      },
      {
        question: "What are the three parts of the box model?",
        options: [
          "Content, padding/border, margin",
          "Header, footer, body",
          "Color, font, size",
          "Top, middle, bottom",
        ],
        correct_index: 0,
        explanation: "Every element is a box: content plus padding/border inside margin.",
      },
      {
        question: "Which property changes the text color?",
        options: ["color", "background-color", "font-size", "padding"],
        correct_index: 0,
        explanation: "color sets foreground text color; background-color sets the box fill.",
      },
    ],
  },
  "Responsive layouts with flex and grid": {
    pass_percent: 70,
    questions: [
      {
        question: "Which rule centers flex children along the main axis?",
        options: ["justify-content: center", "align-items: center", "position: center", "margin: auto 0"],
        correct_index: 0,
        explanation: "justify-content aligns along the main (row/column) axis.",
      },
      {
        question: "What do media queries do?",
        options: [
          "Apply CSS conditionally based on screen size",
          "Load images",
          "Add animations",
          "Rename classes",
        ],
        correct_index: 0,
        explanation: "Media queries let layouts adapt to phones, tablets, and desktops.",
      },
      {
        question: "Which grid value creates flexible repeating columns?",
        options: [
          "repeat(auto-fit, minmax(200px, 1fr))",
          "200px 200px 200px",
          "none",
          "auto auto",
        ],
        correct_index: 0,
        explanation: "auto-fit + minmax makes columns flow and wrap responsively.",
      },
    ],
  },
  "Values, variables, and types": {
    pass_percent: 70,
    questions: [
      {
        question: "Which keyword declares a block-scoped variable that can change?",
        options: ["let", "const", "var x = 5 (always)", "type"],
        correct_index: 0,
        explanation: "let declares mutable block-scoped variables; const is for fixed values.",
      },
      {
        question: "What is the type of the value \"hello\"?",
        options: ["string", "number", "boolean", "object"],
        correct_index: 0,
        explanation: "Text in quotes is a string.",
      },
      {
        question: "How do you log a value to the browser console?",
        options: ["console.log(value)", "print(value)", "alert.print(value)", "log(value)"],
        correct_index: 0,
        explanation: "console.log prints values for debugging.",
      },
    ],
  },
  "Functions and arrow functions": {
    pass_percent: 70,
    questions: [
      {
        question: "What is a function?",
        options: [
          "A reusable block of code you can call",
          "A variable",
          "A DOM element",
          "A style rule",
        ],
        correct_index: 0,
        explanation: "Functions package behavior that can run with different inputs.",
      },
      {
        question: "Which is a valid arrow function?",
        options: ["const add = (a, b) => a + b", "function => add", "add(a, b) arrow", "const add = a + b"],
        correct_index: 0,
        explanation: "Arrow syntax: const fn = (params) => expression.",
      },
      {
        question: "What do parameters do?",
        options: [
          "Receive inputs so the function can work with them",
          "Hide the function",
          "Style the function",
          "Return nothing",
        ],
        correct_index: 0,
        explanation: "Parameters are the function's declared inputs.",
      },
    ],
  },
  "The DOM and selecting elements": {
    pass_percent: 70,
    questions: [
      {
        question: "What is the DOM?",
        options: [
          "The browser's tree of page elements you can script",
          "A CSS framework",
          "A database",
          "A build tool",
        ],
        correct_index: 0,
        explanation: "The DOM is the structured representation of the page JavaScript can read and change.",
      },
      {
        question: "Which call finds the first element matching a CSS selector?",
        options: ["document.querySelector('.card')", "window.fetch('.card')", "document.createElement('.card')", "query.all('.card')"],
        correct_index: 0,
        explanation: "querySelector accepts CSS selectors and returns the first match.",
      },
      {
        question: "How do you change a selected element's text?",
        options: ["el.textContent = 'New text'", "el.href = 'text'", "print(el)", "el.src = 'text'"],
        correct_index: 0,
        explanation: "Setting textContent updates the element's visible text.",
      },
    ],
  },
  "Events and interactivity": {
    pass_percent: 70,
    questions: [
      {
        question: "Which method listens for a click on a button?",
        options: [
          "button.addEventListener('click', handler)",
          "button.click(handler)",
          "window.onclick(button)",
          "button.listen(click)",
        ],
        correct_index: 0,
        explanation: "addEventListener attaches a handler for the named event.",
      },
      {
        question: "What argument does an event handler receive?",
        options: [
          "An event object with details like target",
          "The full page HTML",
          "A random number",
          "Nothing",
        ],
        correct_index: 0,
        explanation: "The event object lets you read the target, key, or value.",
      },
      {
        question: "Why use addEventListener instead of inline onclick attributes?",
        options: [
          "It keeps markup clean and allows multiple handlers",
          "It is slower",
          "It disables the button",
          "It requires a server",
        ],
        correct_index: 0,
        explanation: "Separating behavior from markup and supporting multiple handlers is cleaner.",
      },
    ],
  },
  "Running your first Python program": {
    pass_percent: 70,
    questions: [
      {
        question: "Which function prints text to the console?",
        options: ["print()", "echo()", "write()", "log()"],
        correct_index: 0,
        explanation: "print() outputs its arguments to standard output.",
      },
      {
        question: "What extension do Python source files use?",
        options: [".py", ".js", ".java", ".txt"],
        correct_index: 0,
        explanation: "Python files conventionally end in .py.",
      },
      {
        question: "Which tool runs a Python file?",
        options: [
          "python filename.py",
          "run filename",
          "node filename",
          "compile filename",
        ],
        correct_index: 0,
        explanation: "The python interpreter executes .py files.",
      },
    ],
  },
  "Variables, strings, and numbers": {
    pass_percent: 70,
    questions: [
      {
        question: "What does name = 'Ada' do?",
        options: [
          "Stores the string 'Ada' in the variable name",
          "Prints Ada",
          "Deletes name",
          "Errors out",
        ],
        correct_index: 0,
        explanation: "Assignment stores a value in a variable.",
      },
      {
        question: "How do you combine a variable into a string cleanly?",
        options: [
          "Use an f-string: f'Hello {name}'",
          "Just write the variable name",
          "Multiply strings",
          "Convert with int()",
        ],
        correct_index: 0,
        explanation: "f-strings interpolate variables into text.",
      },
      {
        question: "What type is 3.14?",
        options: ["float", "int", "string", "bool"],
        correct_index: 0,
        explanation: "Decimals are floats; whole numbers are ints.",
      },
    ],
  },
  "Conditionals with if and else": {
    pass_percent: 70,
    questions: [
      {
        question: "Which comparison checks if score is at least 70?",
        options: ["score >= 70", "score => 70", "score = 70", "score >< 70"],
        correct_index: 0,
        explanation: ">= means greater than or equal to.",
      },
      {
        question: "What follows the condition in an if statement?",
        options: ["A colon and an indented block", "A semicolon", "A brace", "Nothing"],
        correct_index: 0,
        explanation: "Python uses a colon plus indentation to mark the block.",
      },
      {
        question: "What does elif do?",
        options: [
          "Checks another condition when the previous one was false",
          "Ends the program",
          "Loops forever",
          "Prints the condition",
        ],
        correct_index: 0,
        explanation: "elif chains additional checks after if/else.",
      },
    ],
  },
  "Loops with for and while": {
    pass_percent: 70,
    questions: [
      {
        question: "Which loop runs a block for each item in a list?",
        options: ["for item in items:", "while item in items", "loop items", "each item"],
        correct_index: 0,
        explanation: "for x in xs iterates over each element of a sequence.",
      },
      {
        question: "Which loop repeats while a condition stays true?",
        options: ["while count < 5:", "for count < 5", "if count < 5", "do count"],
        correct_index: 0,
        explanation: "while re-checks its condition before every iteration.",
      },
      {
        question: "What does range(5) produce?",
        options: [
          "The numbers 0 through 4",
          "The number 5",
          "A list of five 5s",
          "Nothing",
        ],
        correct_index: 0,
        explanation: "range(5) yields 0,1,2,3,4 — five values.",
      },
    ],
  },
  "The box model and flow": {
    pass_percent: 70,
    questions: [
      {
        question: "What is inside the box model?",
        options: [
          "Content, padding, border, margin",
          "Width, height, color, font",
          "Header, footer, sidebar",
          "Rows, columns, cells",
        ],
        correct_index: 0,
        explanation: "Every element is a content box wrapped in padding, border, and margin.",
      },
      {
        question: "Which property controls space inside an element's border?",
        options: ["padding", "margin", "border", "gap"],
        correct_index: 0,
        explanation: "Padding is inside the border; margin is outside it.",
      },
      {
        question: "What does box-sizing: border-box do?",
        options: [
          "Makes width/height include padding and border",
          "Removes all borders",
          "Centers content",
          "Hides margins",
        ],
        correct_index: 0,
        explanation: "border-box keeps the declared size stable regardless of padding.",
      },
    ],
  },
  "Flexbox essentials": {
    pass_percent: 70,
    questions: [
      {
        question: "Which property makes an element a flex container?",
        options: ["display: flex", "position: flex", "flex: auto", "align: flex"],
        correct_index: 0,
        explanation: "display: flex turns the element into a flex container.",
      },
      {
        question: "Which property centers flex items on the cross axis?",
        options: ["align-items: center", "justify-content: center", "flex-wrap: center", "order: center"],
        correct_index: 0,
        explanation: "align-items works on the cross axis; justify-content on the main axis.",
      },
      {
        question: "What does flex: 1 mean on a child?",
        options: [
          "It grows to fill available space",
          "It shrinks to nothing",
          "It is hidden",
          "It never wraps",
        ],
        correct_index: 0,
        explanation: "flex: 1 lets the item grow proportionally to share leftover space.",
      },
    ],
  },
  "Grid for whole-page layout": {
    pass_percent: 70,
    questions: [
      {
        question: "Which property defines the grid's columns?",
        options: ["grid-template-columns", "grid-column", "display: grid (only)", "grid-flow"],
        correct_index: 0,
        explanation: "grid-template-columns declares the column track sizes.",
      },
      {
        question: "What does grid-area let you do?",
        options: [
          "Place an item in a named template area",
          "Delete a grid",
          "Rotate cells",
          "Hide rows",
        ],
        correct_index: 0,
        explanation: "Named areas make whole-page layouts readable in CSS.",
      },
      {
        question: "Which value makes a column take all remaining space?",
        options: ["1fr", "auto", "100% always", "minmax 0"],
        correct_index: 0,
        explanation: "fr units distribute the remaining space between tracks.",
      },
    ],
  },
  "A page layout that adapts": {
    pass_percent: 70,
    questions: [
      {
        question: "How do you make a sidebar disappear on phones?",
        options: [
          "Hide it under a media query for small widths",
          "Use display: table",
          "Add more columns",
          "Increase the font size",
        ],
        correct_index: 0,
        explanation: "Media queries re-arrange or hide elements below a breakpoint.",
      },
      {
        question: "What does 1rem scale with?",
        options: ["The root font size", "The viewport width", "The image size", "Nothing"],
        correct_index: 0,
        explanation: "rem units track the root font-size, aiding proportional scaling.",
      },
      {
        question: "Why start a layout mobile-first?",
        options: [
          "Simple mobile rules are easier to enhance for larger screens",
          "Desktop is irrelevant",
          "It is impossible",
          "CSS only works on mobile",
        ],
        correct_index: 0,
        explanation: "Mobile-first adds complexity only when the screen can afford it.",
      },
    ],
  },
  "Put it together — a card gallery": {
    pass_percent: 70,
    questions: [
      {
        question: "Which single rule makes a card grid fluid?",
        options: [
          "grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))",
          "position: absolute for each card",
          "float: left for each card",
          "display: none",
        ],
        correct_index: 0,
        explanation: "auto-fit + minmax packs as many cards as fit at each width.",
      },
      {
        question: "A card gallery should keep cards…",
        options: [
          "Equal height with consistent internal spacing",
          "Random sizes",
          "Overlapping",
          "Unreadable",
        ],
        correct_index: 0,
        explanation: "Consistent sizing and spacing make the gallery scannable.",
      },
      {
        question: "Where should hover feedback go on a card?",
        options: [
          "On the whole card so it reads as interactive",
          "Nowhere",
          "Only on the footer",
          "Only in print",
        ],
        correct_index: 0,
        explanation: "Whole-card hover states communicate that the card is clickable.",
      },
    ],
  },
};

export const COURSES: SeedCourse[] = [
  {
    title: "Frontend Foundations with React",
    slug: "frontend-foundations-react",
    description: "Build responsive interfaces with HTML, CSS, JavaScript, React components, and reusable UI patterns.",
    short_description: "Create polished React pages from the ground up.",
    level: "beginner",
    duration: "4 weeks",
    is_featured: true,
    is_ai_generated: false,
    image_url: "/course-covers/frontend-foundations-react.svg",
    category_slug: "web-development",
    modules: [
      {
        title: "Build the page structure",
        description: "Start with semantic HTML and layout thinking.",
        order: 1,
        lessons: [
          {
            title: "How the web page is assembled",
            content: "You will learn how headings, sections, links, images, and forms create a meaningful page structure before styling begins.",
            duration: "12 min",
            order: 1,
            is_published: true,
            resources: [
              { title: "MDN — How the web works", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works", license: "CC-BY-SA 4.0" },
              { title: "MDN — HTML basics", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content", license: "CC-BY-SA 4.0" },
              { title: "freeCodeCamp — Learn HTML", url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/learn-html-by-building-a-cat-photo-app", license: "CC-BY-SA 4.0" },
              { title: "Wikipedia — HTML", url: "https://en.wikipedia.org/wiki/HTML", license: "CC-BY-SA 4.0" },
            ],
          },
          {
            title: "Responsive layout with flex and grid",
            content: "Practice building a course-card layout that works on mobile, tablet, and desktop screens.",
            duration: "18 min",
            order: 2,
            is_published: true,
            resources: [
              { title: "MDN — CSS flexbox", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox", license: "CC-BY-SA 4.0" },
              { title: "MDN — CSS grid layout", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout", license: "CC-BY-SA 4.0" },
              { title: "The Odin Project — Flexbox", url: "https://www.theodinproject.com/lessons/foundations-flexbox", license: "CC-BY-SA 4.0" },
              { title: "freeCodeCamp — Responsive Web Design", url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/", license: "CC-BY-SA 4.0" },
            ],
          },
        ],
        quiz: {
          pass_percent: 70,
          questions: [
            {
              question: "What is the single job of HTML?",
              options: ["It defines the structure and content of a page", "It styles how a page looks", "It makes a page respond to clicks", "It stores data on a server"],
              correct_index: 0,
              explanation: "HTML (HyperText Markup Language) defines structure; CSS handles appearance and JavaScript handles behavior.",
            },
            {
              question: "Which CSS approach makes a row of chips wrap onto the next line on small screens?",
              options: ["position: absolute", "flex-wrap: wrap", "font-weight: bold", "box-shadow"],
              correct_index: 1,
              explanation: "flex-wrap: wrap lets flex items drop to a new line when they run out of room.",
            },
            {
              question: "What is the DOM?",
              options: ["A database of web pages", "The browser's in-memory tree of a page's elements", "A styling framework", "A JavaScript library"],
              correct_index: 1,
              explanation: "After parsing HTML, the browser builds an in-memory tree of elements called the Document Object Model.",
            },
            {
              question: "Which grid snippet creates a fluid set of columns that collapse on narrow screens?",
              options: ["grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))", "grid-template-columns: 200px 200px 200px", "display: block", "overflow: hidden"],
              correct_index: 0,
              explanation: "auto-fit with minmax() lets the browser decide how many fixed-minimum columns fit at each width.",
            },
          ],
        },
      },
      {
        title: "React components",
        description: "Turn repeated UI into maintainable components.",
        order: 2,
        lessons: [
          {
            title: "Props, state, and reusable cards",
            content: "Create a reusable course card component, pass data into it, and render a catalog from an array.",
            duration: "22 min",
            order: 1,
            is_published: true,
            resources: [
              { title: "react.dev — Passing props to a component", url: "https://react.dev/learn/passing-props-to-a-component", license: "MIT" },
              { title: "react.dev — State: a component's memory", url: "https://react.dev/learn/state-a-components-memory", license: "MIT" },
              { title: "react.dev — Rendering lists", url: "https://react.dev/learn/rendering-lists", license: "MIT" },
              { title: "MDN — JavaScript arrow functions & arrays", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map", license: "CC-BY-SA 4.0" },
            ],
          },
          {
            title: "Forms and local state",
            content: "Build a course search form and connect its input to filtered catalog results.",
            duration: "20 min",
            order: 2,
            is_published: true,
            resources: [
              { title: "react.dev — Managing state", url: "https://react.dev/learn/managing-state", license: "MIT" },
              { title: "react.dev — Reacting to input with state", url: "https://react.dev/learn/reacting-to-input-with-state", license: "MIT" },
              { title: "MDN — Client-side form validation", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation", license: "CC-BY-SA 4.0" },
              { title: "freeCodeCamp — React forms & hooks", url: "https://www.freecodecamp.org/learn/front-end-development-libraries/react/", license: "CC-BY-SA 4.0" },
            ],
          },
        ],
        quiz: {
          pass_percent: 70,
          questions: [
            {
              question: "How does a parent component pass data to a child component?",
              options: ["Through a global variable", "Through props", "By writing to the child's DOM directly", "Through cookies"],
              correct_index: 1,
              explanation: "Props flow downward: a parent passes values to a child component as JSX attributes.",
            },
            {
              question: "What does useState return?",
              options: ["A DOM node", "A pair: the current state value and a function to update it", "The component's props", "An object of CSS classes"],
              correct_index: 1,
              explanation: "useState returns a two-element array — the current value and a setter that re-renders the component.",
            },
            {
              question: "Which pattern correctly filters a list for a search query in React?",
              options: ["courses.filter(c => c.title.toLowerCase().includes(query))", "courses.splice(0)", "document.write(query)", "query.push(courses)"],
              correct_index: 0,
              explanation: "filter() returns a new array of matches; combined with state it gives live search-as-you-type.",
            },
            {
              question: "Why use controlled inputs (value + onChange) for a search box?",
              options: ["It stores text on the server", "The input's value is always backed by React state, so UI and data stay in sync", "It disables the input", "It automatically submits the form"],
              correct_index: 1,
              explanation: "A controlled input keeps the displayed value driven by React state, so filtering follows every keystroke.",
            },
          ],
        },
      },
    ],
  },
  {
    title: "Python Data Analysis Starter",
    slug: "python-data-analysis-starter",
    description: "Use Python, pandas, and charts to clean data, answer questions, and explain insights.",
    short_description: "Analyze real datasets with Python basics and pandas.",
    level: "beginner",
    duration: "3 weeks",
    is_featured: true,
    is_ai_generated: false,
    image_url: "/course-covers/python-data-analysis-starter.svg",
    category_slug: "data-science",
    modules: [
      {
        title: "Python for data work",
        description: "Learn the minimum Python needed for analysis.",
        order: 1,
        lessons: [
          {
            title: "Variables, lists, and dictionaries",
            content: "Model student names, scores, and course progress using Python data structures.",
            duration: "15 min",
            order: 1,
            is_published: true,
            resources: [
              { title: "Python docs — The Python Tutorial", url: "https://docs.python.org/3/tutorial/introduction.html", license: "PSF" },
              { title: "Python docs — Data Structures", url: "https://docs.python.org/3/tutorial/datastructures.html", license: "PSF" },
              { title: "freeCodeCamp — Learn Python", url: "https://www.freecodecamp.org/learn/scientific-computing-with-python/", license: "CC-BY-SA 4.0" },
              { title: "Wikipedia — Python (programming language)", url: "https://en.wikipedia.org/wiki/Python_(programming_language)", license: "CC-BY-SA 4.0" },
            ],
          },
          {
            title: "Cleaning a messy table",
            content: "Use pandas to rename columns, handle missing values, and prepare a dataset for reporting.",
            duration: "24 min",
            order: 2,
            is_published: true,
            resources: [
              { title: "pandas — Getting started (user guide)", url: "https://pandas.pydata.org/docs/getting_started/index.html", license: "BSD-3-Clause" },
              { title: "pandas — Working with missing data", url: "https://pandas.pydata.org/docs/user_guide/missing_data.html", license: "BSD-3-Clause" },
              { title: "freeCodeCamp — Data Analysis with Python", url: "https://www.freecodecamp.org/learn/data-analysis-with-python/", license: "CC-BY-SA 4.0" },
              { title: "Wikipedia — pandas (software)", url: "https://en.wikipedia.org/wiki/Pandas_(software)", license: "CC-BY-SA 4.0" },
            ],
          },
        ],
        quiz: {
          pass_percent: 70,
          questions: [
            {
              question: "Which Python structure maps keys to values?",
              options: ["list", "dictionary", "tuple", "set"],
              correct_index: 1,
              explanation: "A dict stores key→value pairs, e.g. {'student': 'Ada', 'score': 92}.",
            },
            {
              question: "How do you rename a column in pandas?",
              options: ["df.rename(columns={'old': 'new'})", "df.drop('old')", "df.columns = 5", "pd.new_column()"],
              correct_index: 0,
              explanation: "rename() with a columns mapping is the standard, non-destructive way to relabel columns.",
            },
            {
              question: "What does df.isna().sum() tell you?",
              options: ["The number of missing values per column", "The total sum of all values", "The number of rows", "The mean of each column"],
              correct_index: 0,
              explanation: "isna() flags missing values; summing those flags counts them per column.",
            },
            {
              question: "Which call fills missing numeric values with the column average?",
              options: ["df.fillna(df.mean())", "df.dropna(axis=0)", "df.round()", "df.describe()"],
              correct_index: 0,
              explanation: "fillna(df.mean()) replaces NaNs with each column's mean, a common imputation step.",
            },
          ],
        },
      },
      {
        title: "Explain the insight",
        description: "Move from numbers to decisions.",
        order: 2,
        lessons: [
          {
            title: "Group, summarize, and compare",
            content: "Calculate completion rate by course category and identify where students need support.",
            duration: "21 min",
            order: 1,
            is_published: true,
            resources: [
              { title: "pandas — Group By", url: "https://pandas.pydata.org/docs/user_guide/groupby.html", license: "BSD-3-Clause" },
              { title: "pandas — Aggregations", url: "https://pandas.pydata.org/docs/getting_started/intro_tutorials/06_calculate_statistics.html", license: "BSD-3-Clause" },
              { title: "freeCodeCamp — Pandas lessons", url: "https://www.freecodecamp.org/learn/data-analysis-with-python/data-analysis-with-python-course/pandas-dataframes", license: "CC-BY-SA 4.0" },
              { title: "Wikipedia — Group by (SQL/Pandas)", url: "https://en.wikipedia.org/wiki/Group_by_(SQL)", license: "CC-BY-SA 4.0" },
            ],
          },
          {
            title: "Build a simple chart",
            content: "Create a bar chart and write a short recommendation from the result.",
            duration: "18 min",
            order: 2,
            is_published: true,
            resources: [
              { title: "Matplotlib — Pyplot tutorial", url: "https://matplotlib.org/stable/tutorials/pyplot.html", license: "BSD-3-Clause" },
              { title: "Matplotlib — Bar charts", url: "https://matplotlib.org/stable/api/_as_gen/matplotlib.pyplot.bar.html", license: "BSD-3-Clause" },
              { title: "pandas — Plotting", url: "https://pandas.pydata.org/docs/user_guide/visualization.html", license: "BSD-3-Clause" },
              { title: "Wikipedia — Data visualization", url: "https://en.wikipedia.org/wiki/Data_visualization", license: "CC-BY-SA 4.0" },
            ],
          },
        ],
        quiz: {
          pass_percent: 70,
          questions: [
            {
              question: "Which pandas call groups a DataFrame by category?",
              options: ["df.groupby('category')", "df.sort_values('category')", "df.pivot('category')", "df.filter('category')"],
              correct_index: 0,
              explanation: "groupby() creates groups; chain .agg() or .mean() to summarize each one.",
            },
            {
              question: "What does df.groupby('category')['completion'].mean() return?",
              options: ["One mean completion rate per category", "Every row with a mean column", "A single number", "The sum per category"],
              correct_index: 0,
              explanation: "It collapses each category group into its mean completion rate — ideal for comparisons.",
            },
            {
              question: "Which matplotlib call draws a bar chart?",
              options: ["plt.bar(x, height)", "plt.plot(x, height)", "plt.scatter(x, height)", "plt.hist(height)"],
              correct_index: 0,
              explanation: "plt.bar() renders vertical bars from categories (x) and values (height).",
            },
            {
              question: "When comparing completion rates across categories, what is the clearest chart?",
              options: ["A bar chart of the rates", "A 500-column table", "A single number", "A random scatter"],
              correct_index: 0,
              explanation: "Bars make category-to-category comparisons visually immediate.",
            },
          ],
        },
      },
    ],
  },
  {
    title: "AI Prompting for Course Creators",
    slug: "ai-prompting-course-creators",
    description: "Plan lessons, quizzes, examples, and feedback using practical AI prompting workflows.",
    short_description: "Use AI to draft better lessons and support learners.",
    level: "intermediate",
    duration: "2 weeks",
    is_featured: true,
    is_ai_generated: false,
    image_url: "/course-covers/ai-prompting-course-creators.svg",
    category_slug: "ai-ml",
    modules: [
      {
        title: "Prompt with purpose",
        description: "Write prompts that produce usable teaching material.",
        order: 1,
        lessons: [
          {
            title: "Define learner level and outcome",
            content: "Turn a broad topic into a clear learning objective, prerequisite list, and success check.",
            duration: "14 min",
            order: 1,
            is_published: true,
            resources: [
              { title: "Google — Prompt design strategies", url: "https://developers.google.com/machine-learning/resources/prompt-eng", license: "CC-BY 4.0" },
              { title: "Wikipedia — Prompt engineering", url: "https://en.wikipedia.org/wiki/Prompt_engineering", license: "CC-BY-SA 4.0" },
              { title: "OpenAI — Prompt engineering guide", url: "https://platform.openai.com/docs/guides/prompt-engineering", license: "OpenAI docs" },
              { title: "freeCodeCamp — Beginner's guide to AI prompting", url: "https://www.freecodecamp.org/news/how-to-write-effective-prompts-for-ai/", license: "CC-BY-SA 4.0" },
            ],
          },
          {
            title: "Generate examples and exercises",
            content: "Ask AI for examples, then improve them with constraints that match your course audience.",
            duration: "19 min",
            order: 2,
            is_published: true,
            resources: [
              { title: "Google — Iterate on prompts", url: "https://developers.google.com/machine-learning/resources/prompt-eng#iterative", license: "CC-BY 4.0" },
              { title: "Wikipedia — Active learning", url: "https://en.wikipedia.org/wiki/Active_learning", license: "CC-BY-SA 4.0" },
              { title: "freeCodeCamp — Prompt engineering for developers", url: "https://www.freecodecamp.org/news/prompt-engineering-for-developers/", license: "CC-BY-SA 4.0" },
            ],
          },
        ],
        quiz: {
          pass_percent: 70,
          questions: [
            {
              question: "Which prompt is most specific about the audience?",
              options: ["'Write a lesson'", "'Write a 10-minute beginner lesson on flexbox for adults new to coding'", "'Write something about flexbox'", "'Make it good'"],
              correct_index: 1,
              explanation: "Level, length, and audience give the model constraints that produce usable material.",
            },
            {
              question: "What is a learning objective for?",
              options: ["To name the module", "To define what a learner can do after the lesson", "To fill a footer", "To count words"],
              correct_index: 1,
              explanation: "An objective states the measurable outcome, e.g. 'learners can center a card with flexbox'.",
            },
            {
              question: "After AI drafts an exercise, what should you do first?",
              options: ["Publish it immediately", "Check it against your learning objective and audience level", "Delete the AI draft", "Add random questions"],
              correct_index: 1,
              explanation: "Drafts are starting points — review accuracy, tone, and fit before publishing.",
            },
            {
              question: "Why give examples of the expected output in a prompt?",
              options: ["It wastes tokens", "It anchors the model to the right format and style", "It hides the instructions", "It disables the model"],
              correct_index: 1,
              explanation: "Few-shot examples steer the model toward the exact structure and tone you want.",
            },
          ],
        },
      },
      {
        title: "Review and improve",
        description: "Use AI without losing quality control.",
        order: 2,
        lessons: [
          {
            title: "Check accuracy and tone",
            content: "Create a review checklist for AI lesson drafts before publishing.",
            duration: "17 min",
            order: 1,
            is_published: true,
            resources: [
              { title: "Wikipedia — Critical thinking", url: "https://en.wikipedia.org/wiki/Critical_thinking", license: "CC-BY-SA 4.0" },
              { title: "Google — Responsible AI practices", url: "https://ai.google/responsibility/responsible-ai-practices/", license: "Google terms" },
              { title: "Wikipedia — Plain language", url: "https://en.wikipedia.org/wiki/Plain_language", license: "CC-BY-SA 4.0" },
            ],
          },
          {
            title: "Create Cora-style hints",
            content: "Write mascot responses that guide learners without giving away every answer.",
            duration: "20 min",
            order: 2,
            is_published: true,
            resources: [
              { title: "Wikipedia — Scaffolding (teaching)", url: "https://en.wikipedia.org/wiki/Instructional_scaffolding", license: "CC-BY-SA 4.0" },
              { title: "Wikipedia — Cognitive load", url: "https://en.wikipedia.org/wiki/Cognitive_load", license: "CC-BY-SA 4.0" },
              { title: "Wikipedia — Constructivism (philosophy of education)", url: "https://en.wikipedia.org/wiki/Constructivism_(philosophy_of_education)", license: "CC-BY-SA 4.0" },
            ],
          },
        ],
        quiz: {
          pass_percent: 70,
          questions: [
            {
              question: "Which tone should a helper hint use?",
              options: ["Formal legal language", "A short, plain, encouraging nudge", "Dense jargon", "A long essay"],
              correct_index: 1,
              explanation: "Plain, short hints reduce cognitive load and keep learners moving.",
            },
            {
              question: "What is instructional scaffolding?",
              options: ["Removing all support", "Providing support that fades as the learner gains skill", "Making lessons longer", "Randomizing answers"],
              correct_index: 1,
              explanation: "Scaffolding gives structure early, then withdraws it so learners become independent.",
            },
            {
              question: "A good hint should…",
              options: ["Give the answer immediately", "Guide one step at a time and leave a next action", "List every error at once", "Never mention the lesson"],
              correct_index: 1,
              explanation: "One idea + one next step keeps attention on the current problem.",
            },
            {
              question: "Before publishing AI-generated lesson text, you should…",
              options: ["Trust it blindly", "Verify facts, tone, and alignment with the objective", "Remove all examples", "Skip the checklist"],
              correct_index: 1,
              explanation: "Review accuracy and tone against a checklist — AI drafts can sound confident and be wrong.",
            },
          ],
        },
      },
    ],
  },
  {
    title: "Mobile App Basics with React Native",
    slug: "mobile-app-basics-react-native",
    description: "Create a simple mobile learning app screen with navigation, cards, and touch-friendly components.",
    short_description: "Build mobile screens with React Native fundamentals.",
    level: "intermediate",
    duration: "4 weeks",
    is_featured: false,
    is_ai_generated: false,
    image_url: "/course-covers/mobile-app-basics-react-native.svg",
    category_slug: "mobile-development",
    modules: [
      {
        title: "Mobile UI essentials",
        description: "Design for smaller screens and touch interactions.",
        order: 1,
        lessons: [
          {
            title: "Native components and layout",
            content: "Use View, Text, Pressable, and ScrollView to build a course dashboard screen.",
            duration: "20 min",
            order: 1,
            is_published: true,
            resources: [
              { title: "React Native — Core components", url: "https://reactnative.dev/docs/components-and-apis", license: "MIT" },
              { title: "React Native — View / Text / Pressable", url: "https://reactnative.dev/docs/pressable", license: "MIT" },
              { title: "MDN — Touch events vs CSS layout", url: "https://developer.mozilla.org/en-US/docs/Web/API/Touch_events", license: "CC-BY-SA 4.0" },
              { title: "Wikipedia — Responsive web design", url: "https://en.wikipedia.org/wiki/Responsive_web_design", license: "CC-BY-SA 4.0" },
            ],
          },
          {
            title: "Navigation and screens",
            content: "Connect a catalog screen to a course detail screen using navigation patterns.",
            duration: "22 min",
            order: 2,
            is_published: true,
            resources: [
              { title: "React Navigation — Getting started", url: "https://reactnavigation.org/docs/getting-started", license: "MIT" },
              { title: "React Native — Navigation guide", url: "https://reactnative.dev/docs/navigation", license: "MIT" },
              { title: "freeCodeCamp — React Native tutorial", url: "https://www.freecodecamp.org/news/learn-react-native/", license: "CC-BY-SA 4.0" },
            ],
          },
        ],
        quiz: {
          pass_percent: 70,
          questions: [
            {
              question: "Which React Native component renders plain text?",
              options: ["<View>", "<Text>", "<Image>", "<ScrollView>"],
              correct_index: 1,
              explanation: "<Text> is the only component that renders text content in React Native.",
            },
            {
              question: "Which component should wrap a long scrolling list of lessons?",
              options: ["<ScrollView>", "<Modal>", "<Pressable>", "<StatusBar>"],
              correct_index: 0,
              explanation: "ScrollView scrolls its children; FlatList is better for large data-driven lists.",
            },
            {
              question: "What is the recommended way to move between screens in React Native?",
              options: ["window.location", "A navigation library such as React Navigation", "document.write", "alert()"],
              correct_index: 1,
              explanation: "React Navigation (or Expo Router) is the standard; there is no URL bar on native.",
            },
            {
              question: "Why use <Pressable> instead of a plain <View> for touch targets?",
              options: ["It adds accessibility + press states", "It is faster than anything", "It renders HTML", "It disables touch"],
              correct_index: 0,
              explanation: "Pressable gives pressed/disabled/accessible states out of the box.",
            },
          ],
        },
      },
    ],
  },
  {
    title: "DevOps Launch Checklist",
    slug: "devops-launch-checklist",
    description: "Prepare a web app for release with environment variables, build checks, health checks, and deployment habits.",
    short_description: "Ship applications with repeatable checks.",
    level: "intermediate",
    duration: "3 weeks",
    is_featured: false,
    is_ai_generated: false,
    image_url: "/course-covers/devops-launch-checklist.svg",
    category_slug: "devops",
    modules: [
      {
        title: "Release readiness",
        description: "Make deployment less fragile.",
        order: 1,
        lessons: [
          {
            title: "Environment variables and secrets",
            content: "Separate local, staging, and production configuration without leaking sensitive values.",
            duration: "16 min",
            order: 1,
            is_published: true,
            resources: [
              { title: "12 Factor — Config", url: "https://12factor.net/config", license: "CC-BY 4.0" },
              { title: "Docker docs — Environment variables", url: "https://docs.docker.com/compose/environment-variables/", license: "Apache-2.0" },
              { title: "Wikipedia — Environment variable", url: "https://en.wikipedia.org/wiki/Environment_variable", license: "CC-BY-SA 4.0" },
              { title: "GitHub — Encrypted secrets", url: "https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions", license: "GitHub docs" },
            ],
          },
          {
            title: "Build and health checks",
            content: "Run frontend builds, backend health checks, and smoke tests before shipping.",
            duration: "18 min",
            order: 2,
            is_published: true,
            resources: [
              { title: "12 Factor — Disposability & Dev/prod parity", url: "https://12factor.net/dev-prod-parity", license: "CC-BY 4.0" },
              { title: "Wikipedia — Continuous delivery", url: "https://en.wikipedia.org/wiki/Continuous_delivery", license: "CC-BY-SA 4.0" },
              { title: "MDN — Cross-origin / health of web apps", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200", license: "CC-BY-SA 4.0" },
            ],
          },
        ],
        quiz: {
          pass_percent: 70,
          questions: [
            {
              question: "Where should secrets live in production?",
              options: ["Committed to the repo", "In platform secret managers / env vars, never in code", "In the README", "In client-side JS"],
              correct_index: 1,
              explanation: "Secrets come from the platform at runtime; anything in git is compromised.",
            },
            {
              question: "What is the purpose of a health check?",
              options: ["To make the app slower", "To let the platform know the app is alive and ready", "To delete data", "To log secrets"],
              correct_index: 1,
              explanation: "Health endpoints (e.g. /api/health) feed load balancers and alerts.",
            },
            {
              question: "Which is the safest way to store a DATABASE_URL?",
              options: ["Hard-code it", "Read it from an environment variable or secret store", "Put it in the frontend bundle", "Email it"],
              correct_index: 1,
              explanation: "Env vars keep configuration out of the codebase and per-environment.",
            },
            {
              question: "Before shipping, a good pipeline runs…",
              options: ["Nothing", "Typecheck + tests + build + smoke test", "Only git commit", "Only a favicon update"],
              correct_index: 1,
              explanation: "Automated checks catch regressions before users do.",
            },
          ],
        },
      },
    ],
  },
  {
    title: "Product Design for Learning Platforms",
    slug: "product-design-learning-platforms",
    description: "Design course catalogs, learning dashboards, lesson screens, and helper mascots for student progress.",
    short_description: "Design focused learning experiences like a product team.",
    level: "beginner",
    duration: "3 weeks",
    is_featured: false,
    is_ai_generated: false,
    image_url: "/course-covers/product-design-learning-platforms.svg",
    category_slug: "product-design",
    modules: [
      {
        title: "Learning experience design",
        description: "Make pages help students decide, start, and continue.",
        order: 1,
        lessons: [
          {
            title: "Catalog decisions",
            content: "Organize course cards, filters, levels, and progress signals so students can choose confidently.",
            duration: "15 min",
            order: 1,
            is_published: true,
            resources: [
              { title: "Wikipedia — User experience design", url: "https://en.wikipedia.org/wiki/User_experience_design", license: "CC-BY-SA 4.0" },
              { title: "freeCodeCamp — UX design basics", url: "https://www.freecodecamp.org/news/ui-ux-design-guide/", license: "CC-BY-SA 4.0" },
              { title: "Wikipedia — Hick's law", url: "https://en.wikipedia.org/wiki/Hick%27s_law", license: "CC-BY-SA 4.0" },
            ],
          },
          {
            title: "Mascot support patterns",
            content: "Design helper prompts that answer questions without distracting from the lesson.",
            duration: "18 min",
            order: 2,
            is_published: true,
            resources: [
              { title: "Wikipedia — Chatbot", url: "https://en.wikipedia.org/wiki/Chatbot", license: "CC-BY-SA 4.0" },
              { title: "Wikipedia — Scaffolding (teaching)", url: "https://en.wikipedia.org/wiki/Instructional_scaffolding", license: "CC-BY-SA 4.0" },
              { title: "Wikipedia — Notification (accessibility)", url: "https://en.wikipedia.org/wiki/Notification_system", license: "CC-BY-SA 4.0" },
            ],
          },
        ],
        quiz: {
          pass_percent: 70,
          questions: [
            {
              question: "Why do clear level labels (beginner/intermediate) matter on course cards?",
              options: ["They add decoration", "They help learners pick content that matches their skill", "They hide courses", "They replace titles"],
              correct_index: 1,
              explanation: "Levels set expectations and reduce abandonment from too-hard or too-easy content.",
            },
            {
              question: "A progress signal on a course card helps students…",
              options: ["Get lost", "Decide what to continue next", "Skip the catalog", "Hide completion"],
              correct_index: 1,
              explanation: "Seeing '60% complete' motivates continuation and orientates return visits.",
            },
            {
              question: "A helper hint should appear…",
              options: ["Over the entire lesson", "In-context, near the task, without blocking reading", "Only in emails", "Never"],
              correct_index: 1,
              explanation: "Context-aware, non-blocking help (like Cora's rail) supports without distracting.",
            },
            {
              question: "Why ask before a helper acts on the page?",
              options: ["It is slower", "It respects user control and avoids surprise changes", "It is cheaper", "It hides features"],
              correct_index: 1,
              explanation: "Consent keeps learners in control of their own page and progress.",
            },
          ],
        },
      },
    ],
  },
];