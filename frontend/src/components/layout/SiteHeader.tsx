import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-md px-3 py-2 text-sm font-semibold transition',
    isActive ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-100',
  ].join(' ')

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-primary">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm text-white">
            <i className="fa-solid fa-graduation-cap" aria-hidden />
          </span>
          <span className="text-lg text-slate-900">COURSER</span>
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
          <Link
            to="/auth"
            className="text-sm font-semibold text-slate-700 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Log in
          </Link>
          <Link
            to="/auth?mode=signup"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Sign up
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-800 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-bars'} text-xl`} aria-hidden />
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-slate-100 bg-white px-4 py-4 md:hidden"
        >
          <div className="flex flex-col gap-2">
            <NavLink
              to="/"
              end
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-semibold text-slate-800 hover:bg-slate-50"
            >
              <i className="fa-solid fa-house mr-2 text-primary" aria-hidden />
              Home
            </NavLink>
            <NavLink
              to="/courses"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-semibold text-slate-800 hover:bg-slate-50"
            >
              <i className="fa-solid fa-book-open mr-2 text-primary" aria-hidden />
              Courses
            </NavLink>
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg border border-slate-200 px-3 py-2 text-center text-base font-semibold text-slate-800 hover:bg-slate-50"
            >
              Log in
            </Link>
            <Link
              to="/auth?mode=signup"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-accent px-3 py-2 text-center text-base font-semibold text-white"
            >
              Sign up
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}
