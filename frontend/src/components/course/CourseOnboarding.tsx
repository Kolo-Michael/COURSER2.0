// ─── CourseOnboarding: pre-enrollment survey modal ───────────────────────────
// Shown when a signed-in learner clicks "Start course" on a course they are
// not yet enrolled in. Asks two quick questions — their skill level
// (beginner / intermediate / expert) and a free-text learning goal — then
// passes the answers along to the enroll API so the course experience can be
// tailored to the learner. The modal is dismissible (skipping defaults to
// "beginner" + no goal).

import type { CourseOnboardingPayload } from '@/api/courses'
import { useEffect, useState } from 'react'

// Skill level choices shown as selectable cards.
const LEVELS: { value: 'beginner' | 'intermediate' | 'expert'; label: string; hint: string; icon: string }[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    hint: 'New to the topic',
    icon: 'fa-sprout',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    hint: 'Some experience',
    icon: 'fa-layer-group',
  },
  {
    value: 'expert',
    label: 'Expert',
    hint: 'Advanced knowledge',
    icon: 'fa-rocket',
  },
]

type CourseOnboardingProps = {
  courseTitle: string
  /** Called with the collected answers when the learner confirms. */
  onSubmit: (payload: CourseOnboardingPayload) => void
  /** Called when the learner dismisses the modal without answering. */
  onSkip: () => void
  /** True while the enroll request is in flight (submit button spinner). */
  submitting?: boolean
  /** Optional error string shown above the buttons. */
  error?: string | null
}

export function CourseOnboarding({ courseTitle, onSubmit, onSkip, submitting = false, error = null }: CourseOnboardingProps) {
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'expert'>('beginner')
  const [goal, setGoal] = useState('')

  // Lock page scroll while the modal is open and restore it on unmount, so the
  // background never moves under the dialog.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // Escape closes the dialog (treats it as skip).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onSkip()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onSkip, submitting])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({ skill_level: level, learning_goal: goal.trim() || null })
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Course onboarding"
    >
      <form
        onSubmit={handleSubmit}
        className="courser-card w-full max-w-lg p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary dark:text-primary-dark">One quick step</p>
            <h2 className="mt-1 text-xl font-bold text-stone-900 dark:text-stone-50 sm:text-2xl">
              Tell us about yourself
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              Before you start <span className="font-semibold text-stone-800 dark:text-stone-100">{courseTitle}</span>, let
              us tailor the experience to your level and goals.
            </p>
          </div>
          <button
            type="button"
            onClick={onSkip}
            disabled={submitting}
            aria-label="Close onboarding"
            className="shrink-0 rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <i className="fa-solid fa-xmark text-lg" aria-hidden />
          </button>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-bold text-stone-800 dark:text-stone-100">What is your experience level?</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {LEVELS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setLevel(item.value)}
                aria-pressed={level === item.value}
                className={[
                  'flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition',
                  level === item.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30 dark:border-primary-dark dark:bg-primary-dark/10'
                    : 'border-stone-200 hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-9 w-9 items-center justify-center rounded-lg text-sm',
                    level === item.value
                      ? 'bg-primary text-white dark:bg-primary-dark'
                      : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
                  ].join(' ')}
                >
                  <i className={`fa-solid ${item.icon}`} aria-hidden />
                </span>
                <span className="text-sm font-bold text-stone-900 dark:text-stone-50">{item.label}</span>
                <span className="text-xs text-stone-500 dark:text-stone-400">{item.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mt-6 block">
          <span className="text-sm font-bold text-stone-800 dark:text-stone-100">What do you want to achieve?</span>
          <span className="ml-1 text-xs font-normal text-stone-400">(optional)</span>
          <input
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="e.g. Build my first web app"
            maxLength={200}
            disabled={submitting}
            className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-primary-dark dark:focus:ring-primary-dark/25"
          />
        </label>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onSkip}
            disabled={submitting}
            className="text-sm font-semibold text-stone-500 transition hover:text-stone-800 disabled:opacity-50 dark:text-stone-400 dark:hover:text-stone-100"
          >
            Skip for now
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary-dark"
          >
            <i className={`fa-solid ${submitting ? 'fa-spinner fa-spin' : 'fa-graduation-cap'} mr-2`} aria-hidden />
            {submitting ? 'Enrolling…' : 'Start learning'}
          </button>
        </div>
      </form>
    </div>
  )
}
