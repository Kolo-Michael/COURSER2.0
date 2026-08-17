// ─── DashboardPage: the student's learning hub ───────────────────────────────
// Landing page for the "student" dashboard role. Loads the user's real
// enrollments (via GET /courses/enrollments/me) and renders: a welcome hero
// with browse/home/logout actions, summary stat cards (enrolled / completed /
// lessons done / average progress), a continue-learning grid with progress
// bars + restart, and a static weekly-plan/Cora-help side panel.

import { getCourseBySlug, listMyEnrollments, restartCourse, type ApiCourse, type ApiEnrollmentDetail } from '@/api/courses'
import { getSession } from '@/auth/session'
import { getLastCourseSlug } from '@/auth/course'
import { CourseWorkspacePanel } from '@/components/course/CourseWorkspacePanel'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { navItemsFor } from '@/components/layout/navItems'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

// The student dashboard — wraps everything in the role-based DashboardLayout.
export function DashboardPage() {
  // Session snapshot read once; the greeting falls back to "there" when the
  // session cookie can't be parsed.
  const session = getSession()
  const displayName = session?.identifier || 'there'

  // Enrollment + progress state loaded from the API.
  const [enrollments, setEnrollments] = useState<ApiEnrollmentDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restarting, setRestarting] = useState<string | null>(null)

  // The in-progress course surfaced in the on-dashboard workspace: the learner's
  // most advanced uncompleted enrollment, falling back to any enrollment.
  const [continueCourse, setContinueCourse] = useState<ApiCourse | null>(null)
  const continueEnrollment = useMemo(() => {
    if (!enrollments.length) return null
    const active = enrollments.filter((enrollment) => !enrollment.is_completed)
    const pool = active.length ? active : enrollments
    return pool.reduce(
      (best, enrollment) => (enrollment.progress_percent > (best?.progress_percent ?? -1) ? enrollment : best),
      null as ApiEnrollmentDetail | null,
    )
  }, [enrollments])

  // Resolve the active course slug for the sidebar "Course workspace" entry,
  // preferring the current enrollment, then the last-open course from storage.
  const activeCourseSlug = continueEnrollment?.course_slug ?? getLastCourseSlug() ?? undefined

  // Fetch the learner's enrollments from the backend.
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

   // Load once on mount.
    useEffect(() => {
      load()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Fetch the full course detail for the on-dashboard workspace once the
    // continue-enrollment is known. Non-fatal on failure.
    useEffect(() => {
      const enrollment = continueEnrollment
      if (!enrollment) {
        setContinueCourse(null)
        return
      }
      let active = true
      setContinueCourse(null)
      getCourseBySlug(enrollment.course_slug)
        .then((data) => {
          if (active) setContinueCourse(data)
        })
        .catch(() => {
          if (active) setContinueCourse(null)
        })
      return () => {
        active = false
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [continueEnrollment])

  // Restart a course (with confirm): zeroes progress, then refreshes the list.
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

  // Derived stats shown in the four summary cards.
  const completedCourses = enrollments.filter((enrollment) => enrollment.is_completed)
  const totalLessonsCompleted = enrollments.reduce(
    (total, enrollment) => total + enrollment.completed_lessons,
    0,
  )
  const averageProgress = enrollments.length
    ? Math.round(enrollments.reduce((total, enrollment) => total + enrollment.progress_percent, 0) / enrollments.length)
    : 0

  // Summary cards — labels/values/icons reused in the stats grid below.
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
       navItems={navItemsFor(session?.role ?? 'student', activeCourseSlug)}
    >
      <div className="space-y-6">
        {/* Welcome hero with primary actions + server-side logout. */}
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
               <i className="fa-solid fa-house mr-2 text-primary dark:text-primary-dark" aria-hidden />
               Home
             </Link>
           </div>
        </section>

        {/* Stat cards grid. */}
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

        {/* Continue learning: loading / error / empty states, then the card grid. */}
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
                <article key={course.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white/60 backdrop-blur-sm dark:border-stone-700 dark:bg-stone-800/40">
                  {course.course_image_url ? (
                    <img
                      src={course.course_image_url}
                      alt={`${course.course_title} cover`}
                      className="h-24 w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="p-4">
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

        {/* On-dashboard course workspace: keeps the lesson + Cora reachable here
           so learners don't have to leave the dashboard to keep studying. */}
        {continueCourse ? (
          <section className="mt-6 courser-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">Continue your course</h3>
              <Link
                to={`/courses/${continueCourse.slug}`}
                className="text-sm font-semibold text-primary hover:underline dark:text-primary-dark"
              >
                Open full workspace
              </Link>
            </div>
            <CourseWorkspacePanel
              course={continueCourse}
              session={session}
              enrollment={continueEnrollment}
              onEnrollmentChange={(updated) => {
                if (!updated) return
                setEnrollments((prev) =>
                  prev.map((enrollment) =>
                    enrollment.course_slug === updated.course_slug ? { ...enrollment, ...updated } : enrollment,
                  ),
                )
              }}
            />
          </section>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
