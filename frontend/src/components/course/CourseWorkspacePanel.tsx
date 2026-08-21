// ─── CourseWorkspacePanel: reading-first lesson workspace ──────────────────
// A page-agnostic lesson workspace centered on reading. Given a course (with
// modules/lessons), a session, and the user's enrollment it renders the
// lesson outline, the study-notes reader (no video — reading is the primary
// path for now), a personal-notes box, prev/next lesson navigation, mark
// complete, course progress, and the Cora tutor sidebar. This same panel
// powers the course page and is embedded on the dashboard (Overview) so the
// workspace stays visible outside the course route.

import {
  completeLesson,
  downloadCoursePdf,
  type ApiCourse,
  type ApiEnrollmentDetail,
  type ApiLesson,
  type ApiLessonQuizResult,
  type ApiQuizResult,
} from '@/api/courses'
import type { AuthSession } from '@/auth/session'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CoraChat } from './CoraChat'
import { LessonNotes, parseNotes, type NoteCodeBlock } from './lessonNotes'
import { LessonQuiz } from './LessonQuiz'
import { ModuleQuiz } from './ModuleQuiz'
import { TryItPanel } from './TryItPanel'
import { LESSON_EXAMPLES } from './tryItExamples'

// Plain, markdown-free preview of a lesson's notes for the outline rows:
// strips fenced code blocks, heading/bullet/number markers, **bold**, and
// backticks, then returns the first non-empty line, truncated.
function lessonPreview(content: string | null | undefined): string {
  if (!content) return ''
  const clean = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^```/.test(line))
    .map((line) => line.replace(/^#{1,3}\s+/, '').replace(/^[-*]\s+/, '').replace(/^\d+[.)]\s+/, ''))
    .map((line) => line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1'))
    .filter(Boolean)
  return clean[0] ? (clean[0].length > 90 ? `${clean[0].slice(0, 90)}…` : clean[0]) : ''
}

// Lesson pane tabs: official study notes, personal notes, further resources.
type LessonTab = 'Study notes' | 'Notes' | 'Resources'

// localStorage key under which this course's personal notes are saved.
const NOTES_STORAGE_KEY = (slug: string) => `courser.notes:${slug}`

// Unlock the offline copy of a course once the learner is ≥50% through it.
const PDF_UNLOCK_PERCENT = 50

/** Download button for the course PDF, shown only once the 50% gate passes. */
function DownloadPdfButton({ slug }: { slug: string }) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function handleDownload() {
    setDownloading(true)
    setError(null)
    try {
      await downloadCoursePdf(slug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download the PDF.')
    } finally {
      setDownloading(false)
    }
  }
  return (
    <span className="flex items-center gap-2">
      {error ? (
        <span className="max-w-[180px] truncate text-[11px] font-semibold text-red-600 dark:text-red-400" title={error}>
          {error}
        </span>
      ) : null}
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        title="Download this course as a PDF"
        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60 dark:bg-accent-dark"
      >
        <i className={`fa-solid ${downloading ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`} aria-hidden />
        {downloading ? 'Preparing…' : 'Download PDF'}
      </button>
    </span>
  )
}

type CourseWorkspacePanelProps = {
  course: ApiCourse
  session: AuthSession | null
  enrollment: ApiEnrollmentDetail | null
  /** Render the "Modules & lessons" outline above the reading pane. */
  showOutline?: boolean
  /** Optional element rendered at the top-right of the reading pane header. */
  headerAction?: ReactNode
  /** Lesson to open on first render (defaults to the first lesson). */
  defaultLessonId?: string | null
  /** Called after a lesson completes so parents can reconcile their own
   *  enrollment + course-list state. */
  onEnrollmentChange?: (enrollment: ApiEnrollmentDetail | null) => void
}

export function CourseWorkspacePanel({
  course,
  session,
  enrollment,
  showOutline = true,
  headerAction,
  defaultLessonId = null,
  onEnrollmentChange,
}: CourseWorkspacePanelProps) {
  // Local writable copy of the course so lesson progress reflects instantly
  // after "Mark lesson complete" without waiting on the parent to refetch.
  const [workCourse, setWorkCourse] = useState(course)
  useEffect(() => setWorkCourse(course), [course])

  // A signed-in learner who isn't enrolled yet may browse the course outline
  // (module + lesson topics) but the study notes / Cora / quiz stay locked
  // until they start the course. `session && !enrollment` ⇒ locked preview.
  const isLocked = Boolean(session && !enrollment)
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  // Enlarged reading mode: when the learner clicks a lesson the outline
  // and Cora rail step aside so the study notes get the full width
  // for comfortable reading on both desktop and phone-sized screens.
  const [readingExpanded, setReadingExpanded] = useState<boolean>(false)

  const allLessons = useMemo(() => workCourse?.modules?.flatMap((module) => module.lessons) ?? [], [workCourse])

  // Sequential module unlocking: module i is reachable only once EVERY lesson
  // of modules 0..i-1 is completed (`is_completed` comes from the per-(user,
  // lesson) progress API). Module 0 is always open; empty modules never block.
  const moduleUnlocked = useMemo(() => {
    const flags: boolean[] = []
    let open = true
    for (const module of workCourse?.modules ?? []) {
      flags.push(open)
      open = open && (module.lessons ?? []).every((item) => item.is_completed)
    }
    return flags
  }, [workCourse])

  // First lesson of the furthest unlocked (not-yet-finished) module — the
  // landing spot when the requested lesson lives in a locked module.
  function firstOpenLessonId(): string | null {
    let open = true
    for (const module of workCourse?.modules ?? []) {
      const lessons = module.lessons ?? []
      if (open && lessons.length) return lessons[0].id
      open = open && lessons.every((item) => item.is_completed)
    }
    return allLessons[0]?.id ?? null
  }

  // Initial lesson: honor defaultLessonId only when its module is unlocked;
  // otherwise start at the first lesson of the furthest unlocked module.
  const [activeLessonId, setActiveLessonId] = useState<string | null>(() => {
    const modules = course?.modules ?? []
    let fallback: string | null = null
    let open = true
    for (const module of modules) {
      const lessons = module.lessons ?? []
      if (open && lessons.length && !fallback) fallback = lessons[0].id
      if (open && defaultLessonId && lessons.some((item) => item.id === defaultLessonId)) return defaultLessonId
      open = open && lessons.every((item) => item.is_completed)
    }
    return fallback ?? allLessons[0]?.id ?? null
  })

  // Keep the selected lesson valid AND unlocked: fall back whenever the active
  // id stops matching a real lesson or lands inside a locked module.
  useEffect(() => {
    if (!allLessons.length) return
    setActiveLessonId((prev) => {
      if (prev && allLessons.some((item) => item.id === prev)) {
        const idx = course?.modules?.findIndex((m) => m.lessons?.some((i) => i.id === prev)) ?? -1
        return idx >= 0 && !moduleUnlocked[idx] ? firstOpenLessonId() : prev
      }
      return allLessons[0].id
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workCourse, allLessons.length])

  const activeLesson = useMemo(
    () => allLessons.find((item) => item.id === activeLessonId) ?? allLessons[0] ?? null,
    [allLessons, activeLessonId],
  )

  // One-module focus mode: the nav shows only the module that contains the
  // active lesson, and prev/next lesson are scoped within that module. A
  // dedicated "Next module" button advances the learner to the next module
  // once they've read through the current one.
  const currentModule = useMemo(
    () =>
      workCourse?.modules?.find((module) => module.lessons?.some((item) => item.id === activeLesson?.id)) ??
      workCourse?.modules?.[0] ??
      null,
    [workCourse, activeLesson?.id],
  )
  const moduleLessons = useMemo(() => currentModule?.lessons ?? [], [currentModule])
  const moduleIndex = useMemo(
    () => workCourse?.modules?.findIndex((module) => module.id === currentModule?.id) ?? -1,
    [workCourse, currentModule?.id],
  )
  const totalModules = workCourse?.modules?.length ?? 0

  // Completion stats for the active module — drive the "Next module" gate and
  // the "X of Y lessons done" chip in the module header.
  const moduleCompletedCount = moduleLessons.filter((item) => item.is_completed).length
  const moduleLessonsComplete = moduleLessons.every((item) => item.is_completed)

  // Dismissible banner explaining why a locked module/lesson can't be opened.
  const [lockedNotice, setLockedNotice] = useState<string | null>(null)
  useEffect(() => setLockedNotice(null), [activeLesson?.id])

  // Why advancing to the next module is currently blocked (null ⇒ allowed).
  // Every lesson in the active module must be completed first; authored
  // quizzes (per-lesson + end-of-module) must also be passed when present.
  function nextModuleLockReason(): string | null {
    if (moduleLessons.length && !moduleLessonsComplete) {
      const left = moduleLessons.length - moduleCompletedCount
      return `Complete all ${moduleLessons.length} lessons in this module to unlock the next one — ${left} left.`
    }
    if (lessonHasQuiz && !(lessonQuizResult?.passed ?? false)) {
      return 'Pass this lesson quiz to unlock the next module.'
    }
    if (quizResult && !quizResult.passed) {
      return 'Pass the module quiz to unlock the next module.'
    }
    return null
  }

  // Jump to a specific module by index, landing on its first lesson. Locked
  // modules are refused (with a notice) — backward jumps always work because
  // unlocking is prefix-based.
  function jumpToModule(at: number) {
    if (!moduleUnlocked[at]) {
      setLockedNotice(`Module ${at + 1} is locked — finish every lesson in the earlier modules first.`)
      return
    }
    const target = workCourse?.modules?.[at]
    if (target?.lessons?.[0]) setActiveLessonId(target.lessons[0].id)
  }
  const handlePrevModule = () => {
    if (moduleIndex > 0) jumpToModule(moduleIndex - 1)
  }
  const handleNextModule = () => {
    if (moduleIndex < 0 || moduleIndex >= totalModules - 1) return
    const reason = nextModuleLockReason()
    if (reason) {
      setLockedNotice(reason)
      return
    }
    jumpToModule(moduleIndex + 1)
  }

  // Tab + personal-notes state (notes persist to localStorage, see below).
  const [activeTab, setActiveTab] = useState<LessonTab>('Study notes')
  const [notes, setNotes] = useState<string>('')

  const [completing, setCompleting] = useState<string | null>(null)
  const [showTryIt, setShowTryIt] = useState(false)

  // Load notes for this course from localStorage when the course changes.
  useEffect(() => {
    if (!course) return
    try {
      const saved = window.localStorage.getItem(NOTES_STORAGE_KEY(course.slug))
      if (saved) setNotes(saved)
    } catch {
      // localStorage may be unavailable in private mode — ignore.
    }
  }, [course])

  // Persist notes as the user types.
  useEffect(() => {
    if (!course) return
    try {
      window.localStorage.setItem(NOTES_STORAGE_KEY(course.slug), notes)
    } catch {
      // ignore
    }
  }, [course, notes])

  // Global position is used for the "Lesson X of Y" label; prev/next lesson
  // navigation is scoped to the current module.
  const lessonIndex = allLessons.findIndex((item) => item.id === activeLesson?.id)
  const lessonIndexInModule = moduleLessons.findIndex((item) => item.id === activeLesson?.id)
  const prevLesson = lessonIndexInModule > 0 ? moduleLessons[lessonIndexInModule - 1] : null
  const nextLesson =
    lessonIndexInModule >= 0 && lessonIndexInModule < moduleLessons.length - 1
      ? moduleLessons[lessonIndexInModule + 1]
      : null
  const hasNextModule = moduleIndex >= 0 && moduleIndex < totalModules - 1

  const lessonComplete = Boolean(activeLesson?.is_completed)
  const progressPercent = enrollment?.progress_percent ?? 0

  // Runnable example for the "Try it Yourself" editor: prefer a hand-crafted
  // demo for this lesson, else auto-assemble a document from the lesson's own
  // fenced HTML/CSS code blocks. Null → no Try-it button for this lesson.
  const example = useMemo(() => {
    if (!activeLesson) return null
    const custom = LESSON_EXAMPLES[activeLesson.title]
    if (custom) return custom
    const codeBlocks = parseNotes(activeLesson.content ?? '').filter(
      (block): block is NoteCodeBlock => block.kind === 'code',
    )
    const html = codeBlocks
      .filter((block) => !block.lang || block.lang === 'html')
      .map((block) => block.code)
      .join('\n')
    if (html) return html
    const css = codeBlocks.filter((block) => block.lang === 'css').map((block) => block.code).join('\n')
    if (css) {
      return `<!DOCTYPE html><html><head><style>${css}</style></head><body><h1>Try it</h1><p>Edit the styles and press Run.</p></body></html>`
    }
    return null
  }, [activeLesson])

  // Close the editor when switching lessons so it always shows fresh content.
  useEffect(() => {
    setShowTryIt(false)
  }, [activeLesson?.id])

  // Latest quiz attempt for the active module (attached by the API when the
  // user is signed in), kept writable so a fresh submit reflects instantly.
  const quiz = currentModule?.quiz ?? null
  const quizResult = currentModule?.quiz_result ?? null

  // Latest quiz attempt for the active lesson (fetched from the API).
  const [lessonQuizResult, setLessonQuizResult] = useState<ApiLessonQuizResult | null>(null)
  // Whether the active lesson actually ships a per-lesson quiz (reported by
  // LessonQuiz). When a quiz exists and isn't passed, the "next" step locks.
  const [lessonHasQuiz, setLessonHasQuiz] = useState<boolean>(false)
  useEffect(() => {
    if (!session || !activeLesson?.id) return
    setLessonHasQuiz(false)
    setLessonQuizResult(null)
    ;(async () => {
      try {
        const r = await fetch(`/api/lessons/${activeLesson.id}/quiz/result`, {
          credentials: 'include',
        })
        const data = await r.json()
        setLessonQuizResult(data)
      } catch {
        // ignore — keep current state
      }
    })()
  }, [activeLesson?.id, session])
  function handleLessonQuizResult(result: ApiLessonQuizResult) {
    setLessonQuizResult(result)
  }
  function handleQuizResult(result: ApiQuizResult) {
    setWorkCourse((prev) =>
      prev
        ? {
            ...prev,
            modules: prev.modules?.map((module) =>
              module.id === currentModule?.id ? { ...module, quiz_result: result } : module,
            ),
          }
        : prev,
    )
  }

  // Mark a lesson complete. Patches the lesson's own progress + is_completed
  // on the local course copy, and reconciles the enrollment totals from the
  // API echo (course_progress_percent / completed_lessons / total_lessons),
  // deriving an is_completed flag locally.
  async function handleMarkComplete(lesson: ApiLesson) {
    if (!session || completing) return
    setCompleting(lesson.id)
    try {
      const result = await completeLesson(lesson.id)
      setWorkCourse((prev) =>
        prev
          ? {
              ...prev,
              modules: prev.modules?.map((module) => ({
                ...module,
                lessons: module.lessons.map((item) =>
                  item.id === lesson.id ? { ...item, progress: result.progress, is_completed: result.is_completed } : item,
                ),
              })),
            }
          : prev,
      )
      if (onEnrollmentChange) {
        const next = enrollment
          ? {
              ...enrollment,
              progress: result.course_progress_percent ?? enrollment.progress,
              progress_percent: result.course_progress_percent ?? enrollment.progress_percent,
              completed_lessons: result.completed_lessons ?? enrollment.completed_lessons,
              total_lessons: result.total_lessons ?? enrollment.total_lessons,
              is_completed:
                (result.completed_lessons ?? 0) === (result.total_lessons ?? 0) ||
                (result.course_progress_percent ?? 0) >= 100,
            }
          : null
        onEnrollmentChange(next)
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not mark this lesson complete.')
    } finally {
      setCompleting(null)
    }
  }

  // Select a lesson (used by the outline rows + prev/next buttons). Opening a
  // lesson enlarges the reading space for focused, readable notes.
  function selectLesson(lesson: ApiLesson) {
    setActiveLessonId(lesson.id)
    setReadingExpanded(true)
  }

  // Collapse back to the full course view (outline + syllabus + Cora).
  function collapseReading() {
    setReadingExpanded(false)
  }

  return (
    <>
      <section className="mt-8 courser-card overflow-clip">
        <div className={`grid grid-cols-1 ${readingExpanded ? '' : 'lg:grid-cols-[1fr_320px]'}`}>
          <div className="flex flex-col">
          {showOutline && !readingExpanded ? (
            <nav
              className="sticky top-20 z-20 border-b bg-stone-50/95 backdrop-blur-md dark:border-stone-700/60 dark:bg-stone-900/95"
              aria-label="Course modules"
            >
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">
                    Module {moduleIndex + 1} of {totalModules}
                  </h2>
                  <span className="flex items-center gap-2">
                    {session && enrollment && (enrollment.progress_percent ?? 0) >= PDF_UNLOCK_PERCENT ? (
                      <DownloadPdfButton slug={course.slug} />
                    ) : null}
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20 dark:text-primary-dark">
                      {progressPercent}% complete
                    </span>
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <i
                      className={`fa-solid ${currentModule ? 'fa-book-open' : 'fa-circle'} text-primary dark:text-primary-dark`}
                      aria-hidden
                    />
                    <span className="truncate font-semibold text-stone-800 dark:text-stone-200">{currentModule?.title ?? '—'}</span>
                  </span>
                  {moduleLessons.length ? (
                    <span
                      className={[
                        'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
                        moduleLessonsComplete
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                          : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
                      ].join(' ')}
                    >
                      {moduleCompletedCount}/{moduleLessons.length} lessons done
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Only the current module's lessons are shown (one-module focus). */}
              {currentModule ? (
                <ul className="py-1">
                  {moduleLessons.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => selectLesson(item)}
                        className={[
                          'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition',
                          activeLesson?.id === item.id
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30 dark:border-primary-dark dark:bg-primary-dark/10'
                            : 'border-stone-200 bg-white hover:border-stone-300 dark:border-stone-700 dark:bg-stone-900/50 dark:hover:border-stone-600',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs',
                            item.is_completed
                              ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                              : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-dark',
                          ].join(' ')}
                        >
                          <i className={`fa-solid ${item.is_completed ? 'fa-check' : 'fa-book-open'}`} aria-hidden />
                        </span>
                        <span className="flex-1">
                          <span className="block font-semibold text-stone-800 dark:text-stone-100">
                            Lesson {currentModule.order}.{item.order}: {item.title}
                          </span>
                          {!isLocked && lessonPreview(item.content) ? (
                            <span className="mt-1 block line-clamp-1 text-xs text-stone-500 dark:text-stone-400">
                              {lessonPreview(item.content)}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex shrink-0 items-center gap-2 text-[11px] font-semibold text-stone-400">
                          <span className="rounded-full bg-stone-100 px-2 py-1 dark:bg-stone-800 dark:text-stone-400">
                            {item.duration ?? 'Self-paced'}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-4 text-sm text-stone-600 dark:text-stone-300">No modules have been published for this course yet.</p>
              )}

              {/* Module-level navigation so the learner can advance to the next
                 module once they've finished reading the current one. Only one
                 module is ever displayed at a time. */}
              {totalModules >= 2 ? (
                <div className="mt-3 flex items-center justify-between border-t border-stone-100/60 px-4 py-3 dark:border-stone-700/60">
                  <button
                    type="button"
                    onClick={handlePrevModule}
                    disabled={moduleIndex <= 0}
                    className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                  >
                    <i className="fa-solid fa-arrow-left text-xs" aria-hidden />
                    Previous module
                  </button>
                  <button
                    type="button"
                    onClick={handleNextModule}
                    disabled={!hasNextModule || Boolean(nextModuleLockReason())}
                    title={hasNextModule ? (nextModuleLockReason() ?? undefined) : undefined}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary-dark"
                  >
                    Next module
                    <i
                      className={`fa-solid ${hasNextModule && !nextModuleLockReason() ? 'fa-arrow-right' : 'fa-lock'} text-xs`}
                      aria-hidden
                    />
                  </button>
                </div>
              ) : null}
            </nav>
          ) : null}

          <div className="p-4 lg:p-8">
            <div className={readingExpanded ? 'mx-auto max-w-5xl' : 'max-w-4xl'}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary dark:text-primary-dark">Reading workspace</p>
                <h2 className="mt-1 text-xl font-bold text-stone-900 dark:text-stone-50 sm:text-2xl">{activeLesson?.title ?? 'Lesson workspace'}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {readingExpanded ? (
                  <button
                    type="button"
                    onClick={collapseReading}
                    className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
                  >
                    <i className="fa-solid fa-arrow-left text-xs" aria-hidden />
                    Back to course
                  </button>
                ) : null}
                {headerAction}
              </div>
            </div>

            {/* Shown when a locked module/lesson is requested (Next module
               while lessons are unfinished, or a Cora deep-link ahead). */}
            {lockedNotice ? (
              <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                <span className="flex items-start gap-2">
                  <i className="fa-solid fa-lock mt-0.5 text-xs" aria-hidden />
                  {lockedNotice}
                </span>
                <button
                  type="button"
                  onClick={() => setLockedNotice(null)}
                  aria-label="Dismiss"
                  className="shrink-0 text-amber-700 transition hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
                >
                  <i className="fa-solid fa-xmark" aria-hidden />
                </button>
              </div>
            ) : null}

            {isLocked ? (
              <div className="mt-5 rounded-xl border border-dashed border-stone-300 bg-stone-50/60 p-8 text-center dark:border-stone-700 dark:bg-stone-800/30">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary-dark/20 dark:text-primary-dark">
                  <i className="fa-solid fa-lock text-xl" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-stone-900 dark:text-stone-50">
                  Start this course to read
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                  Study notes, resources, quizzes, and the Cora tutor unlock once you start this free course. You can
                  still browse the full module outline and lesson list above.
                </p>
              </div>
            ) : (
              <>
            {example ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowTryIt((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-110 dark:bg-accent-dark"
                >
                  <i className={`fa-solid ${showTryIt ? 'fa-eye-slash' : 'fa-code'}`} aria-hidden />
                  {showTryIt ? 'Hide editor' : 'Try it Yourself'}
                </button>
                {showTryIt ? (
                  <div className="mt-4">
                    <TryItPanel title={activeLesson?.title ?? 'Example'} code={example} />
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5">
              {session && activeLesson ? (
                <button
                  type="button"
                  onClick={() => handleMarkComplete(activeLesson)}
                  disabled={completing === activeLesson.id || lessonComplete}
                  className={[
                    'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed',
                    lessonComplete
                      ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                      : 'bg-primary text-white hover:brightness-110 disabled:opacity-60 dark:bg-primary-dark',
                  ].join(' ')}
                >
                  <i className={`fa-solid ${lessonComplete ? 'fa-check' : completing === activeLesson.id ? 'fa-spinner fa-spin' : 'fa-book-open-reader'}`} aria-hidden />
                  {lessonComplete ? 'Lesson completed' : completing === activeLesson.id ? 'Marking…' : 'Mark lesson complete'}
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3" role="tablist" aria-label="Lesson resources">
              {(['Study notes', 'Notes', 'Resources'] as LessonTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={[
                    'rounded-lg border px-3 py-2 text-sm font-semibold transition',
                    activeTab === tab
                      ? 'border-primary bg-primary text-white shadow-sm dark:bg-primary-dark'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800',
                  ].join(' ')}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/70 p-5 dark:border-stone-700 dark:bg-stone-800/40 sm:p-6">
              {activeTab === 'Study notes' ? (
                <div>
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-stone-200 pb-3 dark:border-stone-700">
                    <p className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-50">
                      <i className="fa-solid fa-book-open text-primary dark:text-primary-dark" aria-hidden />
                      Study notes — read this lesson
                    </p>
                    {activeLesson ? (
                      <span
                        className={[
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                          lessonComplete
                            ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                            : 'bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300',
                        ].join(' ')}
                      >
                        <i className={`fa-solid ${lessonComplete ? 'fa-check' : 'fa-book-open'}`} aria-hidden />
                        {lessonComplete ? 'Completed' : 'In progress'}
                      </span>
                    ) : null}
                  </div>
                  {activeLesson ? (
                    <LessonNotes content={activeLesson.content ?? ''} />
                  ) : (
                    <p className="text-sm text-stone-500 dark:text-stone-400">No lesson selected yet.</p>
                  )}
                </div>
              ) : activeTab === 'Notes' ? (
                <div>
                  <label htmlFor="lesson-notes" className="sr-only">
                    Notes
                  </label>
                  <textarea
                    id="lesson-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Type your notes for this lesson — saved locally."
                    rows={6}
                    className="w-full rounded-lg border border-stone-200 bg-white p-3 text-sm text-stone-800 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-primary-dark dark:focus:ring-primary-dark/25"
                  />
                  <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">Notes are saved in this browser only.</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-stone-900 dark:text-stone-50">Best sources for this lesson</p>
                  <p className="mt-1 text-sm">
                    Curated links to the best free resources, plus license-compliant articles you can read here without leaving the app.
                  </p>

                  {activeLesson?.resources?.length ? (
                    <div className="mt-4 space-y-4">
                      {activeLesson.resources.map((resource) => (
                        <article
                          key={resource.id}
                          className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-50">
                              <i className="fa-solid fa-newspaper text-primary dark:text-primary-dark" aria-hidden />
                              {resource.title}
                            </p>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                              <i className="fa-solid fa-scale-balanced" aria-hidden />
                              {resource.source} · {resource.license ?? 'open'}
                            </span>
                          </div>
                          {resource.body ? (
                            <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-700 dark:text-stone-300">
                              {resource.body}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                              This source could not be imported right now — open it directly below.
                            </p>
                          )}
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline dark:text-primary-dark"
                          >
                            <i className="fa-solid fa-up-right-from-square text-xs" aria-hidden />
                            Read the original
                          </a>
                        </article>
                      ))}
                    </div>
                  ) : null}

                  {activeLesson?.resource_links?.length ? (
                    <ul className="mt-4 space-y-2">
                      {activeLesson.resource_links.map((link) => (
                        <li key={link.url}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start gap-3 rounded-lg border border-stone-200 bg-white p-3 text-sm transition hover:border-primary hover:shadow-sm dark:border-stone-700 dark:bg-stone-900 dark:hover:border-primary-dark"
                          >
                            <i className="fa-solid fa-book-open mt-0.5 text-primary dark:text-primary-dark" aria-hidden />
                            <span className="flex-1">
                              <span className="font-semibold text-stone-800 group-hover:text-primary dark:text-stone-100 dark:group-hover:text-primary-dark">
                                {link.title}
                              </span>
                              {link.license ? (
                                <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                                  {link.license}
                                </span>
                              ) : null}
                              <span className="mt-0.5 block truncate text-xs text-stone-400">{link.url}</span>
                            </span>
                            <i className="fa-solid fa-arrow-up-right-from-square text-xs text-stone-400 group-hover:text-primary dark:group-hover:text-primary-dark" aria-hidden />
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {!activeLesson?.resources?.length && !activeLesson?.resource_links?.length ? (
                    <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                      No external resources have been published for this lesson yet — focus on the study notes above.
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            {session && activeLesson ? (
              <LessonQuiz
                lessonId={activeLesson.id}
                lessonTitle={activeLesson.title}
                session={session}
                previous={lessonQuizResult}
                onResult={handleLessonQuizResult}
                onQuizAvailable={setLessonHasQuiz}
              />
            ) : null}

            {quiz && session ? (
              <ModuleQuiz
                quiz={quiz}
                moduleTitle={currentModule?.title ?? 'Module'}
                moduleNumber={moduleIndex + 1}
                session={session}
                previous={quizResult}
                onResult={handleQuizResult}
              />
            ) : null}

            <div className="mt-5 flex flex-col gap-3 border-t border-stone-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-stone-700">
              <div>
                {prevLesson ? (
                  <button
                    type="button"
                    onClick={() => selectLesson(prevLesson)}
                    className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                  >
                    <i className="fa-solid fa-arrow-left text-xs" aria-hidden />
                    Previous lesson
                  </button>
                ) : null}
              </div>
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                Lesson {Math.max(lessonIndex + 1, 1)} of {allLessons.length}
              </p>
              <div>
                {nextLesson ? (
                  <button
                    type="button"
                    onClick={() => selectLesson(nextLesson)}
                    disabled={lessonHasQuiz && !(lessonQuizResult?.passed ?? false)}
                    title={
                      lessonHasQuiz && !(lessonQuizResult?.passed ?? false)
                        ? 'Pass the lesson quiz to unlock the next lesson.'
                        : undefined
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary-dark"
                  >
                    Next lesson
                    <i
                      className={`fa-solid ${lessonHasQuiz && !(lessonQuizResult?.passed ?? false) ? 'fa-lock' : 'fa-arrow-right'} text-xs`}
                      aria-hidden
                    />
                  </button>
                ) : hasNextModule ? (
                  <button
                    type="button"
                    onClick={handleNextModule}
                    disabled={Boolean(nextModuleLockReason())}
                    title={nextModuleLockReason() ?? undefined}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary-dark"
                  >
                    <i className={`fa-solid ${nextModuleLockReason() ? 'fa-lock' : 'fa-book-open'} text-xs`} aria-hidden />
                    Next module
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-sm font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
                    <i className="fa-solid fa-flag-checkered" aria-hidden />
                    Last lesson
                  </span>
                )}
              </div>
            </div>
            </>
            )}
            </div>
          </div>
          </div>

          <aside
            className={[
              'courser-bg-dots-dense hidden border-t border-stone-200 bg-stone-50 p-6 dark:border-stone-700 dark:bg-stone-900 lg:border-l lg:border-t-0 lg:flex lg:flex-col lg:max-h-[calc(100vh-6rem)] lg:self-start lg:sticky lg:top-24',
              // Keep Cora mounted so the mobile floating button can open the
              // expanded (full-screen) chat; hide the compact column on
              // desktop while the reading space is enlarged.
              readingExpanded ? 'lg:hidden' : '',
            ].join(' ')}
          >
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 rounded-full bg-primary">
                <span className="absolute left-4 top-5 h-2 w-2 rounded-full bg-white" />
                <span className="absolute right-4 top-5 h-2 w-2 rounded-full bg-white" />
                <span className="absolute bottom-5 left-1/2 h-1.5 w-6 -translate-x-1/2 rounded-full bg-accent" />
                <span className="absolute -right-1 -top-1 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                  AI
                </span>
              </div>
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-50">Cora answers questions</p>
                <p className="text-sm text-stone-600 dark:text-stone-300">Available by default in every free course.</p>
                {enrollment && (
                  <p className="text-xs mt-1 text-stone-500 dark:text-stone-400">
                    {enrollment.skill_level
                      ? enrollment.skill_level.charAt(0).toUpperCase() + enrollment.skill_level.slice(1)
                      : 'Beginner'}{' '}
                    — {enrollment.learning_goal || 'No goal set'}
                  </p>
                )}
              </div>
            </div>
{isLocked ? (
              <p className="mt-6 rounded-xl border border-dashed border-stone-300 p-4 text-sm text-stone-600 dark:border-stone-700 dark:text-stone-300">
                <i className="fa-solid fa-lock mr-2 text-primary dark:text-primary-dark" aria-hidden />
                Enroll to unlock Cora, your in-course study helper.
              </p>
            ) : (
              <CoraChat
                courseSlug={course.slug}
                courseTitle={course.title}
                session={session}
                modules={workCourse?.modules}
                activeLessonId={activeLesson?.id}
                onSelectLesson={(lessonId) => {
                  const lesson = allLessons.find((item) => item.id === lessonId)
                  if (!lesson) return
                  // Cora can deep-link lessons, but never into locked modules.
                  const targetIdx =
                    workCourse?.modules?.findIndex((m) => m.lessons?.some((i) => i.id === lessonId)) ?? -1
                  if (targetIdx >= 0 && !moduleUnlocked[targetIdx]) {
                    setLockedNotice(
                      `That lesson is in Module ${targetIdx + 1} — finish every lesson in the earlier modules to unlock it.`,
                    )
                    return
                  }
                  selectLesson(lesson)
                }}
                expanded={isExpanded}
                onExpandChange={(expanded) => setIsExpanded(expanded)}
              />
            )}
          </aside>
        </div>
      </section>

      {/* Mobile-only floating Cora button: on phones the compact Cora column
         is hidden (see the aside) so a bottom-right FAB opens the full-screen
         chat instead. Hidden whenever the expanded overlay is already open. */}
      {session && !isLocked && !isExpanded
        ? createPortal(
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              aria-label="Open Cora tutor"
              title="Ask Cora a question"
              className="fixed bottom-6 right-6 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-stone-900/20 transition hover:brightness-110 active:scale-95 dark:bg-primary-dark lg:hidden"
            >
              <i className="fa-solid fa-robot text-xl" aria-hidden />
            </button>,
            document.body,
          )
        : null}
    </>
  )
}