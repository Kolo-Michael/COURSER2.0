import { getCourseBySlug, enrollInCourse, askCora, type ApiCourse } from '@/api/courses'
import { getSession, roleDashboards, type AuthSession } from '@/auth/session'
import { DashboardLayout, type DashboardNavItem } from '@/components/layout/DashboardLayout'
import { PublicShell } from '@/components/layout/PublicShell'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

function categoryIcon(course: ApiCourse) {
  return course.category?.icon ? `fa-solid ${course.category.icon}` : 'fa-solid fa-book-open'
}

function detailNav(session: AuthSession): DashboardNavItem[] {
  if (session.role === 'student') {
    return [
      { to: '/dashboard', label: 'My dashboard', iconClass: 'fa-solid fa-gauge' },
      { to: '/courses', label: 'Learning catalog', iconClass: 'fa-solid fa-book-open-reader' },
    ]
  }

  return [
    {
      to: roleDashboards[session.role],
      label: session.role === 'super_admin' ? 'Owner overview' : 'Admin workspace',
      iconClass: 'fa-solid fa-gauge-high',
    },
    { to: '/admin', label: 'Course builder', iconClass: 'fa-solid fa-pen-ruler' },
    { to: '/courses', label: 'Learning catalog', iconClass: 'fa-solid fa-book-open-reader' },
  ]
}

function CourseDetailShell({
  session,
  title,
  children,
}: {
  session: AuthSession | null
  title: string
  children: ReactNode
}) {
  if (session) {
    return (
      <DashboardLayout title={title} subtitle="Course workspace" navItems={detailNav(session)}>
        {children}
      </DashboardLayout>
    )
  }

  return <PublicShell>{children}</PublicShell>
}

type Tab = 'Transcript' | 'Notes' | 'Resources'
type ChatRole = 'assistant' | 'user'
type ChatMessage = { role: ChatRole; text: string }

const TAB_CONTENT: Record<Tab, { label: string; body: string }> = {
  Transcript: {
    label: 'Lesson transcript',
    body: 'Welcome to the lesson. This transcript mirrors the script and updates as you scrub the video. Use the search shortcut to jump anywhere.',
  },
  Notes: {
    label: 'Your notes',
    body: 'Notes are saved locally to your browser for this lesson. Clear them by removing the site data or opening a new browser profile.',
  },
  Resources: {
    label: 'Lesson resources',
    body: 'Official readings, slides, and the practice task sandbox are linked here once the instructor publishes them.',
  },
}

