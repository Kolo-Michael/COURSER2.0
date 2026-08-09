import {
  askCora,
  completeLesson,
  enrollInCourse,
  getCourseBySlug,
  listMyEnrollments,
  restartCourse,
  type ApiCourse,
  type ApiEnrollmentDetail,
  type ApiLesson,
} from '@/api/courses'
import { getSession, type AuthSession } from '@/auth/session'
import { DashboardLayout, type DashboardNavItem } from '@/components/layout/DashboardLayout'
import { navItemsFor } from '@/components/layout/navItems'
import { PublicShell } from '@/components/layout/PublicShell'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

function categoryIcon(course: ApiCourse) {
  return course.category?.icon ? `fa-solid ${course.category.icon}` : 'fa-solid fa-book-open'
}

function detailNav(session: AuthSession, activeCourseSlug?: string): DashboardNavItem[] {
  return navItemsFor(session.role, activeCourseSlug)
}

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

type Tab = 'Transcript' | 'Notes' | 'Resources'
type ChatRole = 'assistant' | 'user'
type ChatMessage = { role: ChatRole; text: string }

const NOTES_STORAGE_KEY = (slug: string) => `courser.notes:${slug}`

/** Render the lesson media: a real player when a video exists, otherwise
 *  the "Video not yet available" placeholder. The lesson text below is
 *  always readable regardless. */
function LessonMedia({ lesson }: { lesson: ApiLesson }) {
  if (lesson.video_url) {
    return (
      <video
        src={lesson.video_url}
        controls
        playsInline
        className="aspect-video w-full rounded-xl bg-stone-900 object-contain"
        poster=""
      >
        Your browser does not support the video tag.
      </video>
    )
  }
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-100/80 text-stone-400 dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-500">
      <i className="fa-solid fa-video text-5xl" aria-hidden />
      <p className="text-sm font-bold text-stone-600 dark:text-stone-300">Video not yet available</p>
      <p className="px-6 text-center text-xs text-stone-500 dark:text-stone-400">
        The written lesson below is ready to read while this video is being prepared.
      </p>
    </div>
  )
}

