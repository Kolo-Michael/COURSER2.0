// ─── CoursesPage: course catalog / library ──────────────────────────────────
// Browseable by anyone. Logged-out visitors get the public catalog page
// (PublicShell); signed-in users get the learner/Admin library inside
// DashboardLayout with the same data. Both views share the search box and
// category filter, filtering `courses` in memory.

import { listCategories, listCourses, type ApiCategory, type ApiCourse } from '@/api/courses'
import { getSession, type AuthSession } from '@/auth/session'
import { DashboardLayout, type DashboardNavItem } from '@/components/layout/DashboardLayout'
import { navItemsFor } from '@/components/layout/navItems'
import { PublicShell } from '@/components/layout/PublicShell'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

// Pseudo-category added to the top of every category list = "show everything".
const allCategories = [{ id: 'all', label: 'All topics', icon: 'fa-solid fa-layer-group' }]

// Font Awesome class for a course's category icon (fallback: book).
function categoryIcon(category: ApiCategory | null) {
  return category?.icon ? `fa-solid ${category.icon}` : 'fa-solid fa-book-open'
}

// Real lesson + module totals from the course tree (never a placeholder).
function courseStats(course: ApiCourse) {
  const modules = course.modules?.length ?? 0
  const lessons = course.modules?.reduce((total, module) => total + (module.lessons?.length ?? 0), 0) ?? 0
  return { modules, lessons }
}

