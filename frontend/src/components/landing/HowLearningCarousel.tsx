// ─── HowLearningCarousel.tsx : "From sign-up to progress" ────────────────
// An auto-advancing carousel that walks visitors through the student
// onboarding and learning process. Each slide pairs an icon + short step
// title with a description; prev/next arrows, clickable dots, keyboard
// arrows, and a 7s auto-play (paused on hover) keep it easy to browse.
import { useCallback, useEffect, useRef, useState } from 'react'

const STEPS = [
  {
    title: 'Create your account',
    icon: 'fa-user-plus',
    accent: 'text-primary dark:text-primary-dark',
    blurb: 'Sign up in seconds and tell us your interests and learning goal. Your onboarding progress is saved, so you can pick up exactly where you left off.',
  },
  {
    title: 'Explore free paths',
    icon: 'fa-compass',
    accent: 'text-primary dark:text-primary-dark',
    blurb: 'Browse career tracks like Frontend, Data, and AI — every course is free, published, and structured into modules and lessons.',
  },
  {
    title: 'Enroll in a course',
    icon: 'fa-circle-check',
    accent: 'text-primary dark:text-primary-dark',
    blurb: 'One tap enrolls you. Your dashboard shows real progress, streaks, and the lessons that are ready to start today.',
  },
  {
    title: 'Learn in the workspace',
    icon: 'fa-book-open',
    accent: 'text-primary dark:text-primary-dark',
    blurb: 'Read structured study notes, follow one module at a time, and try live examples with the built-in code editor — no setup required.',
  },
  {
    title: 'Check what you learned',
    icon: 'fa-list-check',
    accent: 'text-primary dark:text-primary-dark',
    blurb: 'Finish each module with a short graded quiz. Pass it and the module is marked complete with your score saved.',
  },
  {
    title: 'Get help from Cora',
    icon: 'fa-robot',
    accent: 'text-primary dark:text-primary-dark',
    blurb: 'Cora, the AI tutor, answers questions about the exact lesson you are reading, with the study notes loaded as context.',
  },
  {
    title: 'Track progress & streak',
    icon: 'fa-fire',
    accent: 'text-primary dark:text-primary-dark',
    blurb: 'Lessons, modules, and courses tick forward automatically. Keep your streak alive and review what you completed whenever you like.',
  },
]

const AUTOPLAY_MS = 7000

/** Auto-advancing carousel describing the student learning journey. */
export function HowLearningCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef<number | null>(null)

  const go = useCallback((next: number) => {
    setIndex(((next % STEPS.length) + STEPS.length) % STEPS.length)
  }, [])

  // Auto-advance unless the user is hovering or has reduced-motion on.
  useEffect(() => {
    if (paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    timer.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % STEPS.length)
    }, AUTOPLAY_MS)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [paused])

  const step = STEPS[index]

  return (
    <section
      aria-label="How students learn with COURSER"
      className="courser-bg-dots border-t border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950/50"
    >
      <div className="mx-auto max-w-6xl px-2 py-14 sm:px-3 lg:px-4">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-stone-800 dark:text-stone-200">
            The learning journey
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            From sign-up to progress, step by step
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-stone-600 dark:text-stone-300">
            Onboarding and learning in one smooth flow — here is how a student moves from a
            fresh account to a completed, quiz-checked course.
          </p>
        </div>

        <div
          className="relative mt-10"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="courser-card mx-auto max-w-3xl p-6 sm:p-8">
            <div className="flex min-h-[220px] flex-col justify-between gap-6 sm:min-h-[190px]">
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-2xl ring-1 ring-stone-200 dark:bg-stone-800 dark:ring-stone-700">
                  <i className={`fa-solid ${step.icon} ${step.accent}`} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                    Step {index + 1} of {STEPS.length}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-100">{step.title}</h3>
                </div>
              </div>
              <p className="text-base leading-relaxed text-stone-600 dark:text-stone-300">{step.blurb}</p>
            </div>

            {/* Prev / next controls */}
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => go(index - 1)}
                aria-label="Previous step"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-700 transition hover:bg-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
              >
                <i className="fa-solid fa-arrow-left" aria-hidden="true" />
              </button>

              <div className="flex items-center gap-2" role="tablist" aria-label="Learning steps">
                {STEPS.map((s, i) => (
                  <button
                    key={s.title}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Step ${i + 1}: ${s.title}`}
                    onClick={() => go(i)}
                    className={`h-2.5 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                      i === index ? 'w-7 bg-accent dark:bg-accent-dark' : 'w-2.5 bg-stone-300 hover:bg-stone-400 dark:bg-stone-600 dark:hover:bg-stone-500'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => go(index + 1)}
                aria-label="Next step"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-700 transition hover:bg-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
              >
                <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}