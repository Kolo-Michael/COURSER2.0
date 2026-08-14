// ─── SiteHeader.tsx : sticky marketing header ───────────────────────────
// Brand link, primary nav (Home / Courses), theme toggle, and Login /
// Sign-up actions. Desktop shows nav inline; a hamburger toggles the
// mobile-only dropdown panel.
import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'

/** Shared nav-link styling: active route is filled, others are subtle. */
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-md px-3 py-2 text-sm font-semibold transition',
    isActive
      ? 'bg-primary text-white dark:bg-primary-dark dark:text-white'
      : 'text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800',
  ].join(' ')

/** Frosted sticky header for the public site, with a mobile menu. */
export function SiteHeader() {
  // open: controls the mobile dropdown menu (hidden on md+ screens).
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-white/75 shadow-sm backdrop-blur-xl dark:border-stone-700/60 dark:bg-stone-950/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-2 py-3 sm:px-3 lg:px-4">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm text-white dark:bg-primary-dark">
            <i className="fa-solid fa-graduation-cap" aria-hidden />
          </span>
          <span className="text-lg text-stone-900 dark:text-stone-100">COURSER</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/courses" className={navLinkClass}>
            Courses
          </NavLink>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link
            to="/auth"
            className="text-sm font-semibold text-stone-700 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-stone-200 dark:hover:text-primary-dark"
          >
            Log in
          </Link>
          <Link
            to="/auth?mode=signup"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:bg-accent-dark"
          >
            Sign up
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-stone-200 p-2 text-stone-800 dark:border-stone-700 dark:text-stone-200"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-bars'} text-xl`} aria-hidden />
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-stone-200/70 bg-white/90 px-4 py-4 backdrop-blur-xl dark:border-stone-700/60 dark:bg-stone-950/90 md:hidden"
        >
          <div className="flex flex-col gap-2">
            <NavLink
              to="/"
              end
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-semibold text-stone-800 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              <i className="fa-solid fa-house mr-2 text-primary dark:text-primary-dark" aria-hidden />
              Home
            </NavLink>
            <NavLink
              to="/courses"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-semibold text-stone-800 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              <i className="fa-solid fa-book-open mr-2 text-primary dark:text-primary-dark" aria-hidden />
              Courses
            </NavLink>
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg border border-stone-200 px-3 py-2 text-center text-base font-semibold text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Log in
            </Link>
            <Link
              to="/auth?mode=signup"
              className="rounded-lg bg-accent px-3 py-2 text-center text-base font-semibold text-white dark:bg-accent-dark"
            >
              Sign up
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}
