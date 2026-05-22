import { listCategories, listCourses, type ApiCategory, type ApiCourse } from '@/api/courses'
import { getSession, roleDashboards, type AuthSession } from '@/auth/session'
import { DashboardLayout, type DashboardNavItem } from '@/components/layout/DashboardLayout'
import { PublicShell } from '@/components/layout/PublicShell'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const allCategories = [{ id: 'all', label: 'All topics', icon: 'fa-solid fa-layer-group' }]

function categoryIcon(category: ApiCategory | null) {
  return category?.icon ? `fa-solid ${category.icon}` : 'fa-solid fa-book-open'
}

function CourseCard({ course }: { course: ApiCourse }) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3 rounded-t-2xl bg-gradient-to-r from-primary to-blue-800 p-5 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <i className={`${categoryIcon(course.category)} text-lg`} aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">
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

      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="flex-1 text-sm leading-relaxed text-slate-600">
          {course.short_description ?? course.description ?? 'Open this course to review the full outline.'}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-slate-100 px-3 py-1 capitalize text-slate-700">
            {course.level}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            <i className="fa-regular fa-clock mr-1" aria-hidden />
            {course.duration ?? 'Self-paced'}
          </span>
          <span className="rounded-full bg-green-100 px-3 py-1 text-green-700 ring-1 ring-green-200">
            Free
          </span>
        </div>
        <Link
          to={`/courses/${course.slug}`}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          View details
          <i className="fa-solid fa-arrow-right ml-2 text-xs" aria-hidden />
        </Link>
      </div>
    </article>
  )
}

function sessionNav(session: AuthSession): DashboardNavItem[] {
  if (session.role === 'student') {
    return [
      { to: '/dashboard', label: 'My dashboard', iconClass: 'fa-solid fa-gauge' },
      { to: '/courses', label: 'Learning catalog', iconClass: 'fa-solid fa-book-open-reader' },
    ]
  }

  return [
    { to: roleDashboards[session.role], label: session.role === 'super_admin' ? 'Owner overview' : 'Admin workspace', iconClass: 'fa-solid fa-gauge-high' },
    { to: '/admin', label: 'Course builder', iconClass: 'fa-solid fa-pen-ruler' },
    { to: '/courses', label: 'Learning catalog', iconClass: 'fa-solid fa-book-open-reader' },
  ]
}

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
        <p className="text-sm font-bold text-slate-900">Cora is ready</p>
        <p className="text-xs leading-relaxed text-slate-600">
          Your course guide keeps lessons, progress, and next actions in one place.
        </p>
      </div>
    </div>
  )
}

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
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 border-b border-slate-200 bg-gradient-to-r from-primary to-blue-800 p-6 text-white lg:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">
                {admin ? 'Admin view' : `Welcome back, ${learnerName}`}
              </p>
              <h2 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
                {featured?.title ?? 'Your course library is ready'}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200">
                {featured?.short_description ??
                  'Browse the same COURSER catalog from inside your workspace, with course progress and lesson actions close by.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {featured ? (
                  <Link
                    to={`/courses/${featured.slug}`}
                    className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
                  >
                    <i className="fa-solid fa-play mr-2 text-xs" aria-hidden />
                    Continue course
                  </Link>
                ) : null}
                {admin ? (
                  <Link
                    to="/admin"
                    className="inline-flex items-center rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    <i className="fa-solid fa-plus mr-2 text-xs" aria-hidden />
                    Add a course
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 text-slate-900 shadow-sm">
              <CourseMascot />
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-xs font-semibold uppercase text-slate-500">Courses</dt>
                  <dd className="mt-1 font-bold text-primary">{courses.length}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-xs font-semibold uppercase text-slate-500">Lessons</dt>
                  <dd className="mt-1 font-bold text-slate-900">{lessonCount || 'Ready'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Available courses</p>
                <p className="mt-1 text-sm text-slate-600">
                  Search by topic, open a course, and start directly from your workspace.
                </p>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                Free access
              </span>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <i
                  className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-3 text-sm text-slate-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search courses..."
                  aria-label="Search courses"
                  className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
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
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
                <i className="fa-solid fa-spinner mb-3 text-2xl text-primary" aria-hidden />
                <p className="font-semibold text-slate-800">Loading courses...</p>
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
                    className="group grid min-h-40 gap-4 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-primary/40 hover:shadow-md sm:grid-cols-[112px_minmax(0,1fr)]"
                  >
                    <div className={`flex h-28 items-center justify-center rounded-lg ${index % 2 === 0 ? 'bg-blue-50 text-primary' : 'bg-orange-50 text-accent'}`}>
                      <i className={`${categoryIcon(course.category)} text-3xl`} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <i className={categoryIcon(course.category)} aria-hidden />
                          {course.category?.name ?? 'General'}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="capitalize">{course.level}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{course.duration ?? 'Self-paced'}</span>
                      </div>
                      <h3 className="mt-2 font-bold leading-snug text-slate-900 group-hover:text-primary">
                        {course.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                        {course.short_description ?? course.description ?? 'Open this course to continue learning.'}
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(72, 24 + index * 11)}%` }} />
                      </div>
                      <div className="mt-3 inline-flex items-center text-xs font-bold text-primary">
                        Open course
                        <i className="fa-solid fa-arrow-right ml-2" aria-hidden />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-900">Learning interface</p>
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                  <span>Lesson view</span>
                  <span>Cora</span>
                </div>
                <div className="grid grid-cols-[1fr_72px]">
                  <div className="space-y-3 p-3">
                    <div className="h-3 w-24 rounded bg-slate-200" />
                    <div className="h-16 rounded bg-primary/10" />
                    <div className="h-2 rounded bg-slate-200" />
                    <div className="h-2 w-3/4 rounded bg-slate-200" />
                  </div>
                  <div className="border-l border-slate-200 bg-blue-50 p-3">
                    <div className="h-10 w-10 rounded-full bg-primary" />
                    <div className="mt-3 h-2 rounded bg-blue-200" />
                    <div className="mt-2 h-2 rounded bg-blue-200" />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-900">Categories</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.slug)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-primary/40 hover:text-primary"
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

export function CoursesPage() {
  const [session] = useState(() => getSession())
  const [category, setCategory] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [courses, setCourses] = useState<ApiCourse[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Catalog</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Browse courses
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Filter by topic, search by title, then open a course detail view powered by the live
            FastAPI catalog.
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <i
                className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-3 text-sm text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title..."
                aria-label="Search courses"
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50',
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
            <label className="text-sm font-semibold text-slate-700" htmlFor="category-select">
              Category
            </label>
            <select
              id="category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            >
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">
              <i className="fa-solid fa-spinner mb-3 text-2xl text-primary" aria-hidden />
              <p className="font-semibold text-slate-800">Loading courses...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center text-red-700">
              <i className="fa-solid fa-circle-exclamation mb-3 text-2xl" aria-hidden />
              <p className="font-semibold">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-600">
              <i className="fa-regular fa-face-frown mb-3 text-2xl text-slate-400" aria-hidden />
              <p className="font-semibold text-slate-800">No courses match your filters.</p>
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
