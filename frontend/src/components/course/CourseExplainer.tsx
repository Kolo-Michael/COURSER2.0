// ─── CourseExplainer: logged-out course landing page ────────────────────────
// Shown to visitors who are NOT signed in instead of the full reading
// workspace. Explains what the course covers and what the free learning
// experience includes (study notes, quizzes, progress, Cora), previews the
// module/lesson outline as a read-only list, and funnels the visitor to
// sign up / log in — carrying a `next` param so they land back on the
// course after auth. No lesson content, notes, resources, quizzes, or the
// Cora chat are exposed here.

import type { ApiCourse } from '@/api/courses'
import { Link } from 'react-router-dom'

// What a signed-in learner gets on every free course — the explainer pitch.
const COURSE_FEATURES = [
  {
    icon: 'fa-solid fa-book-open',
    title: 'Structured study notes',
    text: 'Every lesson ships with clear, organized notes — no video required.',
  },
  {
    icon: 'fa-solid fa-clipboard-check',
    title: 'Check your understanding',
    text: 'End-of-module quizzes that confirm you really got the material.',
  },
  {
    icon: 'fa-solid fa-pen-to-square',
    title: 'Private lesson notes',
    text: 'Jot notes for each lesson and keep them in your own workspace.',
  },
  {
    icon: 'fa-solid fa-chart-line',
    title: 'Progress tracking',
    text: 'Mark lessons complete and watch your progress grow across the course.',
  },
  {
    icon: 'fa-solid fa-robot',
    title: 'Cora, your AI tutor',
    text: 'Ask about any lesson and get instant, course-aware answers.',
  },
  {
    icon: 'fa-solid fa-newspaper',
    title: 'Curated resources',
    text: 'License-compliant articles and links from the best free sources.',
  },
]

export function CourseExplainer({ course }: { course: ApiCourse }) {
  const next = `/courses/${course.slug}`
  const totalLessons =
    course.modules?.reduce((total, module) => total + (module.lessons?.length ?? 0), 0) ?? 0

  return (
    <div className="space-y-8">
      {/* Sign-in pitch: what you unlock by creating a free account. */}
      <section className="courser-card overflow-hidden">
        <div className="courser-bg-dots grid gap-6 border-b border-stone-200 bg-white/50 p-6 backdrop-blur-md lg:grid-cols-[minmax(0,1fr)_300px] lg:p-8 dark:border-stone-700/60 dark:bg-stone-900/60">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary dark:text-primary-dark">
              <i className="fa-solid fa-unlock" aria-hidden />
              Free course · sign in to start learning
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-3xl">
              Unlock the full {course.title} workspace
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              {totalLessons > 0 ? (
                <>
                  {course.modules?.length} module{course.modules?.length === 1 ? '' : 's'} · {totalLessons}{' '}
                  lesson{totalLessons === 1 ? '' : 's'} of study notes, quizzes, and AI support — read straight in the
                  app, at your own pace.
                </>
              ) : (
                'Structured study notes, quizzes, and AI support — read straight in the app, at your own pace.'
              )}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                to={`/auth?mode=signup&next=${next}`}
                className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 dark:bg-primary-dark"
              >
                <i className="fa-solid fa-user-plus mr-2 text-xs" aria-hidden />
                Create free account
              </Link>
              <Link
                to={`/auth?mode=login&next=${next}`}
                className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                Log in
              </Link>
            </div>
          </div>

          {/* Cora teaser card so the tutor is visible (but not usable) here. */}
          <div className="rounded-xl border border-stone-200/70 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-stone-700/60 dark:bg-stone-900/70">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 rounded-full bg-primary">
                <span className="absolute left-3 top-4 h-2 w-2 rounded-full bg-white" />
                <span className="absolute right-3 top-4 h-2 w-2 rounded-full bg-white" />
                <span className="absolute bottom-4 left-1/2 h-1.5 w-5 -translate-x-1/2 rounded-full bg-accent" />
                <span className="absolute -right-1 -top-1 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                  AI
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-50">Cora answers questions</p>
                <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                  Your AI study companion is available inside every course.
                </p>
              </div>
            </div>
            <p className="mt-3 rounded-lg bg-stone-100 p-3 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">
              <i className="fa-solid fa-lock mr-1.5 text-stone-400" aria-hidden />
              Sign in to ask Cora about this course.
            </p>
          </div>
        </div>

        {/* What you get — feature highlights. */}
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 lg:p-8">
          {COURSE_FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-stone-200/70 bg-stone-50/60 p-4 dark:border-stone-700/60 dark:bg-stone-800/40">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-dark">
                <i className={feature.icon} aria-hidden />
              </span>
              <p className="mt-3 text-sm font-bold text-stone-900 dark:text-stone-50">{feature.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Read-only outline preview: modules + lesson titles/durations. Lesson
         content stays hidden until the visitor signs in. */}
      {course.modules?.length ? (
        <section className="courser-card p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">Course outline</h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                Preview what you'll learn — open lessons after you sign in.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
              <i className="fa-solid fa-lock text-stone-400" aria-hidden />
              Sign in to open lessons
            </span>
          </div>

          <div className="mt-6 space-y-6">
            {course.modules.map((module, moduleIndex) => (
              <div key={module.id} className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700">
                <div className="flex items-center gap-3 border-b border-stone-200 bg-stone-50/70 px-4 py-3 dark:border-stone-700 dark:bg-stone-800/40">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary dark:bg-primary/20 dark:text-primary-dark">
                    {moduleIndex + 1}
                  </span>
                  <p className="font-semibold text-stone-900 dark:text-stone-50">
                    {module.title}
                    <span className="ml-2 text-xs font-normal text-stone-500 dark:text-stone-400">
                      {module.lessons?.length ?? 0} lesson{(module.lessons?.length ?? 0) === 1 ? '' : 's'}
                    </span>
                  </p>
                </div>
                <ul className="divide-y divide-stone-100 bg-white/40 dark:divide-stone-800 dark:bg-stone-900/40">
                  {(module.lessons ?? []).map((lesson, lessonIndex) => (
                    <li key={lesson.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                        {lessonIndex + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-700 dark:text-stone-200">
                        {lesson.title}
                      </span>
                      <span className="flex shrink-0 items-center gap-3 text-xs font-semibold text-stone-400">
                        <span className="inline-flex items-center gap-1">
                          <i className="fa-regular fa-clock" aria-hidden />
                          {lesson.duration ?? 'Self-paced'}
                        </span>
                        <i className="fa-solid fa-lock text-stone-300 dark:text-stone-600" aria-hidden />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-stone-200/70 bg-stone-50/60 p-6 text-center dark:border-stone-700/60 dark:bg-stone-800/40">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-dark">
              <i className="fa-solid fa-graduation-cap text-xl" aria-hidden />
            </span>
            <p className="text-base font-bold text-stone-900 dark:text-stone-50">Ready to start learning?</p>
            <p className="max-w-md text-sm text-stone-600 dark:text-stone-300">
              Create a free account to read the lessons, track your progress, and ask Cora for help.
            </p>
            <Link
              to={`/auth?mode=signup&next=${next}`}
              className="mt-1 inline-flex items-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 dark:bg-primary-dark"
            >
              <i className="fa-solid fa-user-plus mr-2 text-xs" aria-hidden />
              Create free account
            </Link>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Already have an account?{' '}
              <Link to={`/auth?mode=login&next=${next}`} className="font-semibold text-primary hover:underline dark:text-primary-dark">
                Log in
              </Link>
            </p>
          </div>
        </section>
      ) : null}
    </div>
  )
}