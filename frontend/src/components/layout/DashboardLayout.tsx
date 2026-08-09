import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { logout } from '@/api/auth'
import { getSession, clearSession } from '@/auth/session'
import { getNavCollapsed, getNavStyle, setNavCollapsed, setNavStyle } from '@/auth/preferences'
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

function Avatar({
  name,
  src,
  className = 'h-10 w-10',
  iconSize = 'text-sm',
}: {
  name: string
  src?: string | null
  className?: string
  iconSize?: string
}) {
  if (src) {
    return <img src={src} alt={name} className={`${className} shrink-0 rounded-full object-cover ring-1 ring-stone-200 dark:ring-stone-700`} />
  }
  return (
    <span className={`${className} flex shrink-0 items-center justify-center rounded-full bg-primary text-white dark:bg-primary-dark ${iconSize}`}>
      <i className="fa-solid fa-user" aria-hidden />
    </span>
  )
}

export function DashboardLayout({
  title,
  subtitle,
  navItems,
  children,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [navStyle, setNavStyleState] = useState<'sidebar' | 'floating'>(() => getNavStyle())
  const [collapsed, setCollapsedState] = useState<boolean>(() => getNavCollapsed())
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true,
  )
  const [floatingOpen, setFloatingOpen] = useState(false)
  const session = getSession()
  const displayName = session?.identifier || 'User'

  const floatingRef = useRef<HTMLDivElement>(null)

  // Collapsed only applies to the desktop sidebar — the mobile overlay
  // always shows full labels.
  const effectiveCollapsed = collapsed && isDesktop

  // Track viewport so the collapse behaviour doesn't leak into mobile.
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches)
    setIsDesktop(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  // Close the floating panel on outside click / Escape.
  useEffect(() => {
    if (!floatingOpen) return
    const onPointer = (event: PointerEvent) => {
      if (floatingRef.current && !floatingRef.current.contains(event.target as Node)) {
        setFloatingOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFloatingOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [floatingOpen])

  const toggleCollapsed = () => {
    setCollapsedState((prev) => {
      const next = !prev
      setNavCollapsed(next)
      return next
    })
  }

  const switchNavStyle = (style: 'sidebar' | 'floating') => {
    setNavStyleState(style)
    setNavStyle(style)
    setMobileOpen(false)
    setFloatingOpen(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      clearSession()
      window.location.assign('/auth')
    }
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center rounded-lg text-sm font-semibold transition',
      effectiveCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5',
      isActive
        ? 'bg-primary text-white shadow-sm dark:bg-primary-dark'
        : 'text-stone-700 hover:bg-primary/10 hover:text-primary dark:text-stone-200 dark:hover:bg-stone-800/80 dark:hover:text-white',
    ].join(' ')

  const renderNavLinks = (items: DashboardNavItem[], compact = false) => (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/dashboard' || item.to === '/admin' || item.to === '/super-admin' || item.to === '/' || item.to === '/courses' || item.to === '/streak' || item.to === '/settings'}
          className={navLinkClass}
          title={effectiveCollapsed || compact ? item.label : undefined}
          aria-label={effectiveCollapsed || compact ? item.label : undefined}
        >
          <i className={`${item.iconClass} w-5 text-center`} aria-hidden />
          {!effectiveCollapsed && !compact ? <span>{item.label}</span> : null}
        </NavLink>
      ))}
    </div>
  )

  return (
    <div className="courser-bg-dots min-h-screen bg-stone-50/60 text-stone-900 dark:bg-stone-950/40 dark:text-stone-100">
      {navStyle === 'sidebar' ? (
        <div className="flex min-h-screen gap-0 lg:gap-4 lg:p-4">
          <aside
            className={[
              'fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-stone-200/70 bg-white/75 shadow-xl backdrop-blur-xl transition-all duration-200 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-hidden lg:rounded-xl lg:border lg:shadow-sm dark:border-stone-700/60 dark:bg-stone-900/50',
              effectiveCollapsed ? 'w-20 lg:translate-x-0' : 'w-72',
              mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            ].join(' ')}
            aria-label="Sidebar navigation"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-stone-100 px-4 dark:border-stone-800">
              <Link to="/" className="flex items-center gap-2 font-bold text-primary">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                  <i className="fa-solid fa-graduation-cap" aria-hidden />
                </span>
                {!effectiveCollapsed ? <span>COURSER</span> : null}
              </Link>
              <button
                type="button"
                onClick={toggleCollapsed}
                className="hidden rounded-lg border border-stone-200 p-1.5 text-stone-500 transition hover:bg-stone-100 lg:inline-flex dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                aria-label={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <i className={`fa-solid ${effectiveCollapsed ? 'fa-angle-double-right' : 'fa-angle-double-left'} text-sm`} aria-hidden />
              </button>
            </div>

            <div
              className={[
                'mx-3 mt-3 rounded-xl border border-stone-200/70 bg-white/60 p-3 backdrop-blur-md dark:border-stone-700/60 dark:bg-white/5',
                effectiveCollapsed ? 'flex justify-center px-0' : '',
              ].join(' ')}
            >
              <div className={effectiveCollapsed ? '' : 'flex items-center gap-3'}>
                <Avatar name={displayName} src={session?.avatarUrl} />
                {!effectiveCollapsed ? (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-50">{displayName}</p>
                    <p className="truncate text-xs text-stone-500 dark:text-stone-400">{session?.role === 'super_admin' ? 'Owner' : session?.role ?? 'Learner'}</p>
                  </div>
                ) : null}
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {!effectiveCollapsed ? (
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                  Menu
                </p>
              ) : null}
              {renderNavLinks(navItems)}

              {!effectiveCollapsed ? (
                <>
                  <p className="mt-6 px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                    Discover
                  </p>
                  {renderNavLinks([
                    { to: '/courses', label: 'Browse catalog', iconClass: 'fa-solid fa-magnifying-glass' },
                  ])}
                </>
              ) : (
                <div className="mt-6">{renderNavLinks([{ to: '/courses', label: 'Browse', iconClass: 'fa-solid fa-magnifying-glass' }], true)}</div>
              )}
            </nav>

            {!effectiveCollapsed ? (
              <div className="mx-4 mb-4 rounded-lg bg-white/60 p-4 backdrop-blur-sm dark:bg-white/5">
                <p className="text-xs font-semibold uppercase text-primary">Cora assistant</p>
                <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">Available inside every learning environment.</p>
              </div>
            ) : null}
          </aside>

          {mobileOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-30 bg-stone-900/40 lg:hidden"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
          ) : null}

          <div className="flex min-h-screen flex-1 flex-col">
            <header className="sticky top-0 z-20 m-3 flex min-h-16 items-center justify-between rounded-xl border border-stone-200/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-xl sm:mx-4 sm:px-6 lg:top-4 lg:mx-0 lg:mt-0 dark:border-stone-700/60 dark:bg-stone-900/50">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex rounded-lg border border-stone-200 p-2 text-stone-800 lg:hidden dark:border-stone-700 dark:text-stone-200"
                  aria-expanded={mobileOpen}
                  aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
                  onClick={() => setMobileOpen((v) => !v)}
                >
                  <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'} text-xl`} aria-hidden />
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
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    [
                      'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-600 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800',
                      isActive ? 'bg-primary/10 text-primary dark:text-primary-dark' : '',
                    ].join(' ')
                  }
                  aria-label="Settings"
                  title="Settings"
                >
                  <i className="fa-solid fa-gear text-lg" aria-hidden />
                </NavLink>
                <ThemeToggle />
                <button
                  type="button"
                  onClick={handleLogout}
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
      ) : (
        // Floating collapsible nav — no sidebar; a FAB expands the menu.
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 m-3 flex min-h-16 items-center justify-between rounded-xl border border-stone-200/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-xl sm:mx-4 sm:px-6 dark:border-stone-700/60 dark:bg-stone-900/50">
            <div className="flex items-center gap-3">
              <Link to="/" className="hidden items-center gap-2 font-bold text-primary sm:flex">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
                  <i className="fa-solid fa-graduation-cap" aria-hidden />
                </span>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100">{title}</h1>
                {subtitle ? <p className="text-xs text-stone-500 dark:text-stone-400">{subtitle}</p> : null}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {session?.role === 'student' ? (
                <NavLink
                  to="/streak"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-accent transition hover:bg-accent/10 dark:border-stone-700"
                  aria-label="Learning streak"
                  title="Learning streak"
                >
                  <i className="fa-solid fa-fire text-lg" aria-hidden />
                </NavLink>
              ) : null}
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  [
                    'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-600 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800',
                    isActive ? 'bg-primary/10 text-primary dark:text-primary-dark' : '',
                  ].join(' ')
                }
                aria-label="Settings"
                title="Settings"
              >
                <i className="fa-solid fa-gear text-lg" aria-hidden />
              </NavLink>
              <ThemeToggle />
              <button
                type="button"
                onClick={handleLogout}
                className="hidden text-sm font-semibold text-stone-600 hover:text-primary sm:inline dark:text-stone-300"
              >
                <i className="fa-solid fa-right-from-bracket mr-1" aria-hidden />
                Log out
              </button>
            </div>
          </header>

          <main className="flex-1 px-3 pb-24 sm:px-4">{children}</main>

          {/* Floating nav bar */}
          <div ref={floatingRef} className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2">
            {floatingOpen ? (
              <div className="courser-glass min-w-56 rounded-2xl p-3 shadow-xl">
                <div className="mb-2 flex items-center justify-between gap-4 px-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={displayName} src={session?.avatarUrl} className="h-8 w-8" iconSize="text-xs" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-50">{displayName}</p>
                      <p className="truncate text-xs text-stone-500 dark:text-stone-400">{session?.role === 'super_admin' ? 'Owner' : session?.role ?? 'Learner'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => switchNavStyle('sidebar')}
                      title="Switch to side menu"
                      aria-label="Switch to side menu"
                      className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                    >
                      <i className="fa-solid fa-table-columns" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setFloatingOpen(false)}
                      aria-label="Collapse navigation"
                      className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                    >
                      <i className="fa-solid fa-xmark" aria-hidden />
                    </button>
                  </div>
                </div>
                <nav className="flex flex-col gap-1" aria-label="Primary">
                  {[...navItems, { to: '/courses', label: 'Browse catalog', iconClass: 'fa-solid fa-magnifying-glass' }].map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/dashboard' || item.to === '/admin' || item.to === '/super-admin' || item.to === '/' || item.to === '/courses' || item.to === '/streak' || item.to === '/settings'}
                      onClick={() => setFloatingOpen(false)}
                      className={({ isActive }) =>
                        [
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                          isActive
                            ? 'bg-primary text-white shadow-sm dark:bg-primary-dark'
                            : 'text-stone-700 hover:bg-primary/10 hover:text-primary dark:text-stone-200 dark:hover:bg-stone-800/80 dark:hover:text-white',
                        ].join(' ')
                      }
                    >
                      <i className={`${item.iconClass} w-5 text-center`} aria-hidden />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setFloatingOpen((v) => !v)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition hover:brightness-110 dark:bg-primary-dark"
              aria-label={floatingOpen ? 'Collapse navigation' : 'Open navigation'}
              title={floatingOpen ? 'Collapse navigation' : 'Open navigation'}
            >
              <i className={`fa-solid ${floatingOpen ? 'fa-xmark' : 'fa-bars-staggered'} text-xl`} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