// One catalog card used on the public page: cover image, category icon, title,
// description, level/duration/free badges, real lesson counts, and a "View details" link.
function CourseCard({ course }: { course: ApiCourse }) {
  const { lessons } = courseStats(course)
  return (
    <article className="courser-card overflow-hidden">
      {course.image_url ? (
        <div className="relative h-40">
          <img
            src={course.image_url}
            alt={`${course.title} cover`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {course.is_featured ? (
            <span className="absolute right-3 top-3 rounded-full bg-accent px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
              Featured
            </span>
          ) : null}
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3 rounded-t-2xl bg-stone-100 p-5 text-stone-900 dark:bg-stone-800 dark:text-stone-100">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-stone-700 ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-100 dark:ring-stone-700">
              <i className={`${categoryIcon(course.category)} text-lg`} aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">
                {course.category?.name ?? 'General'}
              </p>
              <h2 className="text-lg font-bold leading-snug">{course.title}</h2>
            </div>
          </div>
          {course.is_featured ? (
            <span className="rounded-full bg-accent px-2 py-1 text-[11px] font-semibold text-white">
              Featured
            </span>
          ) : null}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="flex-1 text-[15px] leading-7 text-stone-700 dark:text-stone-300">
          {course.short_description ?? course.description ?? 'Open this course to review the full outline.'}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-stone-100 px-3 py-1 capitalize text-stone-700 dark:bg-stone-800 dark:text-stone-200">
            {course.level}
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700 dark:bg-stone-800 dark:text-stone-200">
            <i className="fa-regular fa-clock mr-1" aria-hidden />
            {course.duration ?? 'Self-paced'}
          </span>
          {lessons > 0 ? (
            <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700 dark:bg-stone-800 dark:text-stone-200">
              <i className="fa-regular fa-file-lines mr-1" aria-hidden />
              {lessons} lessons
            </span>
          ) : null}
          <span className="rounded-full bg-primary/15 px-3 py-1 text-primary ring-1 ring-primary/25 dark:bg-primary-dark/15 dark:text-primary-dark dark:ring-primary-dark/30">
            Free
          </span>
        </div>
        <Link
          to={`/courses/${course.slug}`}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-primary-dark"
        >
          View details
          <i className="fa-solid fa-arrow-right ml-2 text-xs" aria-hidden />
        </Link>
      </div>
    </article>
  )
}

// Sidebar nav for the signed-in layout, driven by the user's role.
function sessionNav(session: AuthSession): DashboardNavItem[] {
  return navItemsFor(session.role)
}

// Small "Cora is ready" promo for the learner library hero.
function CourseMascot() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
      <div className="relative h-14 w-14 shrink-0 rounded-full bg-primary">
        <span className="absolute left-3 top-4 h-2 w-2 rounded-full bg-white" />
        <span className="absolute right-3 top-4 h-2 w-2 rounded-full bg-white" />
        <span className="absolute bottom-4 left-1/2 h-1.5 w-5 -translate-x-1/2 rounded-full bg-accent" />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-md bg-accent text-[10px] font-bold text-white">
          AI
        </span>
      </div>
      <div>
        <p className="text-sm font-bold text-stone-900 dark:text-stone-100">Cora is ready</p>
        <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
          Your course guide keeps lessons, progress, and next actions in one place.
        </p>
      </div>
    </div>
  )
}

// Signed-in rendering of the library: hero with featured course + quick stats,
// search/filter controls, the filtered course grid, and a learning-interface /
// categories sidebar. All data comes down as props from CoursesPage.
function LoggedInCoursesPage({
  session,
  courses,
  categories,
  categoryOptions,
  category,
  setCategory,
  query,
  setQuery,
  filtered,
  loading,
  error,
}: {
  session: AuthSession
  courses: ApiCourse[]
  categories: ApiCategory[]
  categoryOptions: { id: string; label: string; icon: string }[]
  category: string
  setCategory: (category: string) => void
  query: string
  setQuery: (query: string) => void
  filtered: ApiCourse[]
  loading: boolean
  error: string | null
}) {
  const featured = courses.find((course) => course.is_featured) ?? courses[0]
  const admin = session.role === 'admin' || session.role === 'super_admin'
  const learnerName = session.fullName?.split(' ')[0] ?? 'Learner'
  const lessonCount = courses.reduce((total, course) => {
    return total + (course.modules?.reduce((moduleTotal, module) => moduleTotal + module.lessons.length, 0) ?? 0)
  }, 0)

  return (
    <DashboardLayout
      title={admin ? 'Course library preview' : 'My course library'}
      subtitle={admin ? 'Review the learner-facing course library' : 'Choose a course and continue learning'}
      navItems={sessionNav(session)}
    >
      <div className="space-y-6">
        <section className="courser-card overflow-hidden">
          <div className="courser-bg-dots grid gap-6 border-b border-stone-200 bg-white/50 p-6 text-stone-900 backdrop-blur-md lg:grid-cols-[minmax(0,1fr)_340px] dark:border-stone-700/60 dark:bg-stone-900/60 dark:text-stone-100">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-accent dark:text-accent-dark">
                {admin ? 'Admin view' : `Welcome back, ${learnerName}`}
              </p>
              <h2 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
                {featured?.title ?? 'Your course library is ready'}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                {featured?.short_description ??
                  'Browse the same COURSER catalog from inside your workspace, with course progress and lesson actions close by.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {featured ? (
                  <Link
                    to={`/courses/${featured.slug}`}
                    className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:brightness-110 dark:bg-accent-dark"
                  >
                    <i className="fa-solid fa-play mr-2 text-xs" aria-hidden />
                    Continue course
                  </Link>
                ) : null}
                {admin ? (
                  <Link
                    to="/admin"
                    className="inline-flex items-center rounded-lg border border-stone-700 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100 dark:border-stone-200 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"
                  >
                    <i className="fa-solid fa-plus mr-2 text-xs" aria-hidden />
                    Add a course
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="rounded-lg border border-stone-200/70 bg-white/70 p-4 text-stone-900 shadow-sm backdrop-blur-md dark:border-stone-700/60 dark:bg-stone-900/70 dark:text-stone-100">
              <CourseMascot />
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-stone-50 p-3 dark:bg-stone-800/60">
                  <dt className="text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">Courses</dt>
                  <dd className="mt-1 font-bold text-primary dark:text-primary-dark">{courses.length}</dd>
                </div>
                <div className="rounded-lg bg-stone-50 p-3 dark:bg-stone-800/60">
                  <dt className="text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">Lessons</dt>
                  <dd className="mt-1 font-bold text-stone-900 dark:text-stone-100">{lessonCount || 'Ready'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="courser-card p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">Available courses</p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  Search by topic, open a course, and start directly from your workspace.
                </p>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200 dark:bg-green-950/40 dark:text-green-300 dark:ring-green-800">
                Free access
              </span>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <i
                  className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-3 text-sm text-stone-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search courses..."
                  aria-label="Search courses"
                  className="w-full rounded-lg border border-stone-200 bg-white py-3 pl-10 pr-3 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-primary-dark dark:focus:ring-primary-dark/25"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-stone-200 bg-white px-3 py-3 text-sm font-semibold text-stone-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:border-primary-dark dark:focus:ring-primary-dark/25"
                aria-label="Filter by category"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="mt-6 rounded-lg border border-stone-200 bg-stone-50 p-8 text-center text-stone-600">
                <i className="fa-solid fa-spinner mb-3 text-2xl text-primary" aria-hidden />
                <p className="font-semibold text-stone-800">Loading courses...</p>
              </div>
            ) : error ? (
              <div className="mt-6 rounded-lg border border-red-100 bg-red-50 p-8 text-center text-red-700">
                <p className="font-semibold">{error}</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {filtered.map((course, index) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.slug}`}
                    className="group courser-card grid min-h-40 gap-4 p-4 sm:grid-cols-[112px_minmax(0,1fr)]"
                  >
                    <div className={`flex h-28 items-center justify-center overflow-hidden rounded-lg ${course.image_url ? '' : index % 2 === 0 ? 'bg-blue-50 text-primary' : 'bg-orange-50 text-accent'}`}>
                      {course.image_url ? (
                        <img src={course.image_url} alt={`${course.title} cover`} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <i className={`${categoryIcon(course.category)} text-3xl`} aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-500">
                        <span className="inline-flex items-center gap-1">
                          <i className={categoryIcon(course.category)} aria-hidden />
                          {course.category?.name ?? 'General'}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-stone-300" />
                        <span className="capitalize">{course.level}</span>
                        <span className="h-1 w-1 rounded-full bg-stone-300" />
                        <span>{course.duration ?? 'Self-paced'}</span>
                      </div>
                      <h3 className="mt-2 text-[17px] font-bold leading-snug text-stone-900 group-hover:text-primary">
                        {course.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                        {course.short_description ?? course.description ?? 'Open this course to continue learning.'}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-stone-500 dark:text-stone-400">
                        {courseStats(course).lessons > 0 ? (
                          <span className="inline-flex items-center gap-1.5">
                            <i className="fa-regular fa-file-lines" aria-hidden />
                            {courseStats(course).lessons} lessons
                          </span>
                        ) : null}
                        {courseStats(course).modules > 0 ? (
                          <span className="inline-flex items-center gap-1.5">
                            <i className="fa-regular fa-folder-open" aria-hidden />
                            {courseStats(course).modules} modules
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1.5 text-green-700 dark:text-green-400">
                          <i className="fa-solid fa-gem" aria-hidden />
                          Free
                        </span>
                      </div>
                      <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition group-hover:brightness-110 dark:bg-primary-dark">
                        Open course
                        <i className="fa-solid fa-arrow-right" aria-hidden />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="courser-card p-5">
              <p className="text-sm font-bold text-stone-900">Learning interface</p>
              <div className="mt-4 overflow-hidden rounded-lg border border-stone-200 dark:border-stone-700">
                <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-500 dark:border-stone-700 dark:bg-stone-800">
                  <span>Lesson view</span>
                  <span>Cora</span>
                </div>
                <div className="grid grid-cols-[1fr_72px]">
                  <div className="space-y-3 p-3">
                    <div className="h-3 w-24 rounded bg-stone-200 dark:bg-stone-700" />
                    <div className="h-16 rounded bg-primary/10" />
                    <div className="h-2 rounded bg-stone-200 dark:bg-stone-700" />
                    <div className="h-2 w-3/4 rounded bg-stone-200 dark:bg-stone-700" />
                  </div>
                  <div className="border-l border-stone-200 bg-blue-50 p-3 dark:border-stone-700 dark:bg-blue-950/40">
                    <div className="h-10 w-10 rounded-full bg-primary" />
                    <div className="mt-3 h-2 rounded bg-blue-200 dark:bg-blue-800" />
                    <div className="mt-2 h-2 rounded bg-blue-200 dark:bg-blue-800" />
                  </div>
                </div>
              </div>
            </section>

            <section className="courser-card p-5">
              <p className="text-sm font-bold text-stone-900">Categories</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.slug)}
                    className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:border-primary/40 hover:text-primary"
                  >
                    <i className={`${cat.icon ? `fa-solid ${cat.icon}` : 'fa-solid fa-book-open'} mr-1`} aria-hidden />
                    {cat.name}
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}

// Shared catalog controller: fetches courses + categories once, derives
// search/filter state, then picks the public or logged-in view shell.
export function CoursesPage() {
  // Session snapshot captured once on mount; decides which shell renders.
  const [session] = useState(() => getSession())
  const [category, setCategory] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [courses, setCourses] = useState<ApiCourse[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch the catalog once in parallel; `active` prevents setState on unmount.
  useEffect(() => {
    let active = true

    async function loadCatalog() {
      try {
        const [courseData, categoryData] = await Promise.all([listCourses(), listCategories()])
        if (active) {
          setCourses(courseData)
          setCategories(categoryData)
        }
      } catch {
        if (active) {
          setError('Could not load courses from the API.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadCatalog()

    return () => {
      active = false
    }
  }, [])

  // Dropdown options = "All topics" pseudo-category + real categories,
  // keyed by slug so filtering aligns with course.category.slug.
  const categoryOptions = useMemo(
    () => [
      ...allCategories,
      ...categories.map((cat) => ({
        id: cat.slug,
        label: cat.name,
        icon: cat.icon ? `fa-solid ${cat.icon}` : 'fa-solid fa-book-open',
      })),
    ],
    [categories],
  )

  // In-memory filtering: category must match (or be "all") AND the query must
  // hit the title, short description, or full description (case-insensitive).
  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const catOk = category === 'all' || c.category?.slug === category
      const q = query.trim().toLowerCase()
      const textOk =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.short_description ?? '').toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q)
      return catOk && textOk
    })
  }, [category, courses, query])

  if (session) {
    return (
      <LoggedInCoursesPage
        session={session}
        courses={courses}
        categories={categories}
        categoryOptions={categoryOptions}
        category={category}
        setCategory={setCategory}
        query={query}
        setQuery={setQuery}
        filtered={filtered}
        loading={loading}
        error={error}
      />
    )
  }

  return (
    <PublicShell>
      <div className="courser-bg-dots border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent dark:text-accent-dark">Catalog</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 dark:text-white sm:text-4xl">
            Browse courses
          </h1>
          <p className="mt-3 max-w-2xl text-stone-600 dark:text-stone-300">
            Search by title or filter by topic to find a course that fits your goals.
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <i
                className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-3 text-sm text-stone-400"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title..."
                aria-label="Search courses"
                className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-10 pr-3 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-accent-dark dark:focus:ring-accent-dark/30"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 courser-card p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Categories
            </p>
            <nav className="flex flex-col gap-1" aria-label="Course categories">
              {categoryOptions.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={[
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition',
                    category === cat.id
                      ? 'bg-primary text-white shadow-sm dark:bg-primary-dark'
                      : 'text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800',
                  ].join(' ')}
                >
                  <i className={`${cat.icon} w-5 text-center`} aria-hidden />
                  <span>{cat.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 lg:hidden">
            <label className="text-sm font-semibold text-stone-700 dark:text-stone-200" htmlFor="category-select">
              Category
            </label>
            <select
              id="category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-accent-dark dark:focus:ring-accent-dark/30"
            >
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center text-stone-600 shadow-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
              <i className="fa-solid fa-spinner mb-3 text-2xl text-accent dark:text-accent-dark" aria-hidden />
              <p className="font-semibold text-stone-800 dark:text-white">Loading courses...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-700 shadow-sm dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              <i className="fa-solid fa-circle-exclamation mb-3 text-2xl" aria-hidden />
              <p className="font-semibold">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-600 shadow-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
              <i className="fa-regular fa-face-frown mb-3 text-2xl text-stone-400" aria-hidden />
              <p className="font-semibold text-stone-800 dark:text-white">No courses match your filters.</p>
              <p className="mt-1 text-sm">Try another category or clear your search.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filtered.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicShell>
  )
}
