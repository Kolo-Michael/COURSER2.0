// ─── FloatingBubbles: ambient blurred background bubbles ─────────────────
// A few large, heavily blurred gradient circles drift behind the page. They
// sit at z-index: -1 (painted below all content) so every frosted surface —
// `.courser-card`, `.courser-glass`, the sticky header — blurs them through
// its backdrop-filter, which keeps the glassmorphism effect intact instead of
// letting the bubbles sit on top. Purely decorative (pointer-events: none)
// and disabled under prefers-reduced-motion.

// One bubble: physical size/position + color + motion. `left`/`top` are
// percentages of the fixed viewport layer; negative values push bubbles
// partly off-screen so edges never look cropped. Kept to exactly six,
// small, and green so they stay subtle behind the frosted surfaces.
type BubbleSpec = {
  size: number
  top: string
  left: string
  color: string
  opacity: number
  duration: string
  delay: string
}

const BUBBLES: BubbleSpec[] = [
  { size: 150, top: '-4%', left: '-6%', color: 'radial-gradient(circle at 30% 30%, #A7F3D0, #059669)', opacity: 0.4, duration: '18s', delay: '0s' },
  { size: 120, top: '28%', left: '78%', color: 'radial-gradient(circle at 60% 40%, #6EE7B7, #10B981)', opacity: 0.35, duration: '15s', delay: '-4s' },
  { size: 96, top: '62%', left: '-4%', color: 'radial-gradient(circle at 40% 60%, #86EFAC, #16A34A)', opacity: 0.32, duration: '20s', delay: '-8s' },
  { size: 140, top: '74%', left: '70%', color: 'radial-gradient(circle at 30% 30%, #A7F3D0, #059669)', opacity: 0.3, duration: '17s', delay: '-2s' },
  { size: 80, top: '8%', left: '48%', color: 'radial-gradient(circle at 50% 50%, #D1FAE5, #34D399)', opacity: 0.28, duration: '22s', delay: '-12s' },
  { size: 110, top: '44%', left: '34%', color: 'radial-gradient(circle at 50% 50%, #6EE7B7, #10B981)', opacity: 0.25, duration: '19s', delay: '-6s' },
]

/** Renders the ambient bubble layer; safe to mount once per page. */
export function FloatingBubbles() {
  return (
    <div className="floating-bubbles" aria-hidden="true">
      {BUBBLES.map((bubble, index) => (
        <span
          key={index}
          className="bubble"
          style={{
            width: bubble.size,
            height: bubble.size,
            top: bubble.top,
            left: bubble.left,
            background: bubble.color,
            opacity: bubble.opacity,
            animationDuration: bubble.duration,
            animationDelay: bubble.delay,
          }}
        />
      ))}
    </div>
  )
}