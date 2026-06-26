import { Link } from 'react-router-dom'

const productLinks = [
  { label: 'Courses', to: '/courses' },
  { label: 'Create account', to: '/auth?mode=signup' },
  { label: 'Sign in', to: '/auth?mode=login' },
]

const resourceLinks = [
  { label: 'Learning tracks', to: '/courses' },
  { label: 'AI course builder', to: '/courses' },
  { label: 'Admin console', to: '/auth?mode=login' },
]

const socialLinks = [
  { label: 'Twitter', icon: 'fa-brands fa-x-twitter', href: '#' },
  { label: 'GitHub', icon: 'fa-brands fa-github', href: '#' },
  { label: 'LinkedIn', icon: 'fa-brands fa-linkedin-in', href: '#' },
  { label: 'YouTube', icon: 'fa-brands fa-youtube', href: '#' },
]

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-slate-200 bg-slate-950 text-slate-300">
      {/* Decorative gradient accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 right-1/4 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Brand column */}
          <div className="md:col-span-5">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-lg">
                <i className="fa-solid fa-graduation-cap" aria-hidden />
              </span>
              <span className="text-lg font-bold tracking-wide text-white">COURSER</span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              AI-assisted learning paths with the structure learners expect — from discovery to
              enrollment and progress, all in one workspace with Cora, your built-in study companion.
            </p>

            {/* Newsletter */}
            <form
              className="mt-6 flex max-w-md overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60 backdrop-blur"
              onSubmit={(e) => e.preventDefault()}
            >
              <label htmlFor="footer-newsletter" className="sr-only">
                Email address
              </label>
              <input
                id="footer-newsletter"
                type="email"
                placeholder="you@email.com"
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                Subscribe
              </button>
            </form>

            {/* Socials */}
            <div className="mt-5 flex items-center gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900/60 text-slate-400 transition hover:border-primary/60 hover:text-white"
                >
                  <i className={`${s.icon} text-sm`} aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Product
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-slate-400 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Resources
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-slate-400 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="mt-8 text-xs font-semibold uppercase tracking-wider text-slate-200">
              Contact
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <i className="fa-solid fa-envelope text-xs text-primary" aria-hidden />
                <a href="mailto:hello@courser.app" className="hover:text-white">
                  hello@courser.app
                </a>
              </li>
              <li className="flex items-center gap-2">
                <i className="fa-solid fa-location-dot text-xs text-primary" aria-hidden />
                Remote-first team
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>© {year} COURSER. Built for learners, admins, and platform owners.</p>
          <div className="flex items-center gap-4">
            <Link to="/auth?mode=login" className="hover:text-white">
              Privacy
            </Link>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <Link to="/auth?mode=login" className="hover:text-white">
              Terms
            </Link>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
