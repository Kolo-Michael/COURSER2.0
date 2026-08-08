import { useState } from 'react'
import { Link } from 'react-router-dom'
import { subscribeNewsletter } from '@/api/courses'

const productLinks = [
  { label: 'Courses', to: '/courses' },
  { label: 'Create account', to: '/auth?mode=signup' },
  { label: 'Sign in', to: '/auth?mode=login' },
]

const resourceLinks = [
  { label: 'Learning tracks', to: '/courses' },
  { label: 'AI course builder', to: '/courses' },
  { label: 'Browse catalog', to: '/courses' },
]

const socialLinks = [
  { label: 'Twitter', icon: 'fa-brands fa-x-twitter', href: '#' },
  { label: 'GitHub', icon: 'fa-brands fa-github', href: '#' },
  { label: 'LinkedIn', icon: 'fa-brands fa-linkedin-in', href: '#' },
  { label: 'YouTube', icon: 'fa-brands fa-youtube', href: '#' },
]

export function SiteFooter() {
  const year = new Date().getFullYear()

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')

  async function handleSubscribe(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    try {
      await subscribeNewsletter(email.trim())
      setStatus('ok')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <footer className="courser-bg-dots relative mt-16 border-t border-stone-800 bg-stone-950 text-stone-300">
      <div className="mx-auto max-w-6xl px-2 py-14 sm:px-3 lg:px-4">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Brand column */}
          <div className="md:col-span-5">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
                <i className="fa-solid fa-graduation-cap" aria-hidden />
              </span>
              <span className="text-lg font-bold tracking-wide text-white">COURSER</span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-400">
              AI-assisted learning paths with the structure learners expect — from discovery to
              enrollment and progress, all in one workspace with Cora, your built-in study companion.
            </p>

            {/* Newsletter */}
            <form
              className="mt-6 flex max-w-md overflow-hidden rounded-lg border border-stone-800 bg-stone-900"
              onSubmit={handleSubscribe}
            >
              <label htmlFor="footer-newsletter" className="sr-only">
                Email address
              </label>
              <input
                id="footer-newsletter"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                disabled={status === 'sending'}
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-stone-500 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === 'sending'}
                className="bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
              >
                {status === 'sending' ? '…' : 'Subscribe'}
              </button>
            </form>
            {status === 'ok' ? (
              <p className="mt-2 text-xs font-semibold text-green-400">Subscribed.</p>
            ) : null}
            {status === 'error' ? (
              <p className="mt-2 text-xs font-semibold text-red-400">Couldn't subscribe. Try again.</p>
            ) : null}

            {/* Socials */}
            <div className="mt-5 flex items-center gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-400 transition hover:border-primary/60 hover:text-white"
                >
                  <i className={`${s.icon} text-sm`} aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-200">
              Product
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-stone-400 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-200">
              Resources
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-stone-400 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="mt-8 text-xs font-semibold uppercase tracking-wider text-stone-200">
              Contact
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-stone-400">
              <li className="flex items-center gap-2">
                <i className="fa-solid fa-envelope text-xs text-accent" aria-hidden />
                <a href="mailto:hello@courser.app" className="hover:text-white">
                  hello@courser.app
                </a>
              </li>
              <li className="flex items-center gap-2">
                <i className="fa-solid fa-location-dot text-xs text-accent" aria-hidden />
                Remote-first team
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-stone-800 pt-6 text-xs text-stone-500 sm:flex-row">
          <p>© {year} COURSER. Built for learners who want clear, structured paths to skill up.</p>
          <div className="flex items-center gap-4">
            <Link to="/auth?mode=login" className="hover:text-white">
              Privacy
            </Link>
            <span className="h-1 w-1 rounded-full bg-stone-700" />
            <Link to="/auth?mode=login" className="hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
