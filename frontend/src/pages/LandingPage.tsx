import { Hero } from '@/components/landing/Hero'
import { PublicShell } from '@/components/layout/PublicShell'
import { Link } from 'react-router-dom'

const stats = [
  { label: 'Free courses prepared', value: '12', detail: 'Web, data, AI, mobile, DevOps' },
  { label: 'Guided lessons', value: '86', detail: 'Structured for start-today learning' },
  { label: 'Mascot help', value: '24/7', detail: 'Cora is built into the learning workspace' },
  { label: 'Admin controls', value: '3', detail: 'Cover, layout, and mascot setup' },
]

const tracks = [
  { title: 'Frontend Developer', icon: 'fa-code', lessons: '18 lessons', color: 'bg-blue-50 text-primary' },
  { title: 'Data Analyst', icon: 'fa-chart-simple', lessons: '16 lessons', color: 'bg-emerald-50 text-emerald-700' },
  { title: 'AI Course Builder', icon: 'fa-brain', lessons: '14 lessons', color: 'bg-orange-50 text-accent' },
]

export function LandingPage() {
  return (
    <PublicShell>
      <Hero />

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 p-4">
              <p className="text-2xl font-bold text-slate-900">{item.value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{item.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Start learning now</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Career paths built inside COURSER</h2>
              <p className="mt-3 max-w-2xl text-slate-600">
                Students can begin with free, guided courses. Admins can tune the learning environment while Cora stays available for questions.
              </p>
            </div>
            <Link
              to="/courses"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              Browse free courses
              <i className="fa-solid fa-arrow-right ml-2 text-xs" aria-hidden />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {tracks.map((track) => (
              <article key={track.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${track.color}`}>
                  <i className={`fa-solid ${track.icon}`} aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{track.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{track.lessons} with projects, notes, progress checkpoints, and Cora support.</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-3/4 rounded-full bg-accent" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
