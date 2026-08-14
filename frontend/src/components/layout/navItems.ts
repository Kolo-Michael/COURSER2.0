// ─── navItems.ts : role-based dashboard navigation definitions ──────────
// Builds the navigation arrays for each role (student / admin / super_admin)
// and resolves the right one at runtime. Nav items are kept here so pages
// don't re-declare their own rails. A student's workspace link is injected
// while a course is open, and otherwise points at the most recently visited
// course so the workspace stays reachable from every dashboard page.
import type { UserRole } from '@/auth/session'
import { getLastCourseSlug } from '@/auth/course'
import type { DashboardNavItem } from './DashboardLayout'

/**
 * Student sidebar — every student-accessible page appears here so the
 * workspace nav never changes between pages. A "Course workspace" entry
 * is injected for the currently open course; when none is explicitly given
 * it falls back to the most recently visited course so the workspace stays
 * visible from any dashboard page (Overview, Streak, Settings, ...).
 */
export function studentNav(activeCourseSlug?: string): DashboardNavItem[] {
  const items: DashboardNavItem[] = [
    { to: '/dashboard', label: 'Overview', iconClass: 'fa-solid fa-gauge' },
    { to: '/courses', label: 'Browse courses', iconClass: 'fa-solid fa-book-open-reader' },
    { to: '/streak', label: 'Learning streak', iconClass: 'fa-solid fa-fire' },
    { to: '/settings', label: 'Settings', iconClass: 'fa-solid fa-gear' },
  ]

  // Prefer the explicit open-course slug; otherwise reuse the last visited
  // course so every dashboard page keeps the workspace entry in the nav.
  const workspaceSlug = activeCourseSlug || getLastCourseSlug()
  if (workspaceSlug) {
    items.splice(2, 0, {
      to: `/courses/${workspaceSlug}`,
      label: 'Course workspace',
      iconClass: 'fa-solid fa-laptop-code',
    })
  }

  return items
}

/** Admin sidebar (also used by super admins when they visit /admin). */
export function adminNav(): DashboardNavItem[] {
  return [
    { to: '/admin', label: 'Course management', iconClass: 'fa-solid fa-chalkboard-user' },
    { to: '/courses', label: 'Preview catalog', iconClass: 'fa-solid fa-eye' },
    { to: '/dashboard', label: 'Student view', iconClass: 'fa-solid fa-gauge' },
    { to: '/settings', label: 'Settings', iconClass: 'fa-solid fa-gear' },
  ]
}

/** Super-admin sidebar. */
export function superAdminNav(): DashboardNavItem[] {
  return [
    { to: '/super-admin', label: 'Overview', iconClass: 'fa-solid fa-gauge-high' },
    { to: '/admin', label: 'Admin workspace', iconClass: 'fa-solid fa-user-shield' },
    { to: '/courses', label: 'Catalog', iconClass: 'fa-solid fa-layer-group' },
    { to: '/dashboard', label: 'Student view', iconClass: 'fa-solid fa-gauge' },
    { to: '/settings', label: 'Settings', iconClass: 'fa-solid fa-gear' },
  ]
}

/**
 * Resolve the correct sidebar for a role. Student pages always use
 * `studentNav`; admin/super-admin use their own full set.
 */
export function navItemsFor(
  role: UserRole,
  activeCourseSlug?: string,
): DashboardNavItem[] {
  if (role === 'super_admin') return superAdminNav()
  if (role === 'admin') return adminNav()
  return studentNav(activeCourseSlug)
}
