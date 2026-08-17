// ─── Hero.tsx : landing-page hero section ───────────────────────────────
// Top banner of the marketing landing page: headline, CTA buttons
// (Get started / Explore courses), a three-point feature strip, and a
// 3D floating card stack (course · certificate · Cora chat) on the right.
import { Link } from 'react-router-dom'
import { ThreeDVisual } from './ThreeDVisual'
import { TypedPhrases } from './TypedPhrases'

// The hero sub-copy, split into three clauses so the typewriter reveals it
// one phrase after the other.
const heroPhrases = [
  'Browse curated paths,',
  'enroll in seconds, and follow lessons shaped by AI',
  'without losing the clarity of a world-class LMS.',
]

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
            <i className="fa-solid fa-rocket text-accent-fg dark:text-accent-dark" aria-hidden="true" />
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
              <span className="text-accent-fg dark:text-accent-dark">COURSER:</span>{' '}
              <span className="font-normal text-stone-700 dark:text-stone-300">your intelligent campus</span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600 sm:text-xl dark:text-stone-300">
            <TypedPhrases phrases={heroPhrases} />
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-btn px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-accent-dark"
            >
              Get started free
              <i className="fa-solid fa-arrow-right text-sm opacity-90" aria-hidden="true" />
            </Link>
            <Link
              to="/courses"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3.5 text-base font-semibold text-stone-800 ring-1 ring-stone-200 transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-stone-900 dark:text-stone-100 dark:ring-stone-700 dark:hover:bg-stone-800"
            >
              Explore courses
            </Link>
          </div>

          <dl className="mt-10 grid gap-8 sm:grid-cols-3">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20 dark:bg-primary-dark/15 dark:text-primary-dark dark:ring-primary-dark/30">
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
          <ThreeDVisual />

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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

          <p className="mt-6 text-center text-xs text-stone-500 dark:text-stone-400 sm:text-left">
            Every course is free, structured, and ready to start today.
          </p>
        </div>
      </div>
    </section>
  )
}