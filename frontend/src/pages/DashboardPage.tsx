import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { navItemsFor } from '@/components/layout/navItems'
import { logout } from '@/api/auth'
import { clearSession, getSession } from '@/auth/session'
import { Link } from 'react-router-dom'

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
  const session = getSession()
  const displayName = session?.identifier || 'there'

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
              className="inline-flex items-center rounded-lg bg-gradient-to-br from-primary to-primary/80 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
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

        <section className="grid gap-4 md:grid-cols-3">
          {learningStats.map((item) => (
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
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {activeCourses.map((course) => (
              <article key={course.title} className="rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/60">
                <p className="font-bold leading-snug text-stone-900 dark:text-stone-50">{course.title}</p>
                <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">Next: {course.next}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-700">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${course.progress}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400">
                  <span>{course.progress}% complete</span>
                  <Link to="/courses" className="text-primary hover:underline">Open</Link>
                </div>
              </article>
            ))}
          </div>
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
