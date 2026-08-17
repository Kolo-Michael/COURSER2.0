// ─── ThreeDVisual.tsx : landing-page "3D image" ──────────────────────────
// A perspective scene of frosted cards stacked along the Z axis — a course
// card, a certificate, and a Cora chat bubble — each floating gently. On
// desktop the whole stage tilts toward the cursor, so it behaves like a
// little 3D showcase with no external images or libraries (pure CSS 3D).
import { useRef, useState } from 'react'

type Tilt = { rx: number; ry: number }

// Applied when the pointer leaves the scene — ease the stage back to flat.
const REST: Tilt = { rx: 0, ry: 0 }

/** A card positioned in 3D space (outer) with its own float animation (inner). */
function FloatCard({
  className,
  z,
  children,
}: {
  className: string
  z: number
  children: React.ReactNode
}) {
  return (
    <div
      className={`absolute ${className}`}
      style={{ transform: `translateX(-50%) translateZ(${z}px)` }}
    >
      <div className="float3d">{children}</div>
    </div>
  )
}

/** Floating course-card stack rendered inside a perspective scene. */
export function ThreeDVisual() {
  const sceneRef = useRef<HTMLDivElement | null>(null)
  const [tilt, setTilt] = useState<Tilt>(REST)

  // Tilt the stage toward the cursor (desktop only, ~max 16deg total).
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = sceneRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ rx: -py * 16, ry: px * 16 })
  }

  return (
    <div
      ref={sceneRef}
      onMouseMove={handleMove}
      onMouseLeave={() => setTilt(REST)}
      className="scene3d tilt-3d relative mx-auto w-full max-w-lg select-none lg:max-w-none"
      aria-hidden="true"
    >
      <div
        className="stage3d relative flex h-[460px] items-center justify-center sm:h-[500px]"
        style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
      >
        {/* Back layer: certificate, deepest in Z. */}
        <FloatCard className="left-1/2 top-8 w-72" z={-70}>
          <div className="rounded-2xl border border-stone-200/80 bg-white/80 p-5 shadow-lg backdrop-blur-md dark:border-stone-600/60 dark:bg-stone-900/70">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-400 dark:text-stone-500">
              <span>CERTIFICATE</span>
              <i className="fa-solid fa-award text-accent-fg dark:text-accent-dark" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-bold text-stone-900 dark:text-stone-100">Course completed</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
              <div className="h-full w-full rounded-full bg-accent dark:bg-accent-dark" />
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <i className="fa-solid fa-check-circle text-primary dark:text-primary-dark" aria-hidden="true" />
              Verified progress
            </div>
          </div>
        </FloatCard>

        {/* Middle layer: progress card, mid-Z. */}
        <FloatCard className="left-1/2 top-32 w-80" z={-20}>
          <div className="rounded-2xl border border-stone-200/80 bg-white/85 p-5 shadow-lg backdrop-blur-md dark:border-stone-600/60 dark:bg-stone-900/70">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary dark:bg-primary-dark/15 dark:text-primary-dark">
                <i className="fa-solid fa-book-open" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">AI Tutor Foundations</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Module 2 of 3 · 68%</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
              <div className="h-full w-[68%] rounded-full bg-primary dark:bg-primary-dark" />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>Keep going — you are close!</span>
              <span className="font-semibold text-primary dark:text-primary-dark">Resume</span>
            </div>
          </div>
        </FloatCard>

        {/* Front layer: Cora chat bubble, nearest Z. */}
        <FloatCard className="bottom-6 left-1/2 w-80" z={70}>
          <div className="rounded-2xl border border-stone-200/80 bg-white/85 p-5 shadow-lg backdrop-blur-md dark:border-stone-600/60 dark:bg-stone-900/70">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/20 dark:bg-primary-dark/15 dark:text-primary-dark dark:ring-primary-dark/30">
                <i className="fa-solid fa-robot" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">Cora</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Your AI tutor · online</p>
              </div>
            </div>
            <p className="mt-3 rounded-xl rounded-tl-sm bg-stone-100 px-3 py-2 text-xs leading-relaxed text-stone-700 dark:bg-stone-800 dark:text-stone-200">
              Need a nudge? Ask me anything about the module — I have the lesson notes loaded.
            </p>
          </div>
        </FloatCard>
      </div>
    </div>
  )
}