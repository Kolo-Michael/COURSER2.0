// ─── InfoMarquee.tsx : pre-footer moving ticker ──────────────────────────
// A strip of quick facts that continuously scrolls from the left edge to the
// right edge of the page, right before the footer. The track holds two
// identical copies so the loop is seamless (see `marquee-right` in index.css);
// it pauses on hover and disables itself under prefers-reduced-motion.
import { Link } from 'react-router-dom'

const ITEMS = [
  { icon: 'fa-graduation-cap', text: '12+ free courses', to: '/courses' },
  { icon: 'fa-list-check', text: '86 guided lessons', to: '/courses' },
  { icon: 'fa-book-open', text: 'Study notes in every lesson' },
  { icon: 'fa-robot', text: 'Cora AI tutor · 24/7' },
  { icon: 'fa-square-check', text: 'Module quizzes after each lesson block' },
  { icon: 'fa-fire', text: 'Streaks keep you coming back' },
  { icon: 'fa-rocket', text: 'Start learning in under a minute', to: '/auth' },
  { icon: 'fa-heart', text: 'Free forever for students' },
]

function TickerRow({ hidden = false }: { hidden?: boolean }) {
  return (
    <div aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-10 pr-10">
      {ITEMS.map((item) => {
        const content = (
          <span className="inline-flex items-center gap-2.5 whitespace-nowrap text-sm font-medium text-stone-600 dark:text-stone-300">
            <i className={`fa-solid ${item.icon} text-accent dark:text-accent-dark`} aria-hidden="true" />
            {item.text}
          </span>
        )
        return item.to ? (
          <Link key={item.text} to={item.to} className="transition hover:text-stone-900 dark:hover:text-stone-100">
            {content}
          </Link>
        ) : (
          <span key={item.text}>{content}</span>
        )
      })}
    </div>
  )
}

/** Seamless left-to-right ticker rendered directly above the footer. */
export function InfoMarquee() {
  return (
    <section aria-label="Course highlights" className="info-marquee border-t border-stone-200 bg-white/70 py-4 backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/40">
      <div className="info-marquee-track">
        <TickerRow />
        <TickerRow hidden />
      </div>
    </section>
  )
}