import { Hero } from '@/components/landing/Hero'
import { PublicShell } from '@/components/layout/PublicShell'
import { Link } from 'react-router-dom'

const stats = [
  { label: 'Free courses prepared', value: '12', detail: 'Web, data, AI, mobile, DevOps' },
  { label: 'Guided lessons', value: '86', detail: 'Structured for start-today learning' },
  { label: 'Mascot help', value: '24/7', detail: 'Cora is built into the learning workspace' },
]

// Reduced palette — only blue and orange for category icons.
const tracks = [
  { title: 'Frontend Developer', icon: 'fa-code', lessons: '18 lessons', color: 'bg-blue-50 text-primary dark:bg-blue-950/40 dark:text-primary-dark' },
  { title: 'Data Analyst', icon: 'fa-chart-simple', lessons: '16 lessons', color: 'bg-orange-50 text-accent dark:bg-orange-950/40 dark:text-accent-dark' },
  { title: 'AI Course Builder', icon: 'fa-brain', lessons: '14 lessons', color: 'bg-blue-50 text-primary dark:bg-blue-950/40 dark:text-primary-dark' },
]

export function LandingPage() {
  return (
    <PublicShell>
      <Hero />

      <section className="courser-bg-dots border-y border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950/50">
        <div className="mx-auto grid max-w-6xl gap-4 px-2 py-6 sm:grid-cols-2 sm:px-3 lg:grid-cols-3 lg:px-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="courser-card p-4"
            >
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{item.value}</p>
              <p className="mt-1 text-sm font-semibold text-stone-800 dark:text-stone-100">{item.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-500 dark:text-stone-400">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="courser-bg-dots-dense">
        <div className="mx-auto max-w-6xl px-2 py-8 sm:px-3 lg:px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-accent dark:text-accent-dark">Start learning now</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Career paths built inside COURSER</h2>
              <p className="mt-3 max-w-2xl text-stone-600 dark:text-stone-300">
                Begin with free, guided courses, follow structured lessons, and keep Cora on hand whenever you need a nudge.
              </p>
            </div>
            <Link
              to="/courses"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 dark:bg-primary-dark"
            >
              Browse free courses
              <i className="fa-solid fa-arrow-right ml-2 text-xs" aria-hidden />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {tracks.map((track) => (
              <article
                key={track.title}
                className="courser-card p-5"
              >
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${track.color}`}>
                  <i className={`fa-solid ${track.icon}`} aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-stone-900 dark:text-stone-100">{track.title}</h3>
                <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{track.lessons} with projects, notes, progress checkpoints, and Cora support.</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                  <div className="h-full w-3/4 rounded-full bg-accent dark:bg-accent-dark" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  )
}