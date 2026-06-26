import { useEffect, useRef } from 'react'
import { useTheme } from '@/theme'

/**
 * Auth-page study animation: floating book / pencil / graduation-cap icons
 * with a soft dot grid backdrop. Reduced palette — only blue and orange,
 * matching the AnimatedBackground on the public pages.
 */
export function StudyAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let width = 0
    let height = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawDots()
    }

    const drawDots = () => {
      ctx.clearRect(0, 0, width, height)
      const step = 36
      ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.10)' : 'rgba(15, 23, 42, 0.06)'
      for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y += step) {
          ctx.beginPath()
          ctx.arc(x, y, 1.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    resize()
    window.addEventListener('resize', resize)

    // Subtle parallax on the floating icons
    const icons = document.querySelectorAll<HTMLElement>('[data-study-icon]')
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const dx = (e.clientX - cx) / cx
      const dy = (e.clientY - cy) / cy
      icons.forEach((el) => {
        const depth = Number(el.dataset.depth ?? '10')
        el.style.transform = `translate3d(${dx * depth}px, ${dy * depth}px, 0)`
      })
    }
    window.addEventListener('mousemove', onMove)

    raf = window.requestAnimationFrame(() => {
      // No continuous animation needed — purely CSS-driven
    })

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [isDark])

  const icons: Array<{
    icon: string
    depth: number
    className: string
    delay?: string
  }> = [
    {
      icon: 'fa-solid fa-book',
      depth: 18,
      className: 'top-[12%] left-[8%] text-5xl text-accent/40 dark:text-accent-dark/40',
      delay: 'animation-delay-0',
    },
    {
      icon: 'fa-solid fa-pencil',
      depth: 24,
      className: 'top-[18%] right-[10%] text-4xl text-primary/40 rotate-[18deg] dark:text-primary-dark/40',
      delay: 'animation-delay-2000',
    },
    {
      icon: 'fa-solid fa-graduation-cap',
      depth: 14,
      className: 'bottom-[14%] left-[12%] text-6xl text-accent/35 dark:text-accent-dark/35',
      delay: 'animation-delay-4000',
    },
    {
      icon: 'fa-solid fa-lightbulb',
      depth: 20,
      className: 'bottom-[22%] right-[14%] text-4xl text-accent/45 dark:text-accent-dark/45',
      delay: 'animation-delay-2000',
    },
    {
      icon: 'fa-solid fa-flask',
      depth: 10,
      className: 'top-[55%] left-[4%] text-3xl text-primary/35 dark:text-primary-dark/35',
      delay: 'animation-delay-4000',
    },
    {
      icon: 'fa-solid fa-globe',
      depth: 16,
      className: 'top-[40%] right-[5%] text-4xl text-primary/40 dark:text-primary-dark/40',
      delay: 'animation-delay-0',
    },
  ]

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
    >
      {/* Background dot grid */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Soft floating color blobs (blue + orange only) */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent/15 blur-3xl animate-blob dark:bg-accent-dark/20" />
      <div className="animation-delay-2000 absolute top-1/2 -right-32 h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-3xl animate-blob dark:bg-primary-dark/25" />
      <div className="animation-delay-4000 absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-blob dark:bg-accent-dark/15" />

      {/* Floating study icons (parallax on mousemove) */}
      {icons.map((item) => (
        <div
          key={item.icon}
          data-study-icon
          data-depth={item.depth}
          className={`absolute transition-transform duration-200 ease-out will-change-transform ${item.className}`}
          style={{ animation: `float 9s ease-in-out infinite ${item.delay ?? ''}` }}
        >
          <i className={item.icon} aria-hidden />
        </div>
      ))}

      <style>{`
        @keyframes float {
          0%, 100% { translate: 0 0; }
          50% { translate: 0 -16px; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-study-icon] { animation: none !important; }
        }
      `}</style>
    </div>
  )
}