import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { clearSession, getSession } from '@/auth/session'
import { Link } from 'react-router-dom'

const studentNav = [
  { to: '/dashboard', label: 'Overview', iconClass: 'fa-solid fa-gauge' },
  { to: '/courses', label: 'Browse courses', iconClass: 'fa-solid fa-book-open' },
]

const learningStats = [
  { label: 'Free courses', value: '12', icon: 'fa-layer-group' },
  { label: 'Hours available', value: '64', icon: 'fa-clock' },
  { label: 'Cora answers', value: '24/7', icon: 'fa-comments' },
]

const activeCourses = [
  { title: 'Frontend Foundations with React', progress: 42, next: 'Build a responsive course card' },
  { title: 'Python Data Analysis Starter', progress: 18, next: 'Clean a student progress dataset' },
  { title: 'AI Prompting for Course Creators', progress: 8, next: 'Draft a lesson quiz with Cora' },
]

export function DashboardPage() {
  const displayName = getSession()?.identifier || 'there'

  return (
    <DashboardLayout
      title="Student dashboard"
      subtitle="Your hub for enrollments and progress"
      navItems={studentNav}
    >
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-primary">Welcome</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Hi, {displayName}</h2>
          <p className="mt-2 max-w-3xl text-slate-600">
            Pick up where you left off, follow a weekly plan, and use Cora inside every lesson when you need a clearer explanation.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/courses"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              <i className="fa-solid fa-compass mr-2" aria-hidden />
              Browse courses
            </Link>
            <Link
              to="/"
              className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              <i className="fa-solid fa-house mr-2 text-primary" aria-hidden />
              Home
            </Link>
            <Link
              to="/auth"
              onClick={clearSession}
              className="inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <i className="fa-solid fa-right-from-bracket mr-2" aria-hidden />
              Log out
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {learningStats.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-600">{item.label}</p>
                <i className={`fa-solid ${item.icon} text-primary`} aria-hidden />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900">Continue learning</h3>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Live-ready
            </span>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {activeCourses.map((course) => (
              <article key={course.title} className="rounded-lg border border-slate-200 p-4">
                <p className="font-bold leading-snug text-slate-900">{course.title}</p>
                <p className="mt-2 text-sm text-slate-600">Next: {course.next}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${course.progress}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>{course.progress}% complete</span>
                  <Link to="/courses" className="text-primary hover:underline">Open</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Weekly plan</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {['Watch', 'Practice', 'Review'].map((step, index) => (
                <div key={step} className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Step {index + 1}</p>
                  <p className="mt-1 font-bold text-slate-900">{step}</p>
                  <p className="mt-2 text-sm text-slate-600">{index === 0 ? 'Finish one lesson' : index === 1 ? 'Submit one task' : 'Ask Cora 2 questions'}</p>
                </div>
              ))}
            </div>
          </div>
          <aside className="rounded-lg border border-blue-100 bg-blue-50 p-6 shadow-sm">
            <p className="text-sm font-semibold text-primary">Cora study help</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Ask for simpler explanations, examples, quizzes, and next steps inside any lesson workspace.
            </p>
          </aside>
        </section>
      </div>
    </DashboardLayout>
  )
}
