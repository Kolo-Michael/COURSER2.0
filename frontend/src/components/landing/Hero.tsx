// ─── Hero.tsx : landing-page hero section ───────────────────────────────
// Top banner of the marketing landing page: headline, CTA buttons
// (Get started / Explore courses), a three-point feature strip, and a
// frosted "spotlight" card teasing the flagship course.
import { Link } from 'react-router-dom'

/** Landing hero: pitch + CTAs + feature list + spotlight course card. */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="courser-bg-dots relative border-b border-stone-200 bg-white/60 dark:border-stone-800 dark:bg-stone-950/60"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-primary/5 dark:bg-primary-dark/5"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-2 pb-12 pt-10 sm:px-3 lg:flex-row lg:items-center lg:gap-14 lg:px-4 lg:pb-16 lg:pt-14">
        <div className="flex-1">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-1.5 text-sm font-medium text-stone-800 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-100 dark:ring-stone-700">
            <i className="fa-solid fa-rocket text-accent dark:text-accent-dark" aria-hidden="true" />
            AI-powered courses, built for real progress
          </p>

          <h1
            id="hero-heading"
            className="text-balance font-bold tracking-tight text-stone-900 dark:text-stone-100"
          >
            <span className="block text-4xl sm:text-5xl lg:text-6xl">
              Learn smarter with
            </span>
            <span className="mt-2 block text-4xl sm:text-5xl lg:text-6xl">
              <span className="text-accent dark:text-accent-dark">COURSER:</span>{' '}
              <span className="font-normal text-stone-700 dark:text-stone-300">your intelligent campus</span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600 sm:text-xl dark:text-stone-300">
            Browse curated paths, enroll in seconds, and follow lessons shaped by AI without
            losing the clarity of a world-class LMS.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:bg-accent-dark"
            >
              Get started free
              <i className="fa-solid fa-arrow-right text-sm opacity-90" aria-hidden="true" />
            </Link>
            <Link
              to="/courses"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3.5 text-base font-semibold text-stone-800 ring-1 ring-stone-200 transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:bg-stone-900 dark:text-stone-100 dark:ring-stone-700 dark:hover:bg-stone-800"
            >
              Explore courses
            </Link>
          </div>

          <dl className="mt-10 grid gap-8 sm:grid-cols-3">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/20 dark:bg-accent-dark/15 dark:text-accent-dark dark:ring-accent-dark/30">
                <i className="fa-solid fa-graduation-cap text-lg" aria-hidden="true" />
              </div>
              <div>
                <dt className="font-semibold text-stone-900 dark:text-stone-100">Expert-style structure</dt>
                <dd className="mt-1 text-sm text-stone-600 dark:text-stone-300">Modules and lessons designed for clarity</dd>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20 dark:bg-primary-dark/15 dark:text-primary-dark dark:ring-primary-dark/30">
                <i className="fa-solid fa-book-open text-lg" aria-hidden="true" />
              </div>
              <div>
                <dt className="font-semibold text-stone-900 dark:text-stone-100">Learn at your pace</dt>
                <dd className="mt-1 text-sm text-stone-600 dark:text-stone-300">Resume anytime, anywhere</dd>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20 dark:bg-primary-dark/15 dark:text-primary-dark dark:ring-primary-dark/30">
                <i className="fa-solid fa-compass text-lg" aria-hidden="true" />
              </div>
              <div>
                <dt className="font-semibold text-stone-900 dark:text-stone-100">Stay on track</dt>
                <dd className="mt-1 text-sm text-stone-600 dark:text-stone-300">Built-in checkpoints and notes</dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="flex-1">
          <div className="relative mx-auto max-w-lg rounded-2xl border border-stone-200/70 bg-white/70 p-8 shadow-md backdrop-blur-md dark:border-stone-700/60 dark:bg-stone-900/70 lg:max-w-none">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-accent dark:text-accent-dark">
                  Spotlight
                </p>
                <h2 className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-100">AI Tutor Foundations</h2>
              </div>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent ring-1 ring-accent/25 dark:bg-accent-dark/15 dark:text-accent-dark dark:ring-accent-dark/30">
                New
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              A polished intro path covering LLM basics, responsible use, and how to apply models
              in learning products, matching the Modules & Lessons structure your teams expect.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-stone-700 dark:text-stone-200">
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
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 dark:bg-primary dark:hover:bg-primary/90"
              >
                Preview catalog
              </Link>
              <Link
                to="/auth"
                className="inline-flex flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-stone-900 ring-2 ring-stone-300 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 dark:text-stone-100 dark:ring-white/20 dark:hover:bg-stone-800"
              >
                Create account
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-stone-500 dark:text-stone-400 sm:text-left">
            Trusted by teams who want a Coursera-grade experience with modern automation.
          </p>
        </div>
      </div>
    </section>
  )
}