const NOTES_STORAGE_KEY = (slug: string) => `courser.notes:${slug}`

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

    return () => {
      active = false
    }
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
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : 'Could not enroll. Try again.')
    } finally {
      setEnrolling(false)
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
      <CourseDetailShell session={session} title="Loading course">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <i className="fa-solid fa-spinner mb-4 text-4xl text-primary" aria-hidden />
          <h1 className="text-2xl font-bold text-stone-900">Loading course...</h1>
        </div>
      </CourseDetailShell>
    )
  }

  if (error || !course) {
    return (
      <CourseDetailShell session={session} title="Course not found">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <i className="fa-solid fa-circle-exclamation mb-4 text-4xl text-red-500" aria-hidden />
          <h1 className="text-2xl font-bold text-stone-900">Course not found</h1>
          <p className="mt-2 text-stone-600">
            No course matches <span className="font-mono text-stone-800">{slug}</span>.
          </p>
          <Link
            to="/courses"
            className="mt-6 inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <i className="fa-solid fa-arrow-left mr-2 text-xs" aria-hidden />
            Back to courses
          </Link>
        </div>
      </CourseDetailShell>
    )
  }

  const admin = session?.role === 'admin' || session?.role === 'super_admin'
  const firstLesson = course.modules?.[0]?.lessons[0] ?? null
  const resourceUrl = firstLesson?.video_url ?? null
  const transcriptBody =
    firstLesson?.content?.trim() || TAB_CONTENT.Transcript.body

  const enrollLabel = session
    ? enrolled
      ? 'Enrolled'
      : enrolling
        ? 'Enrolling...'
        : 'Start course'
    : 'Enroll for free'

  return (
    <CourseDetailShell session={session} title={course.title}>
      <div className="border-b border-stone-200 bg-white">
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
                <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-stone-700">
                  <i className={categoryIcon(course)} aria-hidden />
                  {course.category?.name ?? 'General'}
                </span>
                <span className="rounded-full bg-stone-100 px-3 py-1 capitalize text-stone-700">
                  {course.level}
                </span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-green-700 ring-1 ring-green-200">
                  Free
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                {course.title}
              </h1>
              <p className="text-lg text-stone-600">
                {course.short_description ?? course.description ?? 'Course details are being prepared.'}
              </p>
              <p className="text-sm text-stone-500">
                <i className="fa-regular fa-clock mr-1" aria-hidden />
                {course.duration ?? 'Self-paced'}
              </p>
            </div>
            <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-stone-100 p-6 shadow-inner dark:border-stone-700 dark:bg-stone-800">
              <p className="text-sm font-semibold text-stone-900">{session ? 'Ready to learn' : 'Enroll'}</p>
              <p className="mt-2 text-sm text-stone-600">
                {session
                  ? 'Start this free course from your learning workspace.'
                  : 'Sign in as a student to continue enrollment.'}
              </p>
              <button
                type="button"
                onClick={handleEnroll}
                disabled={enrolling || enrolled}
                className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
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
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-stone-900">Modules & lessons</h2>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-primary dark:bg-stone-800">
              Live outline
            </span>
          </div>
          {course.modules?.length ? (
            <ol className="mt-6 space-y-4">
              {course.modules.map((module) => (
                <li key={module.id} className="rounded-xl border border-stone-100 p-4">
                  <p className="text-sm font-semibold text-stone-900">
                    Module {module.order}: {module.title}
                  </p>
                  <ul className="mt-2 space-y-2 text-sm text-stone-600">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id} className="rounded-lg border border-stone-200 bg-white p-3">
                        <div className="flex items-center gap-2 font-semibold text-stone-800">
                          <i className="fa-solid fa-circle-play text-primary" aria-hidden />
                          Lesson {module.order}.{lesson.order}: {lesson.title}
                        </div>
                        {lesson.content ? (
                          <p className="mt-2 leading-relaxed text-stone-600">{lesson.content}</p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-stone-500">
                          <span className="rounded-full bg-stone-100 px-2 py-1">
                            {lesson.duration ?? 'Self-paced'}
                          </span>
                          <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">Ready now</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-stone-600">No modules have been published for this course yet.</p>
          )}
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">Default learning environment</p>
                  <h2 className="mt-1 text-xl font-bold text-stone-900">Lesson workspace</h2>
                </div>
                {admin ? (
                  <Link
                    to="/admin"
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    <i className="fa-solid fa-sliders mr-2 text-primary" aria-hidden />
                    Configure
                  </Link>
                ) : null}
              </div>
              <div className="mt-5 overflow-hidden rounded-xl border border-stone-200">
                <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-3">
                  <span className="text-sm font-semibold text-stone-800">Current lesson</span>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-primary dark:bg-stone-800">
                    Focus mode
                  </span>
                </div>
                <div className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
                  <aside className="border-b border-stone-200 bg-stone-50 p-4 md:border-b-0 md:border-r">
                    <p className="text-xs font-semibold uppercase text-stone-500">Course path</p>
                    <div className="mt-3 space-y-2">
                      {['Start here', 'Watch lesson', 'Practice task'].map((item, index) => (
                        <div
                          key={item}
                          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                            index === 1 ? 'bg-primary text-white' : 'bg-white text-stone-700'
                          }`}
                        >
                          {index + 1}. {item}
                        </div>
                      ))}
                    </div>
                  </aside>
                  <div className="p-4">
                    <div className="flex aspect-video items-center justify-center rounded-xl bg-stone-900 text-white">
                      <i className="fa-solid fa-circle-play text-5xl text-accent" aria-hidden />
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
                              ? 'border-primary bg-primary text-white shadow-sm'
                              : 'border-stone-200 text-stone-700 hover:bg-stone-50',
                          ].join(' ')}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
                      {activeTab === 'Transcript' ? (
                        <p className="text-sm leading-relaxed text-stone-700">{transcriptBody}</p>
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
                            className="w-full rounded-lg border border-stone-200 bg-white p-3 text-sm text-stone-800 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                          />
                          <p className="mt-2 text-xs text-stone-500">Notes are saved in this browser only.</p>
                        </div>
                      ) : (
                        <div className="text-sm text-stone-700">
                          <p className="font-semibold text-stone-900">{TAB_CONTENT.Resources.label}</p>
                          <p className="mt-1">{TAB_CONTENT.Resources.body}</p>
                          {resourceUrl ? (
                            <a
                              href={resourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center text-sm font-semibold text-primary hover:underline"
                            >
                              <i className="fa-solid fa-up-right-from-square mr-2 text-xs" aria-hidden />
                              Open video resource
                            </a>
                          ) : (
                            <p className="mt-2 text-xs text-stone-500">No resources published yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="border-t border-stone-200 bg-stone-100 p-6 dark:border-stone-700 dark:bg-stone-800 lg:border-l lg:border-t-0">
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
                  <p className="font-bold text-stone-900">Cora answers questions</p>
                  <p className="text-sm text-stone-600">Available by default in every free course.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 rounded-xl bg-white p-4 shadow-sm">
                <div className="max-h-56 space-y-2 overflow-y-auto" aria-live="polite">
                  {chat.map((msg, idx) => (
                    <p
                      key={idx}
                      className={[
                        'rounded-lg p-3 text-sm',
                        msg.role === 'assistant'
                          ? 'bg-stone-100 text-stone-700'
                          : 'bg-primary/10 text-primary',
                      ].join(' ')}
                    >
                      {msg.text}
                    </p>
                  ))}
                  {asking ? (
                    <p className="rounded-lg bg-stone-100 p-3 text-sm text-stone-500">
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
                    className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={asking || !question.trim()}
                    className="rounded-lg bg-primary px-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
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
