// ─── CourseDetailPage: lesson-by-lesson course workspace ────────────────────
// The heart of the learning experience. Loads one course by slug, lets the
// user select a lesson, and renders a reading-first workspace: organized
// study notes (parsed from the seeded `##`/`-`/`**` note format), a
// browser-local personal-notes box, previous/next lesson navigation, an
// enroll + mark-complete + restart flow, a course-progress bar, and the Cora
// Q&A sidebar. Video watching is disabled for now — reading is the primary
// path through every lesson. Logged-out visitors get a PublicShell with an
// explanatory teaser page (CourseExplainer) instead of the workspace — the
// reading UI, progress, and Cora require a session.

import {
  enrollInCourse,
  getCourseBySlug,
  listMyEnrollments,
  restartCourse,
  type ApiCourse,
  type ApiEnrollmentDetail,
} from '@/api/courses'
import { getSession, type AuthSession } from '@/auth/session'
import { rememberCourseSlug } from '@/auth/course'
import { CourseExplainer } from '@/components/course/CourseExplainer'
import { CourseWorkspacePanel } from '@/components/course/CourseWorkspacePanel'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { navItemsFor } from '@/components/layout/navItems'
import { PublicShell } from '@/components/layout/PublicShell'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

// Resolve a Font Awesome class for a course's category icon (fallback: book).
function categoryIcon(course: ApiCourse) {
  return course.category?.icon ? `fa-solid ${course.category.icon}` : 'fa-solid fa-book-open'
}

// Role-based sidebar nav; passes the active course slug so the workspace item
// can stay highlighted on this specific course.
function detailNav(session: AuthSession, activeCourseSlug?: string) {
  return navItemsFor(session.role, activeCourseSlug)
}

// Chooses the layout shell for this page: signed-in users see the dashboard
// workspace; anonymous visitors see the public site shell (the catalog is
// browseable without an account).
function CourseDetailShell({
  session,
  slug,
  title,
  children,
}: {
  session: AuthSession | null
  slug?: string
  title: string
  children: ReactNode
}) {
  if (session) {
    return (
      <DashboardLayout title={title} subtitle="Course workspace" navItems={detailNav(session, slug)}>
        {children}
      </DashboardLayout>
    )
  }

  return <PublicShell>{children}</PublicShell>
}

