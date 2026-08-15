// ─── ModuleQuiz: end-of-module mastery self-check ──────────────────────────
// A graded multiple-choice quiz shown at the bottom of the reading workspace
// for the active module. The learner answers every question, submits, sees
// score + pass/fail with per-question explanations, and can retry. Results
// are recorded per user via the API (the module's `quiz_result` reflects the
// latest attempt, so a passed module shows a "✓ passed" badge on reload).

import { submitQuizResult, type ApiQuiz, type ApiQuizResult } from '@/api/courses'
import type { AuthSession } from '@/auth/session'
import { useState } from 'react'

type ModuleQuizProps = {
  quiz: ApiQuiz
  moduleTitle: string
  moduleNumber: number
  session: AuthSession | null
  previous: ApiQuizResult | null
  /** Called after a successful submit so the parent can update quiz_result. */
  onResult?: (result: ApiQuizResult) => void
}

export function ModuleQuiz({ quiz, moduleTitle, moduleNumber, session, previous, onResult }: ModuleQuizProps) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => quiz.questions.map(() => null))
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const answeredCount = answers.filter((answer) => answer !== null).length
  const allAnswered = answeredCount === quiz.questions.length

  // Grading is local: the quiz ships with correct_index so the workspace can
  // score instantly and explain each answer (this is a self-check, not a
  // certification). The backend re-derives pass/fail from the score.
  const score =
    submitted && allAnswered
      ? Math.round(
          (quiz.questions.reduce((n, question, index) => n + (answers[index] === question.correct_index ? 1 : 0), 0) /
            quiz.questions.length) *
            100,
        )
      : 0
  const passed = score >= quiz.pass_percent

  function pick(questionIndex: number, optionIndex: number) {
    if (submitted || saving) return
    setAnswers((prev) => prev.map((answer, index) => (index === questionIndex ? optionIndex : answer)))
  }

  async function handleSubmit() {
    if (!allAnswered || saving) return
    setSaving(true)
    setError(null)
    setSubmitted(true)
    if (session) {
      try {
        const result = await submitQuizResult(quiz.module_id, score, passed, quiz.questions.length)
        onResult?.(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save your quiz result.')
      }
    }
    setSaving(false)
  }

  function handleRetry() {
    setAnswers(quiz.questions.map(() => null))
    setSubmitted(false)
    setError(null)
  }

  return (
    <section className="mt-8 rounded-2xl border border-stone-300 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 px-5 py-4 dark:border-stone-700">
        <p className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-50">
          <i className="fa-solid fa-circle-question text-primary dark:text-primary-dark" aria-hidden />
          Module {moduleNumber} quiz — check your understanding
        </p>
        <div className="flex items-center gap-2">
          {previous ? (
            <span
              className={[
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                previous.passed
                  ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
              ].join(' ')}
            >
              <i className={`fa-solid ${previous.passed ? 'fa-check' : 'fa-rotate'}`} aria-hidden />
              {previous.passed ? 'Passed' : 'Best attempt'} {Math.round(previous.score)}%
            </span>
          ) : (
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
              Pass mark {quiz.pass_percent}%
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        <p className="text-sm text-stone-600 dark:text-stone-300">{moduleTitle}</p>
        <div className="mt-4 space-y-5">
          {quiz.questions.map((question, questionIndex) => {
            const picked = answers[questionIndex]
            const isCorrect = submitted && picked === question.correct_index
            const isWrong = submitted && picked !== null && picked !== question.correct_index
            return (
              <div key={questionIndex} className="rounded-xl border border-stone-200 p-4 dark:border-stone-700">
                <p className="font-semibold text-stone-900 dark:text-stone-50">
                  {questionIndex + 1}. {question.question}
                </p>
                <div className="mt-3 space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const isPicked = picked === optionIndex
                    const revealCorrect = submitted && optionIndex === question.correct_index
                    return (
                      <button
                        key={optionIndex}
                        type="button"
                        onClick={() => pick(questionIndex, optionIndex)}
                        disabled={submitted}
                        className={[
                          'flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition',
                          !submitted && isPicked
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30 dark:border-primary-dark dark:bg-primary-dark/10'
                            : revealCorrect
                              ? 'border-green-400 bg-green-50 text-green-900 dark:border-green-600 dark:bg-green-950/30 dark:text-green-200'
                              : isWrong
                                ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950/30 dark:text-red-200'
                                : 'border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]',
                            revealCorrect
                              ? 'border-green-500 bg-green-500 text-white'
                              : isWrong
                                ? 'border-red-400 bg-red-400 text-white'
                                : isPicked
                                  ? 'border-primary bg-primary text-white dark:border-primary-dark dark:bg-primary-dark'
                                  : 'border-stone-300 text-stone-500 dark:border-stone-600 dark:text-stone-400',
                          ].join(' ')}
                        >
                          <i
                            className={`fa-solid ${revealCorrect ? 'fa-check' : isWrong ? 'fa-xmark' : ''}`}
                            aria-hidden
                          />
                        </span>
                        <span>{option}</span>
                      </button>
                    )
                  })}
                </div>
                {submitted ? (
                  <p
                    className={[
                      'mt-3 rounded-lg p-3 text-sm',
                      isCorrect
                        ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200'
                        : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
                    ].join(' ')}
                  >
                    <i className={`fa-solid ${isCorrect ? 'fa-check' : 'fa-circle-info'} mr-1.5`} aria-hidden />
                    {isCorrect ? 'Correct.' : picked === null ? 'Not answered.' : 'Not quite.'}{' '}
                    {question.explanation}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>

        {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-stone-200 pt-4 dark:border-stone-700">
          {!submitted ? (
            <>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!allAnswered || saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary-dark"
              >
                <i className={`fa-solid ${saving ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} aria-hidden />
                {saving ? 'Saving…' : allAnswered ? 'Submit answers' : `Answer ${answeredCount}/${quiz.questions.length}`}
              </button>
              <span className="text-xs text-stone-500 dark:text-stone-400">Pass mark {quiz.pass_percent}% — you can retry.</span>
            </>
          ) : (
            <>
              <span
                className={[
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold',
                  passed
                    ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                ].join(' ')}
              >
                <i className={`fa-solid ${passed ? 'fa-trophy' : 'fa-rotate'}`} aria-hidden />
                You scored {score}% — {passed ? 'passed' : `needs ${quiz.pass_percent}%`}
              </span>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                <i className="fa-solid fa-rotate-left" aria-hidden />
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}