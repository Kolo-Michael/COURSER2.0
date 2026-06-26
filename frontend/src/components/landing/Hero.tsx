import { Link } from 'react-router-dom'

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-white/70 backdrop-blur-sm dark:bg-slate-950/70"
    >
      {/* Soft warm gradient overlay — only blue + orange tones */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, rgb(249 115 22 / 0.18), transparent 50%), radial-gradient(circle at 85% 10%, rgb(37 99 235 / 0.14), transparent 45%), radial-gradient(circle at 50% 100%, rgb(249 115 22 / 0.10), transparent 55%)',
        }}
      />

      {/* Decorative animated shapes — blue + orange only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-accent/30 blur-3xl animate-blob dark:bg-accent-dark/30"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -right-20 h-80 w-80 rounded-full bg-primary/25 blur-3xl animate-blob animation-delay-2000 dark:bg-primary-dark/30"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob animation-delay-4000 dark:bg-primary-dark/25"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20 pt-16 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="flex-1">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-4 py-1.5 text-sm font-medium text-slate-800 ring-1 ring-slate-900/10 backdrop-blur dark:bg-white/10 dark:text-slate-100 dark:ring-white/15">
            <i className="fa-solid fa-rocket text-accent dark:text-accent-dark" aria-hidden="true" />
            AI-powered courses, built for real progress
          </p>

          <h1
            id="hero-heading"
            className="text-balance font-bold tracking-tight text-slate-900 dark:text-white"
          >
            <span className="block text-4xl sm:text-5xl lg:text-6xl">
              Learn smarter with
            </span>
            <span className="mt-2 block text-4xl sm:text-5xl lg:text-6xl">
              <span className="text-accent dark:text-accent-dark">COURSER:</span>{' '}
              <span className="font-normal text-slate-700 dark:text-slate-200">your intelligent campus</span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl dark:text-slate-300">
            Browse curated paths, enroll in seconds, and follow lessons shaped by AI without
            losing the clarity of a world-class LMS.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-900/25 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:bg-accent-dark dark:shadow-orange-950/40"
            >
              Get started free
              <i className="fa-solid fa-arrow-right text-sm opacity-90" aria-hidden="true" />
            </Link>
            <Link
              to="/courses"
              className="inline-flex items-center justify-center rounded-lg bg-white/70 px-6 py-3.5 text-base font-semibold text-slate-800 ring-1 ring-slate-200 backdrop-blur transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:bg-slate-900/70 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-900"
            >
              Explore courses
            </Link>
          </div>

          <dl className="mt-14 grid gap-8 sm:grid-cols-3">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/20 dark:bg-accent-dark/15 dark:text-accent-dark dark:ring-accent-dark/30">
                <i className="fa-solid fa-graduation-cap text-lg" aria-hidden="true" />
              </div>
              <div>
                <dt className="font-semibold text-slate-900 dark:text-white">Expert-style structure</dt>
                <dd className="mt-1 text-sm text-slate-600 dark:text-slate-300">Modules and lessons designed for clarity</dd>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20 dark:bg-primary-dark/15 dark:text-primary-dark dark:ring-primary-dark/30">
                <i className="fa-solid fa-book-open text-lg" aria-hidden="true" />
              </div>
              <div>
                <dt className="font-semibold text-slate-900 dark:text-white">Learn at your pace</dt>
                <dd className="mt-1 text-sm text-slate-600 dark:text-slate-300">Resume anytime, anywhere</dd>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20 dark:bg-primary-dark/15 dark:text-primary-dark dark:ring-primary-dark/30">
                <i className="fa-solid fa-compass text-lg" aria-hidden="true" />
              </div>
              <div>
                <dt className="font-semibold text-slate-900 dark:text-white">Stay on track</dt>
                <dd className="mt-1 text-sm text-slate-600 dark:text-slate-300">Built-in checkpoints and notes</dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="flex-1">
          <div className="relative mx-auto max-w-lg rounded-2xl bg-white/85 p-8 shadow-2xl ring-1 ring-slate-200/70 backdrop-blur dark:bg-slate-900/85 dark:ring-slate-700/70 lg:max-w-none">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-accent dark:text-accent-dark">
                  Spotlight
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">AI Tutor Foundations</h2>
              </div>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent ring-1 ring-accent/25 dark:bg-accent-dark/15 dark:text-accent-dark dark:ring-accent-dark/30">
                New
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              A polished intro path covering LLM basics, responsible use, and how to apply models
              in learning products, matching the Modules & Lessons structure your teams expect.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700 dark:text-slate-200">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
                Module 1: Foundations & prompting playbooks
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary dark:bg-primary-dark" aria-hidden />
                Module 2: Evaluation guardrails & safety habits
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
                Capstone lesson: Ship a tutoring micro-feature
              </li>
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/courses"
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-primary dark:hover:bg-primary/90"
              >
                Preview catalog
              </Link>
              <Link
                to="/auth"
                className="inline-flex flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-900 ring-2 ring-slate-900/15 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:text-slate-100 dark:ring-white/20 dark:hover:bg-slate-800"
              >
                Create account
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 sm:text-left">
            Trusted by teams who want a Coursera-grade experience with modern automation.
          </p>
        </div>
      </div>
    </section>
  )
}