export function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [session] = useState(() => getSession())

  const [activeTab, setActiveTab] = useState<Tab>('Transcript')
  const [notes, setNotes] = useState<string>('')
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)

  const [enrollment, setEnrollment] = useState<ApiEnrollmentDetail | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<ApiLesson | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)
  const [restarting, setRestarting] = useState(false)

  const [question, setQuestion] = useState('')
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Ask me about this lesson, confusing terms, or what to do next.' },
  ])
  const [asking, setAsking] = useState(false)

  // Load notes for this course from localStorage on mount.
  useEffect(() => {
    if (!slug) return
    try {
      const saved = window.localStorage.getItem(NOTES_STORAGE_KEY(slug))
      if (saved) setNotes(saved)
    } catch {
      // localStorage may be unavailable in private mode — ignore.
    }
  }, [slug])

  // Persist notes as the user types.
  useEffect(() => {
    if (!slug) return
    try {
      window.localStorage.setItem(NOTES_STORAGE_KEY(slug), notes)
    } catch {
      // ignore
    }
  }, [slug, notes])

  const firstLesson = useMemo(() => course?.modules?.[0]?.lessons[0] ?? null, [course])

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
          setSelectedLesson(data.modules?.[0]?.lessons[0] ?? null)
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

  async function handleMarkComplete(lesson: ApiLesson) {
    if (!session || completing) return
    setCompleting(lesson.id)
    try {
      const result = await completeLesson(lesson.id)
      // Reflect the updated lesson progress + course totals.
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              modules: prev.modules?.map((module) => ({
                ...module,
                lessons: module.lessons.map((item) =>
                  item.id === lesson.id ? { ...item, progress: result.progress, is_completed: result.is_completed } : item,
                ),
              })),
            }
          : prev,
      )
      setEnrollment((prev) =>
        prev
          ? {
              ...prev,
              progress: result.course_progress_percent ?? prev.progress,
              progress_percent: result.course_progress_percent ?? prev.progress_percent,
              completed_lessons: result.completed_lessons ?? prev.completed_lessons,
              total_lessons: result.total_lessons ?? prev.total_lessons,
              is_completed: (result.completed_lessons ?? 0) === (result.total_lessons ?? 0) || (result.course_progress_percent ?? 0) >= 100,
            }
          : prev,
      )
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : 'Could not mark this lesson complete.')
    } finally {
      setCompleting(null)
    }
  }

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

  async function handleAskCora() {
    const trimmed = question.trim()
    if (!trimmed || !course || asking) return
    setChat((prev) => [...prev, { role: 'user', text: trimmed }])
    setQuestion('')
    setAsking(true)
    try {
      const reply = await askCora(course.slug, trimmed)
      setChat((prev) => [...prev, { role: 'assistant', text: reply.answer }])
    } catch (err) {
      setChat((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: err instanceof Error ? err.message : "Cora couldn't reach the tutor service. Try again.",
        },
      ])
    } finally {
      setAsking(false)
    }
  }

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

  const admin = session?.role === 'admin' || session?.role === 'super_admin'
  const lesson = selectedLesson ?? firstLesson
  const resourceUrl = lesson?.video_url ?? null
  const lessonComplete = Boolean(lesson?.is_completed)
  const progressPercent = enrollment?.progress_percent ?? 0

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
                    ? `${progressPercent}% complete — pick a lesson below to keep going.`
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
        <section className="courser-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">Modules & lessons</h2>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20 dark:text-primary-dark">
              {progressPercent}% complete
            </span>
          </div>
          {course.modules?.length ? (
            <ol className="mt-6 space-y-4">
              {course.modules.map((module) => (
                <li key={module.id} className="rounded-xl border border-stone-100 bg-stone-50/60 p-4 dark:border-stone-700/60 dark:bg-stone-800/40">
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs text-primary dark:bg-primary/25 dark:text-primary-dark">
                      {module.order}
                    </span>
                    Module {module.order}: {module.title}
                  </p>
                  <ul className="mt-2 space-y-2 text-sm text-stone-600 dark:text-stone-300">
                    {module.lessons.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedLesson(item)}
                          className={[
                            'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition',
                            lesson?.id === item.id
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/30 dark:border-primary-dark dark:bg-primary-dark/10'
                              : 'border-stone-200 bg-white hover:border-stone-300 dark:border-stone-700 dark:bg-stone-900/50 dark:hover:border-stone-600',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs',
                              item.is_completed
                                ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                                : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-dark',
                            ].join(' ')}
                          >
                            <i className={`fa-solid ${item.is_completed ? 'fa-check' : 'fa-circle-play'}`} aria-hidden />
                          </span>
                          <span className="flex-1">
                            <span className="block font-semibold text-stone-800 dark:text-stone-100">
                              Lesson {module.order}.{item.order}: {item.title}
                            </span>
                            {item.content ? (
                              <span className="mt-1 block line-clamp-1 text-xs text-stone-500 dark:text-stone-400">
                                {item.content}
                              </span>
                            ) : null}
                          </span>
                          <span className="flex shrink-0 items-center gap-2 text-[11px] font-semibold text-stone-400">
                            <span className="rounded-full bg-stone-100 px-2 py-1 dark:bg-stone-800 dark:text-stone-400">
                              {item.duration ?? 'Self-paced'}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-stone-600 dark:text-stone-300">No modules have been published for this course yet.</p>
          )}
        </section>

        <section className="mt-8 courser-card overflow-hidden">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary dark:text-primary-dark">Default learning environment</p>
                  <h2 className="mt-1 text-xl font-bold text-stone-900 dark:text-stone-50">{lesson?.title ?? 'Lesson workspace'}</h2>
                </div>
                {admin ? (
                  <Link
                    to="/admin"
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
                  >
                    <i className="fa-solid fa-sliders mr-2 text-primary dark:text-primary-dark" aria-hidden />
                    Configure
                  </Link>
                ) : null}
              </div>

              <div className="mt-5">
                {lesson ? <LessonMedia lesson={lesson} /> : null}
                {session && lesson ? (
                  <button
                    type="button"
                    onClick={() => handleMarkComplete(lesson)}
                    disabled={completing === lesson.id || lessonComplete}
                    className={[
                      'mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed',
                      lessonComplete
                        ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                        : 'bg-primary text-white hover:brightness-110 disabled:opacity-60 dark:bg-primary-dark',
                    ].join(' ')}
                  >
                    <i className={`fa-solid ${lessonComplete ? 'fa-check' : completing === lesson.id ? 'fa-spinner fa-spin' : 'fa-circle-check'}`} aria-hidden />
                    {lessonComplete ? 'Lesson completed' : completing === lesson.id ? 'Marking…' : 'Mark lesson complete'}
                  </button>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3" role="tablist" aria-label="Lesson resources">
                {(['Transcript', 'Notes', 'Resources'] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className={[
                      'rounded-lg border px-3 py-2 text-sm font-semibold transition',
                      activeTab === tab
                        ? 'border-primary bg-primary text-white shadow-sm dark:bg-primary-dark'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800',
                    ].join(' ')}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/40">
                {activeTab === 'Transcript' ? (
                  <div>
                    <p className="text-sm font-bold text-stone-900 dark:text-stone-50">Lesson transcript</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700 dark:text-stone-200">
                      {lesson?.content?.trim() || 'This lesson has no written content yet — check back soon.'}
                    </p>
                  </div>
                ) : activeTab === 'Notes' ? (
                  <div>
                    <label htmlFor="lesson-notes" className="sr-only">
                      Notes
                    </label>
                    <textarea
                      id="lesson-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Type your notes for this lesson — saved locally."
                      rows={6}
                      className="w-full rounded-lg border border-stone-200 bg-white p-3 text-sm text-stone-800 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-primary-dark dark:focus:ring-primary-dark/25"
                    />
                    <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">Notes are saved in this browser only.</p>
                  </div>
                ) : (
                  <div className="text-sm text-stone-700 dark:text-stone-200">
                    <p className="font-semibold text-stone-900 dark:text-stone-50">Lesson resources</p>
                    <p className="mt-1">Official readings, slides, and the practice task sandbox are linked here once the instructor publishes them.</p>
                    {resourceUrl ? (
                      <a
                        href={resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center text-sm font-semibold text-primary hover:underline dark:text-primary-dark"
                      >
                        <i className="fa-solid fa-up-right-from-square mr-2 text-xs" aria-hidden />
                        Open video resource
                      </a>
                    ) : (
                      <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">No resources published yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <aside className="courser-bg-dots-dense border-t border-stone-200 bg-stone-50 p-6 dark:border-stone-700 dark:bg-stone-900 lg:border-l lg:border-t-0">
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 rounded-full bg-primary">
                  <span className="absolute left-4 top-5 h-2 w-2 rounded-full bg-white" />
                  <span className="absolute right-4 top-5 h-2 w-2 rounded-full bg-white" />
                  <span className="absolute bottom-5 left-1/2 h-1.5 w-6 -translate-x-1/2 rounded-full bg-accent" />
                  <span className="absolute -right-1 -top-1 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                    AI
                  </span>
                </div>
                <div>
                  <p className="font-bold text-stone-900 dark:text-stone-50">Cora answers questions</p>
                  <p className="text-sm text-stone-600 dark:text-stone-300">Available by default in every free course.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 rounded-xl border border-stone-200/70 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-stone-700/60 dark:bg-stone-900/70">
                <div className="max-h-56 space-y-2 overflow-y-auto" aria-live="polite">
                  {chat.map((msg, idx) => (
                    <p
                      key={idx}
                      className={[
                        'rounded-lg p-3 text-sm',
                        msg.role === 'assistant'
                          ? 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200'
                          : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-dark',
                      ].join(' ')}
                    >
                      {msg.text}
                    </p>
                  ))}
                  {asking ? (
                    <p className="rounded-lg bg-stone-100 p-3 text-sm text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                      <i className="fa-solid fa-spinner mr-2 text-xs" aria-hidden />
                      Cora is thinking...
                    </p>
                  ) : null}
                </div>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleAskCora()
                  }}
                >
                  <label htmlFor="ask-cora" className="sr-only">
                    Ask Cora a question
                  </label>
                  <input
                    id="ask-cora"
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask Cora a question..."
                    disabled={asking}
                    className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-primary-dark dark:focus:ring-primary-dark/25"
                  />
                  <button
                    type="submit"
                    disabled={asking || !question.trim()}
                    className="rounded-lg bg-primary px-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary-dark"
                  >
                    <i className="fa-solid fa-paper-plane" aria-hidden />
                  </button>
                </form>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </CourseDetailShell>
  )
}
