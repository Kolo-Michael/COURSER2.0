// ─── preferences.ts : dashboard nav layout preferences ──────────────────
// Read/write the user's navigation preference (sidebar vs floating nav,
// and whether the sidebar starts collapsed). Values live both in
// localStorage (immediate, offline-safe) and on the account via
// updateProfile() so the choice follows the user across devices.
//
// Priority: the account value carried in the courser_session cookie wins,
// then the local fallback.
import { updateProfile, type NavStyle } from '@/api/auth'
import { getSession } from '@/auth/session'

export const NAV_STYLE_KEY = 'courser.nav.style'
export const NAV_COLLAPSED_KEY = 'courser.nav.collapsed'

/** Read a localStorage value, falling back when missing or unparsable. */
function read<T>(key: string, fallback: T, parse: (raw: string) => T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return parse(raw)
  } catch {
    return fallback
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // localStorage may be unavailable (private mode) — ignore.
  }
}

/**
 * Navigation layout preference: 'sidebar' (default) or a floating
 * collapsible nav bar. The value saved on the account (via the
 * courser_session cookie) takes priority so the choice follows the user
 * across devices; the local copy covers the current session immediately.
 */
export function getNavStyle(): NavStyle {
  const session = getSession()
  if (session?.navStyle === 'floating' || session?.navStyle === 'sidebar') {
    return session.navStyle
  }
  return read<NavStyle>(NAV_STYLE_KEY, 'sidebar', (raw) => (raw === 'floating' ? 'floating' : 'sidebar'))
}

export function setNavStyle(style: NavStyle) {
  write(NAV_STYLE_KEY, style)
  // Best-effort persistence to the backend — never block the UI on it.
  updateProfile({ nav_style: style }).catch(() => {})
}

export function getNavCollapsed(): boolean {
  const session = getSession()
  if (typeof session?.navCollapsed === 'boolean') {
    return session.navCollapsed
  }
  return read<boolean>(NAV_COLLAPSED_KEY, false, (raw) => raw === 'true')
}

export function setNavCollapsed(collapsed: boolean) {
  write(NAV_COLLAPSED_KEY, String(collapsed))
  updateProfile({ nav_collapsed: collapsed }).catch(() => {})
}
