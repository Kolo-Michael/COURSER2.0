// ─── TypedPhrases: cyclic multi-phrase typewriter ────────────────────────
// Cycles through phrases forever: each phrase types out character by
// character, holds briefly, then deletes itself before the next phrase
// starts typing. Only the active phrase is shown, with a blinking cursor.
// Under prefers-reduced-motion the full text is rendered statically.
import { useEffect, useState } from 'react'

type TypedPhrasesProps = {
  phrases: string[]
}

type Step = {
  index: number
  chars: number
  mode: 'type' | 'delete'
}

const CHAR_DELAY_MS = 26
const DELETE_DELAY_MS = 12
const HOLD_MS = 900

export function TypedPhrases({ phrases }: TypedPhrasesProps) {
  const [step, setStep] = useState<Step>({ index: 0, chars: 0, mode: 'type' })
  const [staticMode, setStaticMode] = useState(false)

  useEffect(() => {
    // Reduced motion: no animation, show the full text.
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStaticMode(true)
      return
    }
    setStaticMode(false)

    const current = phrases[step.index]
    if (!current) return

    let delay = CHAR_DELAY_MS
    let next: () => void

    if (step.mode === 'type') {
      if (step.chars < current.length) {
        next = () => setStep((s) => ({ ...s, chars: s.chars + 1 }))
      } else {
        // Fully typed: hold, then switch to deleting.
        delay = HOLD_MS
        next = () => setStep((s) => ({ ...s, mode: 'delete' }))
      }
    } else {
      // Deleting: remove a character per tick, then move to the next phrase.
      delay = DELETE_DELAY_MS
      if (step.chars > 0) {
        next = () => setStep((s) => ({ ...s, chars: s.chars - 1 }))
      } else {
        next = () =>
          setStep((s) => ({
            index: (s.index + 1) % phrases.length,
            chars: 0,
            mode: 'type',
          }))
      }
    }

    const timer = setTimeout(next, delay)
    return () => clearTimeout(timer)
  }, [step, phrases])

  if (staticMode) {
    return (
      <span aria-label={phrases.join(' ')}>
        {phrases.map((phrase, index) => (
          <span key={index} className="block">
            {phrase}
          </span>
        ))}
      </span>
    )
  }

  const current = phrases[step.index]
  return (
    <span aria-label={phrases.join(' ')}>
      <span className="block" aria-hidden="true">
        {current.slice(0, step.chars)}
        <span className="typing-cursor text-accent dark:text-accent-dark">▍</span>
      </span>
    </span>
  )
}