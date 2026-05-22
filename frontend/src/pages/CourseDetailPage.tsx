import { getCourseBySlug, type ApiCourse } from '@/api/courses'
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
    { to: roleDashboards[session.role], label: session.role === 'super_admin' ? 'Owner overview' : 'Admin workspace', iconClass: 'fa-solid fa-gauge-high' },
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
      <DashboardLayout
        title={title}
        subtitle="Course workspace"
        navItems={detailNav(session)}
      >
        {children}
      </DashboardLayout>
    )
  }

  return <PublicShell>{children}</PublicShell>
}

export function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [session] = useState(() => getSession())

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

  if (loading) {
    return (
      <CourseDetailShell session={session} title="Loading course">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <i className="fa-solid fa-spinner mb-4 text-4xl text-primary" aria-hidden />
          <h1 className="text-2xl font-bold text-slate-900">Loading course...</h1>
        </div>
      </CourseDetailShell>
    )
  }

  if (error || !course) {
    return (
      <CourseDetailShell session={session} title="Course not found">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <i className="fa-solid fa-circle-exclamation mb-4 text-4xl text-red-500" aria-hidden />
          <h1 className="text-2xl font-bold text-slate-900">Course not found</h1>
          <p className="mt-2 text-slate-600">
            No course matches <span className="font-mono text-slate-800">{slug}</span>.
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

  return (
    <CourseDetailShell session={session} title={course.title}>
      <div className="border-b border-slate-200 bg-white">
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
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  <i className={categoryIcon(course)} aria-hidden />
                  {course.category?.name ?? 'General'}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 capitalize text-slate-700">
                  {course.level}
                </span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-green-700 ring-1 ring-green-200">
                  Free
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {course.title}
              </h1>
              <p className="text-lg text-slate-600">
                {course.short_description ?? course.description ?? 'Course details are being prepared.'}
              </p>
              <p className="text-sm text-slate-500">
                <i className="fa-regular fa-clock mr-1" aria-hidden />
                {course.duration ?? 'Self-paced'}
              </p>
            </div>
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-gray-50 p-6 shadow-inner">
              <p className="text-sm font-semibold text-slate-900">{session ? 'Ready to learn' : 'Enroll'}</p>
              <p className="mt-2 text-sm text-slate-600">
                {session ? 'Start this free course from your learning workspace.' : 'Sign in as a student to continue enrollment.'}
              </p>
              <button
                type="button"
                className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
              >
                {session ? 'Start course' : 'Enroll for free'}
              </button>
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
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Modules & lessons</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
              Live outline
            </span>
          </div>
          {course.modules?.length ? (
            <ol className="mt-6 space-y-4">
              {course.modules.map((module) => (
                <li key={module.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Module {module.order}: {module.title}
                  </p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex items-center gap-2 font-semibold text-slate-800">
                          <i className="fa-solid fa-circle-play text-primary" aria-hidden />
                          Lesson {module.order}.{lesson.order}: {lesson.title}
                        </div>
                        {lesson.content ? (
                          <p className="mt-2 leading-relaxed text-slate-600">{lesson.content}</p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2 py-1">{lesson.duration ?? 'Self-paced'}</span>
                          <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">Ready now</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-slate-600">No modules have been published for this course yet.</p>
          )}
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">Default learning environment</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">Lesson workspace</h2>
                </div>
                {admin ? (
                  <Link
                    to="/admin"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <i className="fa-solid fa-sliders mr-2 text-primary" aria-hidden />
                    Configure
                  </Link>
                ) : null}
              </div>
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-800">Current lesson</span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
                    Focus mode
                  </span>
                </div>
                <div className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
                  <aside className="border-b border-slate-200 bg-slate-50 p-4 md:border-b-0 md:border-r">
                    <p className="text-xs font-semibold uppercase text-slate-500">Course path</p>
                    <div className="mt-3 space-y-2">
                      {['Start here', 'Watch lesson', 'Practice task'].map((item, index) => (
                        <div
                          key={item}
                          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                            index === 1 ? 'bg-primary text-white' : 'bg-white text-slate-700'
                          }`}
                        >
                          {index + 1}. {item}
                        </div>
                      ))}
                    </div>
                  </aside>
                  <div className="p-4">
                    <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-900 text-white">
                      <i className="fa-solid fa-circle-play text-5xl text-accent" aria-hidden />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {['Transcript', 'Notes', 'Resources'].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="border-t border-slate-200 bg-blue-50 p-6 lg:border-l lg:border-t-0">
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
                  <p className="font-bold text-slate-900">Cora answers questions</p>
                  <p className="text-sm text-slate-600">Available by default in every free course.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 rounded-xl bg-white p-4 shadow-sm">
                <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
                  Ask me about this lesson, confusing terms, or what to do next.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask Cora a question..."
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                  <button type="button" className="rounded-lg bg-primary px-3 text-sm font-semibold text-white">
                    <i className="fa-solid fa-paper-plane" aria-hidden />
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </CourseDetailShell>
  )
}
