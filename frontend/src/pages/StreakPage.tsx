import { getSession } from '@/auth/session'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { studentNav } from '@/components/layout/navItems'
import { Link } from 'react-router-dom'

const WEEK = [
  { day: 'Mon', done: true },
  { day: 'Tue', done: true },
  { day: 'Wed', done: true },
  { day: 'Thu', done: true },
  { day: 'Fri', done: true },
  { day: 'Sat', done: false },
  { day: 'Sun', done: false },
]

const MILESTONES = [
  { days: 3, reward: 'Badge: First Spark' },
  { days: 7, reward: '1 free Cora session' },
  { days: 30, reward: 'Certificate boost' },
]

export function StreakPage() {
  const session = getSession()
  const displayName = session?.identifier || 'Learner'

  return (
    <DashboardLayout
      title="Learning streak"
      subtitle="Keep the flame alive — learn every day"
      navItems={studentNav()}
    >
      <div className="space-y-6">
        <section className="courser-card overflow-hidden p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 shadow-lg shadow-orange-500/30">
                <i className="fa-solid fa-fire text-4xl text-white" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-accent">Current streak</p>
                <p className="mt-1 text-5xl font-bold text-stone-900 dark:text-stone-50">
                  5 <span className="text-xl font-semibold text-stone-500 dark:text-stone-400">days</span>
                </p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                  Learning every day for {displayName}. Keep it going!
                </p>
              </div>
            </div>
            <Link
              to="/courses"
              className="inline-flex items-center rounded-lg bg-gradient-to-br from-accent to-accent/80 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <i className="fa-solid fa-play mr-2" aria-hidden />
              Learn today
            </Link>
          </div>
        </section>

        <section className="courser-card p-6">
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">This week</h3>
          <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-7">
            {WEEK.map((item) => (
              <div
                key={item.day}
                className={[
                  'flex flex-col items-center gap-2 rounded-xl border p-3',
                  item.done
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-stone-200 text-stone-400 dark:border-stone-700 dark:text-stone-500',
                ].join(' ')}
              >
                <span className="text-xs font-semibold uppercase">{item.day}</span>
                <i
                  className={`${item.done ? 'fa-solid fa-fire' : 'fa-regular fa-circle'} text-2xl`}
                  aria-hidden
                />
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="courser-card p-6">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">Milestones</h3>
            <div className="mt-4 flex flex-col gap-3">
              {MILESTONES.map((item) => (
                <div
                  key={item.days}
                  className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                      <i className="fa-solid fa-medal" aria-hidden />
                    </span>
                    <div>
                      <p className="font-bold text-stone-900 dark:text-stone-50">{item.days}-day streak</p>
                      <p className="text-sm text-stone-600 dark:text-stone-300">{item.reward}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-stone-400 dark:text-stone-500">
                    {item.days <= 5 ? 'Reached' : `${item.days - 5} to go`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <aside className="courser-card p-6">
            <p className="text-sm font-semibold text-primary">How streaks work</p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              <li className="flex gap-3">
                <i className="fa-solid fa-fire mt-0.5 text-accent" aria-hidden />
                <span>Complete at least one lesson each day to keep the flame burning.</span>
              </li>
              <li className="flex gap-3">
                <i className="fa-solid fa-clock mt-0.5 text-primary" aria-hidden />
                <span>Streaks are tracked on your local timezone, resetting at midnight.</span>
              </li>
              <li className="flex gap-3">
                <i className="fa-solid fa-shield-halved mt-0.5 text-emerald-600" aria-hidden />
                <span>Life comes up — that is what streak freezes are for. Coming soon.</span>
              </li>
            </ul>
          </aside>
        </section>
      </div>
    </DashboardLayout>
  )
}
