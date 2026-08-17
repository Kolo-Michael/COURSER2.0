// ─── lessonNotes.tsx : structured study-notes renderer ─────────────────────
// Parses the seeded markdown-style lesson notes and renders them as friendly,
// highly readable study material:
//   `## Heading`   section headers — `#`…`######` all supported, deeper
//                  levels nest inside shallower ones
//   `- item`      unordered list  |  `1. item` ordered list
//   ``` fenced ``` code block (also indented-free, starts with triple backtick)
//   **bold**      inline emphasis | `code` inline monospace
//   plain lines   paragraphs
// The same text powers the mobile app (its parser mirrors this grammar), so
// keep the vocabulary above stable when editing content.

import type { ReactNode } from 'react'
import { useMemo } from 'react'

// Parsed note hierarchy: sections (with a heading level) own nested body
// blocks; body blocks are paragraphs, (ordered/unordered) lists, or fenced
// code blocks (with an optional language tag like ```html).
export type NoteBlock =
  | { kind: 'section'; level: number; heading: string; body: NoteBlock[] }
  | { kind: 'para'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'code'; code: string; lang?: string }

export type NoteCodeBlock = Extract<NoteBlock, { kind: 'code' }>

// A fenced code line: three backticks with an optional language tag (```, ```html, ```css, …).
const FENCE = /^```([a-zA-Z0-9_-]*)\s*$/

/** Split lesson notes into structured blocks. Heading lines (`#`…`######`)
 *  open sections — a deeper level nests inside the previous one, a shallower
 *  level pops back up. `- ` / `1. ` runs accumulate into lists, triple-backtick
 *  lines wrap a code block, and anything else is a paragraph. */
export function parseNotes(content: string): NoteBlock[] {
  const blocks: NoteBlock[] = []
  let open: NoteBlock[] = blocks
  const sectionStack: { level: number; body: NoteBlock[] }[] = []
  let list: { kind: 'list'; ordered: boolean; items: string[] } | null = null
  let codeLines: string[] | null = null
  let codeLang: string | undefined
  const flushList = () => {
    if (list) {
      open.push(list)
      list = null
    }
  }
  for (const raw of (content ?? '').split('\n')) {
    const line = raw.trim()
    // Inside a fenced block: collect until the closing ```.
    if (codeLines) {
      if (FENCE.test(line)) {
        open.push({ kind: 'code', code: codeLines.join('\n'), lang: codeLang })
        codeLines = null
        codeLang = undefined
      } else {
        codeLines.push(line)
      }
      continue
    }
    const fence = line.match(FENCE)
    if (fence) {
      flushList()
      codeLines = []
      codeLang = fence[1] || undefined
      continue
    }
    if (!line) {
      flushList()
      continue
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      flushList()
      const level = heading[1].length
      // Pop sections deeper than or equal to this level so shallower headings
      // become siblings rather than children.
      while (sectionStack.length && sectionStack[sectionStack.length - 1].level >= level) {
        sectionStack.pop()
      }
      const parent = sectionStack.length ? sectionStack[sectionStack.length - 1].body : blocks
      const section: NoteBlock = { kind: 'section', level, heading: heading[2], body: [] }
      parent.push(section)
      sectionStack.push(section)
      open = section.body
      continue
    }
    const ordered = line.match(/^(\d+)[.)]\s+(.+)$/)
    const bullet = line.match(/^[-*]\s+(.+)$/)
    if (bullet) {
      if (!list || list.ordered) {
        flushList()
        list = { kind: 'list', ordered: false, items: [] }
        open.push(list)
      }
      list.items.push(bullet[1])
      continue
    }
    if (ordered) {
      if (!list || !list.ordered) {
        flushList()
        list = { kind: 'list', ordered: true, items: [] }
        open.push(list)
      }
      list.items.push(ordered[2])
      continue
    }
    flushList()
    open.push({ kind: 'para', text: line })
  }
  flushList()
  // An unclosed fence still deserves its content.
  if (codeLines) open.push({ kind: 'code', code: codeLines.join('\n'), lang: codeLang })
  return blocks
}

