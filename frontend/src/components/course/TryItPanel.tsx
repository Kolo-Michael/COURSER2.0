// ─── TryItPanel: w3schools-style "Try it Yourself" editor ──────────────────
// A small in-place code playground: a monospace editor (dark) on one side and
// a sandboxed live output iframe on the other. The learner edits the HTML and
// presses Run; Reset restores the original example. Scripts are allowed in the
// sandbox but same-origin access is not, so demos can run JavaScript without
// reaching the parent page.

import { useState } from 'react'

export function TryItPanel({ title, code }: { title: string; code: string }) {
  const [value, setValue] = useState(code)
  const [runKey, setRunKey] = useState(0)

  // Run forces the iframe to remount so edits always take effect even if the
  // document content is identical to the previous run.
  function handleRun() {
    setRunKey((key) => key + 1)
  }

  function handleReset() {
    setValue(code)
    setRunKey((key) => key + 1)
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-300 shadow-sm dark:border-stone-700" aria-label="Try it yourself">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-300 bg-stone-200/70 px-3 py-2 dark:border-stone-700 dark:bg-stone-800/70">
        <p className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-50">
          <i className="fa-solid fa-code text-primary dark:text-primary-dark" aria-hidden />
          Try it Yourself
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            <i className="fa-solid fa-rotate-left mr-1.5" aria-hidden />
            Reset
          </button>
          <button
            type="button"
            onClick={handleRun}
            className="rounded-lg bg-accent px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:brightness-110 dark:bg-accent-dark"
          >
            <i className="fa-solid fa-play mr-1.5" aria-hidden />
            Run
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        <label className="block">
          <span className="sr-only">HTML editor</span>
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            spellCheck={false}
            className="h-64 w-full resize-y bg-stone-900 p-3 font-mono text-[13px] leading-5 text-stone-100 outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50 md:h-72"
            aria-label={`Editable ${title} example`}
          />
        </label>
        <div className="border-t border-stone-300 bg-white md:border-l md:border-t-0 dark:border-stone-700">
          <iframe
            key={runKey}
            title={`${title} output`}
            srcDoc={value}
            sandbox="allow-scripts"
            className="h-64 w-full bg-white md:h-72"
          />
        </div>
      </div>
    </section>
  )
}