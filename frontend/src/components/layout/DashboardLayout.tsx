import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { clearSession } from '@/auth/session'

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

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="flex min-h-screen gap-0 lg:gap-4 lg:p-4">
        <aside
          className={[
            'fixed inset-y-0 left-0 z-40 w-72 shrink-0 border-r border-stone-200 bg-white shadow-xl transition-transform duration-200 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:translate-x-0 lg:overflow-hidden lg:rounded-xl lg:border lg:shadow-sm dark:border-stone-800 dark:bg-stone-900',
            open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}
          aria-label="Sidebar navigation"
        >
          <div className="flex h-16 items-center justify-between border-b border-stone-100 px-4 dark:border-stone-800">
            <Link to="/" className="flex items-center gap-2 font-bold text-primary">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
                <i className="fa-solid fa-graduation-cap" aria-hidden />
              </span>
              <span>COURSER</span>
            </Link>
          </div>
          <nav className="flex flex-col gap-1 px-3 py-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-primary hover:text-white dark:text-stone-200"
              >
                <i className={`${item.iconClass} w-5 text-center`} aria-hidden />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mx-4 mt-auto rounded-lg bg-stone-100 p-4 dark:bg-stone-800">
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
          <header className="sticky top-0 z-20 m-3 flex min-h-16 items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm sm:mx-4 sm:px-6 lg:top-4 lg:mx-0 lg:mt-0 dark:border-stone-800 dark:bg-stone-900">
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
            <Link
              to="/auth"
              onClick={clearSession}
              className="hidden text-sm font-semibold text-stone-600 hover:text-primary sm:inline dark:text-stone-300"
            >
              <i className="fa-solid fa-right-from-bracket mr-1" aria-hidden />
              Log out
            </Link>
          </header>

          <main className="flex-1 px-3 pb-4 sm:px-4 sm:pb-6 lg:px-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
