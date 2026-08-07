import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { logout } from '@/api/auth'
import { getSession, clearSession } from '@/auth/session'
import { ThemeToggle } from '@/components/ThemeToggle'

export type DashboardNavItem = {
  to: string
  label: string
  iconClass: string
}

type DashboardLayoutProps = {
  title: string
  subtitle?: string
  navItems: DashboardNavItem[]
  children: ReactNode
}

export function DashboardLayout({
  title,
  subtitle,
  navItems,
  children,
}: DashboardLayoutProps) {
  const [open, setOpen] = useState(false)
  const session = getSession()
  const displayName = session?.identifier || 'User'

  const utilityLinks = [
    { to: '/courses', label: 'Browse catalog', iconClass: 'fa-solid fa-magnifying-glass' },
  ]

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
      isActive
        ? 'bg-primary text-white shadow-sm dark:bg-primary-dark'
        : 'text-stone-700 hover:bg-primary/10 hover:text-primary dark:text-stone-200 dark:hover:bg-stone-800/80 dark:hover:text-white',
    ].join(' ')

  return (
    <div className="courser-bg-dots min-h-screen bg-stone-50/60 text-stone-900 dark:bg-stone-950/40 dark:text-stone-100">
      <div className="flex min-h-screen gap-0 lg:gap-4 lg:p-4">
        <aside
          className={[
            'fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-stone-200/70 bg-white/75 shadow-xl backdrop-blur-xl transition-transform duration-200 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:translate-x-0 lg:overflow-hidden lg:rounded-xl lg:border lg:shadow-sm dark:border-stone-700/60 dark:bg-stone-900/50',
            open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}
          aria-label="Sidebar navigation"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-stone-100 px-4 dark:border-stone-800">
            <Link to="/" className="flex items-center gap-2 font-bold text-primary">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
                <i className="fa-solid fa-graduation-cap" aria-hidden />
              </span>
              <span>COURSER</span>
            </Link>
          </div>

          <div className="mx-3 mt-3 rounded-xl border border-stone-200/70 bg-white/60 p-3 backdrop-blur-md dark:border-stone-700/60 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-white dark:bg-primary-dark">
                <i className="fa-solid fa-user" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-50">{displayName}</p>
                <p className="truncate text-xs text-stone-500 dark:text-stone-400">{session?.role === 'super_admin' ? 'Owner' : session?.role ?? 'Learner'}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
              Menu
            </p>
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard' || item.to === '/admin' || item.to === '/super-admin' || item.to === '/' || item.to === '/courses' || item.to === '/streak'}
                  className={navLinkClass}
                >
                  <i className={`${item.iconClass} w-5 text-center`} aria-hidden />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            <p className="mt-6 px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
              Discover
            </p>
            <div className="flex flex-col gap-1">
              {utilityLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/' || item.to === '/courses'}
                  className={navLinkClass}
                >
                  <i className={`${item.iconClass} w-5 text-center`} aria-hidden />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </nav>

          <div className="mx-4 mb-4 rounded-lg bg-white/60 p-4 backdrop-blur-sm dark:bg-white/5">
            <p className="text-xs font-semibold uppercase text-primary">Cora assistant</p>
            <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">Available inside every learning environment.</p>
          </div>
        </aside>

        {open ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-stone-900/40 lg:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 m-3 flex min-h-16 items-center justify-between rounded-xl border border-stone-200/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-xl sm:mx-4 sm:px-6 lg:top-4 lg:mx-0 lg:mt-0 dark:border-stone-700/60 dark:bg-stone-900/50">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex rounded-lg border border-stone-200 p-2 text-stone-800 lg:hidden dark:border-stone-700 dark:text-stone-200"
                aria-expanded={open}
                aria-label={open ? 'Close navigation' : 'Open navigation'}
                onClick={() => setOpen((v) => !v)}
              >
                <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-bars'} text-xl`} aria-hidden />
              </button>
              <div>
                <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100">{title}</h1>
                {subtitle ? <p className="text-xs text-stone-500 dark:text-stone-400">{subtitle}</p> : null}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {session?.role === 'student' ? (
                <NavLink
                  to="/streak"
                  className={({ isActive }) =>
                    [
                      'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-accent transition hover:bg-accent/10 dark:border-stone-700',
                      isActive ? 'bg-accent/10' : '',
                    ].join(' ')
                  }
                  aria-label="Learning streak"
                  title="Learning streak"
                >
                  <i className="fa-solid fa-fire text-lg" aria-hidden />
                </NavLink>
              ) : null}
              <ThemeToggle />
              <button
                type="button"
                onClick={async () => {
                  try {
                    await logout()
                  } finally {
                    clearSession()
                    window.location.assign('/auth')
                  }
                }}
                className="hidden text-sm font-semibold text-stone-600 hover:text-primary sm:inline dark:text-stone-300"
              >
                <i className="fa-solid fa-right-from-bracket mr-1" aria-hidden />
                Log out
              </button>
            </div>
          </header>

          <main className="flex-1 px-3 pb-4 sm:px-4 sm:pb-6 lg:px-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
