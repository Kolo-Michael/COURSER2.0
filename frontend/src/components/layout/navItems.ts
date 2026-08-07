import type { UserRole } from '@/auth/session'
import type { DashboardNavItem } from './DashboardLayout'

/**
 * Student sidebar — every student-accessible page appears here so the
 * workspace nav never changes between pages. The course workspace entry
 * is only rendered once a course is actually open (a slug is available).
 */
export function studentNav(activeCourseSlug?: string): DashboardNavItem[] {
  const items: DashboardNavItem[] = [
    { to: '/dashboard', label: 'Overview', iconClass: 'fa-solid fa-gauge' },
    { to: '/courses', label: 'Browse courses', iconClass: 'fa-solid fa-book-open-reader' },
    { to: '/streak', label: 'Learning streak', iconClass: 'fa-solid fa-fire' },
  ]

  if (activeCourseSlug) {
    items.splice(2, 0, {
      to: `/courses/${activeCourseSlug}`,
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
  ]
}

/** Super-admin sidebar. */
export function superAdminNav(): DashboardNavItem[] {
  return [
    { to: '/super-admin', label: 'Overview', iconClass: 'fa-solid fa-gauge-high' },
    { to: '/admin', label: 'Admin workspace', iconClass: 'fa-solid fa-user-shield' },
    { to: '/courses', label: 'Catalog', iconClass: 'fa-solid fa-layer-group' },
    { to: '/dashboard', label: 'Student view', iconClass: 'fa-solid fa-gauge' },
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