/** Render inline markup: **bold** segments and `code` segments inside a line.
 *  Splits on the combined regex; bold parts are odd-index, code parts 3 (mod 4)
 *  from each bold group. A simpler approach: tokenize in two passes. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  const out: ReactNode[] = []
  parts.forEach((part, index) => {
    if (index % 2 === 1) {
      // Bold segment — still may contain `code`.
      out.push(
        <strong key={`${keyPrefix}-b-${index}`} className="font-semibold text-stone-900 dark:text-stone-50">
          {renderCodeInline(part, `${keyPrefix}-bc-${index}`)}
        </strong>,
      )
    } else {
      out.push(...renderCodeInline(part, `${keyPrefix}-p-${index}`))
    }
  })
  return out
}

// Second pass: split `code` spans (backtick-wrapped) into monospace segments.
function renderCodeInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/`([^`]+)`/g)
  const out: ReactNode[] = []
  parts.forEach((part, index) => {
    if (index % 2 === 1) {
      out.push(
        <code
          key={`${keyPrefix}-c-${index}`}
          className="rounded bg-stone-200/70 px-1.5 py-0.5 font-mono text-[0.85em] text-primary dark:bg-stone-800 dark:text-primary-dark"
        >
          {part}
        </code>,
      )
    } else if (part) {
      out.push(part)
    }
  })
  return out
}

// Section headings that get tinted callout treatment (word match, lowercase).
function sectionKind(heading: string): 'quiz' | 'takeaway' | 'plain' {
  const h = heading.trim().toLowerCase()
  if (h.includes('check your understanding')) return 'quiz'
  if (h.includes('takeaway')) return 'takeaway'
  return 'plain'
}

// Heading element + sizing for a given markdown heading level.
function Heading({ level, children }: { level: number; children: ReactNode }) {
  const Tag = (level <= 2 ? 'h3' : level === 3 ? 'h4' : 'h5') as 'h3' | 'h4' | 'h5'
  const sizing =
    level <= 2
      ? 'text-[15px]'
      : level === 3
        ? 'text-sm'
        : 'text-[13px] uppercase tracking-wide text-stone-500 dark:text-stone-400'
  return (
    <Tag className={`flex items-center gap-2.5 font-bold text-stone-900 dark:text-stone-50 ${sizing}`}>
      <span className="h-1.5 w-7 shrink-0 rounded-full bg-primary/70 dark:bg-primary-dark/70" aria-hidden />
      {children}
    </Tag>
  )
}

// Recursively render any block tree — sections call back into this renderer so
// headings/subheadings stay nested and the original document order is kept.
function NoteBody({ blocks }: { blocks: NoteBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.kind === 'para') {
          return (
            <p key={index} className="text-[15px] leading-7 text-stone-700 dark:text-stone-200">
              {renderInline(block.text, `p-${index}`)}
            </p>
          )
        }
        if (block.kind === 'code') {
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-xl border border-stone-800 bg-stone-900 p-4 font-mono text-sm leading-6 text-stone-100 dark:border-stone-700 dark:bg-black/60"
            >
              <code>{block.code}</code>
            </pre>
          )
        }
        if (block.kind === 'list') {
          const items = block.items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-3 text-[15px] leading-7 text-stone-700 dark:text-stone-200">
              <span
                className={`mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full ${block.ordered ? 'bg-accent' : 'bg-primary/60 dark:bg-primary-dark/60'}`}
                aria-hidden
              />
              <span>{renderInline(item, `i-${index}-${itemIndex}`)}</span>
            </li>
          ))
          return (
            <ul key={index} className="space-y-1.5">
              {items}
            </ul>
          )
        }
        if (block.kind === 'section') {
          const kind = sectionKind(block.heading)
          if (kind === 'quiz') {
            return (
              <div key={index} className="rounded-2xl border border-primary/20 bg-primary/5 p-5 dark:border-primary-dark/30 dark:bg-primary-dark/10">
                <p className="flex items-center gap-2.5 text-sm font-bold text-primary dark:text-primary-dark">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs dark:bg-primary-dark/20">
                    <i className="fa-solid fa-circle-check" aria-hidden />
                  </span>
                  {block.heading}
                </p>
                <div className="mt-3 space-y-3">
                  <NoteBody blocks={block.body} />
                </div>
              </div>
            )
          }
          if (kind === 'takeaway') {
            return (
              <div key={index} className="rounded-2xl border border-accent/25 bg-accent/5 p-5 dark:border-accent-dark/30 dark:bg-accent-dark/10">
                <p className="flex items-center gap-2.5 text-sm font-bold text-primary dark:text-primary-dark">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs dark:bg-accent-dark/20">
                    <i className="fa-solid fa-lightbulb" aria-hidden />
                  </span>
                  {block.heading}
                </p>
                <div className="mt-3 space-y-3">
                  <NoteBody blocks={block.body} />
                </div>
              </div>
            )
          }
          return (
            <div key={index}>
              <Heading level={block.level}>{block.heading}</Heading>
              <div className="mt-3 space-y-3.5">
                <NoteBody blocks={block.body} />
              </div>
            </div>
          )
        }
        return null
      })}
    </>
  )
}

/** Render a lesson's organized study notes. Top-level paragraphs render first,
 *  then headings/sections in document order — "Check your understanding" and
 *  key-takeaway sections become tinted callout boxes, everything else renders
 *  as readable sections with nested subheadings preserved. */
export function LessonNotes({ content }: { content: string }) {
  const blocks = useMemo(() => parseNotes(content), [content])
  if (!blocks.length) {
    return <p className="text-sm text-stone-500 dark:text-stone-400">This lesson has no written notes yet — check back soon.</p>
  }

  return (
    <div className="space-y-6">
      <NoteBody blocks={blocks} />
    </div>
  )
}