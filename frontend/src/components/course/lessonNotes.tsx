// ─── lessonNotes.tsx : structured study-notes renderer ─────────────────────
// Parses the seeded markdown-style lesson notes (`## Heading` sections, `- `
// bullets, `1. ` numbered lists, paragraphs, **bold** emphasis) and renders
// them as friendly, readable study material. Reused by the course workspace
// panel on the course page and by the embedded workspace on the dashboard.

import type { ReactNode } from 'react'
import { useMemo } from 'react'

// Parsed note hierarchy: a section (## heading) owns nested body blocks,
// which are either paragraphs or (ordered/unordered) lists.
export type NoteBlock =
  | { kind: 'section'; heading: string; body: NoteBlock[] }
  | { kind: 'para'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }

/** Split lesson notes into structured blocks. Convention:
 *  `## Heading` opens a section, `- ` bullets / `1. ` numbers form lists,
 *  plain lines are paragraphs, and **bold** marks inline emphasis. */
export function parseNotes(content: string): NoteBlock[] {
  const blocks: NoteBlock[] = []
  // `open` is the block list currently receiving content: the top level until
  // a heading switches it to that section's body.
  let open: NoteBlock[] = blocks
  // A run of consecutive bullet/number lines accumulates into one list.
  let list: { kind: 'list'; ordered: boolean; items: string[] } | null = null
  const flushList = () => {
    if (list) {
      open.push(list)
      list = null
    }
  }
  for (const raw of (content ?? '').split('\n')) {
    const line = raw.trim()
    if (!line) {
      flushList()
      continue
    }
    // `## ...` (1-3 hash levels all flatten to sections) opens a new section
    // and redirects `open` into it, so everything after nests underneath.
    const heading = line.match(/^#{1,3}\s+(.+)$/)
    if (heading) {
      flushList()
      const section: NoteBlock = { kind: 'section', heading: heading[1], body: [] }
      open.push(section)
      open = section.body
      continue
    }
    const ordered = line.match(/^(\d+)[.)]\s+(.+)$/)
    const bullet = line.match(/^[-*]\s+(.+)$/)
    // Bullets start (or extend) an unordered list; switching to/from ordered
    // flushes the previous run first.
    if (bullet) {
      if (!list || list.ordered) {
        flushList()
        list = { kind: 'list', ordered: false, items: [] }
        open.push(list)
      }
      list.items.push(bullet[1])
      continue
    }
    // Same accumulation logic for numbered lists.
    if (ordered) {
      if (!list || !list.ordered) {
        flushList()
        list = { kind: 'list', ordered: true, items: [] }
        open.push(list)
      }
      list.items.push(ordered[2])
      continue
    }
    // Plain text -> paragraph, but only after closing any in-flight list.
    flushList()
    open.push({ kind: 'para', text: line })
  }
  flushList()
  return blocks
}

/** Render **bold** segments inside a note line.
 *  Splits on the **...** regex; odd-index parts are the bolded text. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, index) =>
    index % 2 === 1 ? (
      <strong key={`${keyPrefix}-${index}`} className="font-semibold text-stone-900 dark:text-stone-50">
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

// Recursively render a block tree: paragraphs as <p>, lists as <ul> with a
// colored bullet dot (ordered lists get the accent color).
function NoteBody({ blocks }: { blocks: NoteBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.kind === 'para') {
          return (
            <p key={index} className="text-sm leading-relaxed text-stone-700 dark:text-stone-200">
              {renderInline(block.text, `p-${index}`)}
            </p>
          )
        }
        if (block.kind === 'list') {
          const items = block.items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-2.5 text-sm leading-relaxed text-stone-700 dark:text-stone-200">
              <span
                className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${block.ordered ? 'bg-accent' : 'bg-primary/60 dark:bg-primary-dark/60'}`}
                aria-hidden
              />
              <span>{renderInline(item, `i-${index}-${itemIndex}`)}</span>
            </li>
          ))
          return <ul key={index} className="space-y-2.5">{items}</ul>
        }
        return null
      })}
    </>
  )
}

/** Render a lesson's organized study notes with friendly section boxes.
 *  Splits content into pre-heading paragraphs + heading sections; recognized
 *  headings ("check your understanding", *takeaway*) get tinted callout boxes,
 *  everything else renders as a plain section header. */
export function LessonNotes({ content }: { content: string }) {
  const blocks = useMemo(() => parseNotes(content), [content])
  if (!blocks.length) {
    return <p className="text-sm text-stone-500 dark:text-stone-400">This lesson has no written notes yet — check back soon.</p>
  }

  // Paragraphs living before any heading are shown first as intro content.
  const contentOnly = blocks.filter((block) => block.kind !== 'section')
  const sections = blocks.filter(
    (block): block is Extract<NoteBlock, { kind: 'section' }> => block.kind === 'section',
  )

  return (
    <div className="space-y-5">
      {contentOnly.length ? <NoteBody blocks={contentOnly} /> : null}

      {sections.map((section, index) => {
        const heading = section.heading.trim().toLowerCase()
        if (heading.includes('check your understanding')) {
          // Quiz section -> primary-tinted callout box.
          return (
            <div key={index} className="rounded-xl border border-primary/20 bg-primary/5 p-4 dark:border-primary-dark/30 dark:bg-primary-dark/10">
              <p className="flex items-center gap-2 text-sm font-bold text-primary dark:text-primary-dark">
                <i className="fa-solid fa-circle-check" aria-hidden />
                {section.heading}
              </p>
              <div className="mt-3 space-y-2.5">
                <NoteBody blocks={section.body} />
              </div>
            </div>
          )
        }
        // Key takeaways -> accent-tinted callout box.
        if (heading.includes('takeaway')) {
          return (
            <div key={index} className="rounded-xl border border-accent/25 bg-accent/5 p-4 dark:border-accent-dark/30 dark:bg-accent-dark/10">
              <p className="flex items-center gap-2 text-sm font-bold text-accent dark:text-accent-dark">
                <i className="fa-solid fa-lightbulb" aria-hidden />
                {section.heading}
              </p>
              <div className="mt-3 space-y-2.5">
                <NoteBody blocks={section.body} />
              </div>
            </div>
          )
        }
        return (
          <div key={index}>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone-900 dark:text-stone-100">
              <span className="h-1 w-6 rounded-full bg-primary/60 dark:bg-primary-dark/60" aria-hidden />
              {section.heading}
            </h3>
            <div className="mt-3 space-y-3">
              <NoteBody blocks={section.body} />
            </div>
          </div>
        )
      })}
    </div>
  )
}