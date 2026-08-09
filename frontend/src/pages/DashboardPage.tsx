import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { navItemsFor } from '@/components/layout/navItems'
import { logout } from '@/api/auth'
import { listMyEnrollments, restartCourse, type ApiEnrollmentDetail } from '@/api/courses'
import { clearSession, getSession } from '@/auth/session'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const session = getSession()
  const displayName = session?.identifier || 'there'

  const [enrollments, setEnrollments] = useState<ApiEnrollmentDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restarting, setRestarting] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setEnrollments(await listMyEnrollments())
    } catch {
      setError('Could not load your course progress right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleRestart(slug: string, title: string) {
    if (!window.confirm(`Restart "${title}"? Your progress on this course will be reset to zero.`)) return
    setRestarting(slug)
    try {
      await restartCourse(slug)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not restart the course.')
    } finally {
      setRestarting(null)
    }
  }

  const completedCourses = enrollments.filter((enrollment) => enrollment.is_completed)
  const totalLessonsCompleted = enrollments.reduce(
    (total, enrollment) => total + enrollment.completed_lessons,
    0,
  )
  const averageProgress = enrollments.length
    ? Math.round(enrollments.reduce((total, enrollment) => total + enrollment.progress_percent, 0) / enrollments.length)
    : 0

  const stats = [
    { label: 'Courses enrolled', value: String(enrollments.length), icon: 'fa-layer-group' },
    { label: 'Courses completed', value: String(completedCourses.length), icon: 'fa-circle-check' },
    { label: 'Lessons completed', value: String(totalLessonsCompleted), icon: 'fa-book-open-reader' },
    { label: 'Avg. progress', value: `${averageProgress}%`, icon: 'fa-gauge-high' },
  ]

  return (
    <DashboardLayout
      title="Student dashboard"
      subtitle="Your hub for enrollments and progress"
      navItems={navItemsFor(session?.role ?? 'student')}
    >
      <div className="space-y-6">
        <section className="courser-card p-6">
          <p className="text-sm font-semibold text-primary">Welcome</p>
          <h2 className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-50">Hi, {displayName}</h2>
          <p className="mt-2 max-w-3xl text-stone-600 dark:text-stone-300">
            Pick up where you left off, follow a weekly plan, and use Cora inside every lesson when you need a clearer explanation.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/courses"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 dark:bg-primary-dark"
            >
              <i className="fa-solid fa-compass mr-2" aria-hidden />
              Browse courses
            </Link>
            <Link
              to="/"
              className="inline-flex items-center rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800/70"
            >
              <i className="fa-solid fa-house mr-2 text-primary" aria-hidden />
              Home
            </Link>
            <button
              type="button"
              onClick={async () => {
                try {
                  await logout()
                } finally {
                  clearSession()
                  window.location.assign('/auth')
                }
              }}
              className="inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <i className="fa-solid fa-right-from-bracket mr-2" aria-hidden />
              Log out
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="courser-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">{item.label}</p>
                <i className={`fa-solid ${item.icon} text-primary`} aria-hidden />
              </div>
              <p className="mt-3 text-3xl font-bold text-stone-900 dark:text-stone-50">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="courser-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">Continue learning</h3>
            <Link to="/courses" className="text-sm font-semibold text-primary hover:underline dark:text-primary-dark">
              Browse catalog
            </Link>
          </div>

          {loading ? (
            <div className="mt-5 flex items-center justify-center gap-3 rounded-xl border border-stone-200 p-10 text-stone-600 dark:border-stone-700 dark:text-stone-300">
              <i className="fa-solid fa-spinner text-primary" aria-hidden />
              Loading your courses...
            </div>
          ) : error ? (
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              <p className="font-semibold">{error}</p>
              <button type="button" onClick={load} className="mt-3 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold">
                Try again
              </button>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-stone-300 p-10 text-center dark:border-stone-700">
              <i className="fa-regular fa-face-smile mb-3 text-3xl text-stone-400" aria-hidden />
              <p className="font-bold text-stone-900 dark:text-stone-50">You haven't enrolled in any courses yet.</p>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">Pick a free course and start learning today.</p>
              <Link
                to="/courses"
                className="mt-5 inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 dark:bg-primary-dark"
              >
                <i className="fa-solid fa-magnifying-glass mr-2" aria-hidden />
                Browse courses
              </Link>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {enrollments.map((course) => (
                <article key={course.id} className="rounded-xl border border-stone-200 bg-white/60 p-4 backdrop-blur-sm dark:border-stone-700 dark:bg-stone-800/40">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold leading-snug text-stone-900 dark:text-stone-50">{course.course_title}</p>
                    {course.is_completed ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-[11px] font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
                        Done
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                    {course.course_category ?? 'General'} · {course.completed_lessons}/{course.total_lessons} lessons
                  </p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-700">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${Math.max(course.progress_percent, 0)}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs font-semibold">
                    <span className="text-stone-500 dark:text-stone-400">{course.progress_percent}% complete</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRestart(course.course_slug, course.course_title)}
                        disabled={restarting === course.course_slug}
                        className="rounded-lg px-2 py-1 text-stone-500 transition hover:bg-stone-100 hover:text-red-600 disabled:opacity-50 dark:text-stone-400 dark:hover:bg-stone-700"
                        title="Restart course"
                        aria-label={`Restart ${course.course_title}`}
                      >
                        <i className="fa-solid fa-rotate-left" aria-hidden />
                      </button>
                      <Link
                        to={`/courses/${course.course_slug}`}
                        className="rounded-lg bg-primary px-3 py-1 text-white transition hover:brightness-110 dark:bg-primary-dark"
                      >
                        {course.is_completed ? 'Review' : 'Continue'}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="courser-card p-6">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">Weekly plan</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {['Watch', 'Practice', 'Review'].map((step, index) => (
                <div key={step} className="rounded-lg bg-stone-50 p-4 dark:bg-stone-800/60">
                  <p className="text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">Step {index + 1}</p>
                  <p className="mt-1 font-bold text-stone-900 dark:text-stone-50">{step}</p>
                  <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{index === 0 ? 'Finish one lesson' : index === 1 ? 'Submit one task' : 'Ask Cora 2 questions'}</p>
                </div>
              ))}
            </div>
          </div>
          <aside className="rounded-lg border border-blue-100 bg-blue-50 p-6 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/40">
            <p className="text-sm font-semibold text-primary">Cora study help</p>
            <p className="mt-2 text-sm leading-relaxed text-stone-700 dark:text-stone-200">
              Ask for simpler explanations, examples, quizzes, and next steps inside any lesson workspace.
            </p>
          </aside>
        </section>
      </div>
    </DashboardLayout>
  )
}
