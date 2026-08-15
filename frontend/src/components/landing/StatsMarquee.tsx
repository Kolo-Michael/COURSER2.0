// ─── StatsMarquee: right-to-left scrolling stats strip ───────────────────
// Turns the hero's three marketing numbers into a seamless marquee. The
// track holds two identical halves (each half repeats the cards twice so
// wide screens stay full); animating translateX(0 → -50%) scrolls the strip
// from right to left. It pauses on hover and disables itself under
// prefers-reduced-motion (see `marquee-left` in index.css).

// Shape of one marketing stat shown in the strip.
export type Stat = {
  label: string
  value: string
  detail: string
}

// A single frosted card; fixed width keeps the strip dense while scrolling.
function StatCard({ stat }: { stat: Stat }) {
  return (
    <div className="courser-card w-64 shrink-0 p-4 sm:w-72">
      <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{stat.value}</p>
      <p className="mt-1 text-sm font-semibold text-stone-800 dark:text-stone-100">{stat.label}</p>
      <p className="mt-1 text-xs leading-relaxed text-stone-500 dark:text-stone-400">{stat.detail}</p>
    </div>
  )
}

// One half of the loop: the stats repeated twice so the strip never runs
// out of cards on large screens. `pr-4` keeps item spacing consistent
// across the seam between the two halves.
function StatGroup({ stats, prefix }: { stats: Stat[]; prefix: string }) {
  return (
    <div className="flex gap-4 pr-4">
      {stats.map((stat, index) => (
        <StatCard key={`${prefix}-${stat.label}-${index}`} stat={stat} />
      ))}
      {stats.map((stat, index) => (
        <StatCard key={`${prefix}-dup-${stat.label}-${index}`} stat={stat} />
      ))}
    </div>
  )
}

// StatsMarquee: the scrolling strip. The second half is duplicated and
// hidden from assistive tech — it only exists to make the loop seamless.
export function StatsMarquee({ stats }: { stats: Stat[] }) {
  return (
    <div className="stats-marquee" role="region" aria-label="Course stats">
      <div className="stats-marquee-track">
        <StatGroup stats={stats} prefix="a" />
        <div aria-hidden="true">
          <StatGroup stats={stats} prefix="b" />
        </div>
      </div>
    </div>
  )
}