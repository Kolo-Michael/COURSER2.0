// ─── StreakPage: daily learning streak (students) ──────────────────────────
// Fetches the user's streak stats and renders the current count, a static
// week grid, milestone unlock cards, and streak details (longest streak,
// learned-today flag, restores left) including the one-tap "restore a missed
// day" action. Protected at the router level to /streak>.

import { getSession } from '@/auth/session'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { studentNav } from '@/components/layout/navItems'
import { getStreak, restoreStreakDay, type ApiStreak } from '@/api/streak'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

// Static Mon-Sun labels for the week grid (today isn't highlighted yet).
const WEEK = [
  { day: 'Mon' },
  { day: 'Tue' },
  { day: 'Wed' },
  { day: 'Thu' },
  { day: 'Fri' },
  { day: 'Sat' },
  { day: 'Sun' },
]

// Milestone thresholds + their rewards; "reached" is derived from the streak.
const MILESTONES = [
  { days: 3, reward: 'Badge: First Spark' },
  { days: 7, reward: '1 free Cora session' },
  { days: 30, reward: 'Certificate boost' },
]

export function StreakPage() {
  const session = getSession()
  const displayName = session?.identifier || 'Learner'

  const [streak, setStreak] = useState<ApiStreak | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)

  // Fetch streak data; reused by the error-retry button.
  async function load() {
    setLoading(true)
    setError(null)
    try {
      setStreak(await getStreak())
    } catch {
      setError('Could not load your streak right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Restore the last missed day. Only offered when the API says
  // restore_eligible (monthly restore budget) and not already running.
  async function handleRestore() {
    if (!streak?.restore_eligible || restoring) return
    setRestoring(true)
    try {
      setStreak(await restoreStreakDay())
    } catch {
      setError('Could not restore your streak.')
    } finally {
      setRestoring(false)
    }
  }

  const currentStreak = streak?.current_streak ?? 0

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
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent shadow-lg shadow-accent/30">
                <i className="fa-solid fa-fire text-4xl text-white" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-accent">Current streak</p>
                <p className="mt-1 text-5xl font-bold text-stone-900 dark:text-stone-50">
                  {loading ? '—' : currentStreak}{' '}
                  <span className="text-xl font-semibold text-stone-500 dark:text-stone-400">
                    {currentStreak === 1 ? 'day' : 'days'}
                  </span>
                </p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                  {loading
                    ? 'Loading your streak…'
                    : error
                      ? error
                      : `Learning every day for ${displayName}. Keep it going!`}
                </p>
              </div>
            </div>
            <Link
              to="/courses"
              className="inline-flex items-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <i className="fa-solid fa-play mr-2" aria-hidden />
              Learn today
            </Link>
          </div>
        </section>

        {loading ? (
          <div className="courser-card flex items-center justify-center gap-3 p-10 text-stone-600 dark:text-stone-300">
            <i className="fa-solid fa-spinner text-primary" aria-hidden />
            Loading your streak...
          </div>
        ) : error && !streak ? (
          <div className="courser-card p-10 text-center">
            <p className="font-semibold text-red-600 dark:text-red-300">{error}</p>
            <button type="button" onClick={load} className="mt-3 rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold">
              Try again
            </button>
          </div>
        ) : (
          <>
            <section className="courser-card p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">This week</h3>
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  {streak?.days_this_month ?? 0} days learned this month
                </span>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-7">
                {WEEK.map((item) => (
                  <div
                    key={item.day}
                    className="flex flex-col items-center gap-2 rounded-xl border border-stone-200 p-3 text-stone-400 dark:border-stone-700 dark:text-stone-500"
                  >
                    <span className="text-xs font-semibold uppercase">{item.day}</span>
                    <i className="fa-regular fa-circle text-2xl" aria-hidden />
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="courser-card p-6">
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">Milestones</h3>
                <div className="mt-4 flex flex-col gap-3">
                  {MILESTONES.map((item) => {
                    const reached = currentStreak >= item.days
                    return (
                      <div
                        key={item.days}
                        className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/60"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={[
                              'flex h-10 w-10 items-center justify-center rounded-lg',
                              reached ? 'bg-accent/15 text-accent' : 'bg-stone-100 text-stone-400 dark:bg-stone-800',
                            ].join(' ')}
                          >
                            <i className="fa-solid fa-medal" aria-hidden />
                          </span>
                          <div>
                            <p className="font-bold text-stone-900 dark:text-stone-50">{item.days}-day streak</p>
                            <p className="text-sm text-stone-600 dark:text-stone-300">{item.reward}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-stone-400 dark:text-stone-500">
                          {reached ? 'Reached' : `${item.days - currentStreak} to go`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="courser-card p-6">
                <p className="text-sm font-semibold text-primary">Streak stats</p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-stone-600 dark:text-stone-300">Longest streak</dt>
                    <dd className="font-bold text-stone-900 dark:text-stone-50">{streak?.longest_streak ?? 0} days</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-stone-600 dark:text-stone-300">Learned today</dt>
                    <dd className="font-bold text-stone-900 dark:text-stone-50">{streak?.learned_today ? 'Yes' : 'Not yet'}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-stone-600 dark:text-stone-300">Restores left this month</dt>
                    <dd className="font-bold text-stone-900 dark:text-stone-50">{streak?.restores_available ?? 0}</dd>
                  </div>
                </dl>
                {streak?.restore_eligible ? (
                  <button
                    type="button"
                    onClick={handleRestore}
                    disabled={restoring}
                    className="mt-4 w-full rounded-lg border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/15 disabled:opacity-60"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles mr-2" aria-hidden />
                    {restoring ? 'Restoring…' : 'Restore last missed day'}
                  </button>
                ) : (
                  <p className="mt-4 text-xs text-stone-500 dark:text-stone-400">
                    Keep learning daily to build your streak — restores refill each month.
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