// Course workspace page. Fetches the course once by URL slug and drives the
// whole reading + learning flow via the shared CourseWorkspacePanel.
export function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  // Core course-fetch state.
  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  // Session snapshot read once at mount (the page is short-lived).
  const [session] = useState(() => getSession())

  // Enrollment-flow state.
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [enrollment, setEnrollment] = useState<ApiEnrollmentDetail | null>(null)
  const [restarting, setRestarting] = useState(false)

  // Remember the last-opened course so the dashboard sidebar keeps a
  // persistent "Course workspace" entry that points back here.
  useEffect(() => {
    if (slug) rememberCourseSlug(slug)
  }, [slug])

  // Fetch the user's enrollment for this course (if signed in) to restore
  // the enrolled state + progress bar. Failures are non-fatal.
  async function loadEnrollment() {
    if (!session || !slug) return
    try {
      const enrollments = await listMyEnrollments()
      const match = enrollments.find((enrollment) => enrollment.course_slug === slug)
      if (match) {
        setEnrollment(match)
        setEnrolled(true)
      }
    } catch {
      // Non-fatal — the workspace still renders.
    }
  }

  // On mount (per slug): fetch the course and load enrollment when
  // authenticated. `active` guards state updates after unmount / slug change.
  useEffect(() => {
    let active = true

    async function loadCourse() {
      if (!slug) {
        setError(true)
        setLoading(false)
        return
      }

      try {
        const data = await getCourseBySlug(slug)
        if (active) {
          setCourse(data)
        }
      } catch {
        if (active) {
          setError(true)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadCourse()
    if (session) loadEnrollment()

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  // Enroll the current user (redirects to signup when logged out, carrying a
  // `next` param so we can bounce back here after auth), then refresh the
  // enrollment record.
  async function handleEnroll() {
    if (!session) {
      if (slug) window.location.href = `/auth?mode=signup&next=/courses/${slug}`
      else window.location.href = '/auth?mode=signup'
      return
    }
    if (!course || enrolling || enrolled) return
    setEnrolling(true)
    setEnrollError(null)
    try {
      await enrollInCourse(course.slug)
      setEnrolled(true)
      await loadEnrollment()
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : 'Could not enroll. Try again.')
    } finally {
      setEnrolling(false)
    }
  }

  // Reset a course to zero. Guarded by a confirm dialog; on success zeroes the
  // enrollment record and every lesson's progress in the workspace copy.
  async function handleRestart() {
    if (!slug || !session || restarting) return
    if (!window.confirm('Restart this course? Your progress will be reset to zero.')) return
    setRestarting(true)
    try {
      await restartCourse(slug)
      setEnrollment((prev) => (prev ? { ...prev, progress: 0, progress_percent: 0, completed_lessons: 0, is_completed: false, completed_at: null } : prev))
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              modules: prev.modules?.map((module) => ({
                ...module,
                lessons: module.lessons.map((item) => ({ ...item, progress: 0, is_completed: false })),
              })),
            }
          : prev,
      )
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : 'Could not restart the course.')
    } finally {
      setRestarting(false)
    }
  }

  // Loading and error early-returns keep a stable shell while data resolves.

  if (loading) {
    return (
      <CourseDetailShell session={session} slug={slug} title="Loading course">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <i className="fa-solid fa-spinner mb-4 text-4xl text-primary" aria-hidden />
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Loading course...</h1>
        </div>
      </CourseDetailShell>
    )
  }

  if (error || !course) {
    return (
      <CourseDetailShell session={session} slug={slug} title="Course not found">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <i className="fa-solid fa-circle-exclamation mb-4 text-4xl text-red-500" aria-hidden />
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Course not found</h1>
          <p className="mt-2 text-stone-600 dark:text-stone-300">
            No course matches <span className="font-mono text-stone-800 dark:text-stone-100">{slug}</span>.
          </p>
          <Link
            to="/courses"
            className="mt-6 inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 dark:bg-primary-dark"
          >
            <i className="fa-solid fa-arrow-left mr-2 text-xs" aria-hidden />
            Back to courses
          </Link>
        </div>
      </CourseDetailShell>
    )
  }

  // Derived page state from course/session/enrollment.
  const admin = session?.role === 'admin' || session?.role === 'super_admin'
  const progressPercent = enrollment?.progress_percent ?? 0

  // Enroll button label depends on auth + enrollment + in-flight state.
  const enrollLabel = session
    ? enrolled
      ? 'Enrolled'
      : enrolling
        ? 'Enrolling...'
        : 'Start course'
    : 'Enroll for free'

  return (
    <CourseDetailShell session={session} slug={slug} title={course.title}>
      <div className="courser-bg-dots border-b border-stone-200 bg-white/70 backdrop-blur-md dark:border-stone-700/60 dark:bg-stone-900/40">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            to="/courses"
            className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80"
          >
            <i className="fa-solid fa-arrow-left mr-2 text-xs" aria-hidden />
            All courses
          </Link>
          {course.image_url ? (
            <img
              src={course.image_url}
              alt={`${course.title} cover`}
              className="mt-6 h-44 w-full max-w-3xl rounded-xl object-cover shadow-sm"
            />
          ) : null}
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary dark:bg-primary/20 dark:text-primary-dark">
                  <i className={categoryIcon(course)} aria-hidden />
                  {course.category?.name ?? 'General'}
                </span>
                <span className="rounded-full bg-stone-100 px-3 py-1 capitalize text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                  {course.level}
                </span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-green-700 ring-1 ring-green-200 dark:bg-green-950/40 dark:text-green-300 dark:ring-green-900">
                  Free
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-4xl">
                {course.title}
              </h1>
              <p className="text-lg text-stone-600 dark:text-stone-300">
                {course.short_description ?? course.description ?? 'Course details are being prepared.'}
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                <i className="fa-regular fa-clock mr-1" aria-hidden />
                {course.duration ?? 'Self-paced'}
              </p>
            </div>
            <div className="courser-card w-full max-w-sm p-6">
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">{session ? 'Ready to learn' : 'Enroll'}</p>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
                {session
                  ? enrolled
                    ? `${progressPercent}% complete — pick a lesson below to keep reading.`
                    : 'Start this free course from your learning workspace.'
                  : 'Sign in as a student to continue enrollment.'}
              </p>
              {enrolled && enrollment ? (
                <>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-700">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-stone-500 dark:text-stone-400">
                    {enrollment.completed_lessons}/{enrollment.total_lessons} lessons · {progressPercent}%
                  </p>
                </>
              ) : null}
              <button
                type="button"
                onClick={handleEnroll}
                disabled={enrolling || enrolled}
                className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary-dark"
              >
                {enrolled ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <i className="fa-solid fa-check" aria-hidden />
                    {enrollLabel}
                  </span>
                ) : (
                  enrollLabel
                )}
              </button>
              {enrolled ? (
                <button
                  type="button"
                  onClick={handleRestart}
                  disabled={restarting}
                  className="mt-2 w-full rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 disabled:opacity-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  <i className="fa-solid fa-rotate-left mr-2" aria-hidden />
                  {restarting ? 'Restarting…' : 'Restart course'}
                </button>
              ) : null}
              {enrollError ? (
                <p className="mt-3 text-xs font-semibold text-red-600">{enrollError}</p>
              ) : null}
              {!session ? (
                <Link
                  to="/auth?mode=signup"
                  className="mt-3 block text-center text-sm font-semibold text-primary hover:underline"
                >
                  Have an account? Log in
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {course.description || course.modules?.length ? (
          <section className="courser-card mb-8 overflow-hidden">
            <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-8">
              <div className="max-w-2xl">
                <h2 className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-stone-50">
                  <i className="fa-solid fa-book-open text-primary dark:text-primary-dark" aria-hidden />
                  About this course
                </h2>
                <p className="mt-3 text-[15px] leading-7 text-stone-700 dark:text-stone-200">
                  {course.description}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5 dark:border-stone-700 dark:bg-stone-800/40">
                <p className="text-sm font-bold text-stone-900 dark:text-stone-50">What you'll cover</p>
                {course.modules?.length ? (
                  <ul className="mt-3 space-y-2.5">
                    {course.modules.map((module, moduleIndex) => (
                      <li key={module.id} className="flex items-start gap-2.5 text-sm text-stone-700 dark:text-stone-200">
                        <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary dark:bg-primary-dark/20 dark:text-primary-dark">
                          {moduleIndex + 1}
                        </span>
                        <span>
                          <span className="font-semibold">{module.title}</span>
                          <span className="block text-xs text-stone-500 dark:text-stone-400">
                            {module.lessons.length} lesson{module.lessons.length === 1 ? '' : 's'}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Modules are being prepared.</p>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {session ? (
          <CourseWorkspacePanel
            course={course}
            session={session}
            enrollment={enrollment}
            headerAction={
              admin ? (
                <Link
                  to="/admin"
                  className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  <i className="fa-solid fa-sliders mr-2 text-primary dark:text-primary-dark" aria-hidden />
                  Configure
                </Link>
              ) : null
            }
            onEnrollmentChange={setEnrollment}
          />
        ) : (
          <CourseExplainer course={course} />
        )}
      </div>
    </CourseDetailShell>
  )
}