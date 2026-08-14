// ─── course.ts : last-visited course tracking ──────────────────────────────
// Remembers which course the user last worked in (by slug) so the dashboard
// keeps a persistent "Course workspace" entry that jumps straight back into
// the most recent course from any dashboard page. Stored in localStorage —
// no network round-trip needed to render the nav.

const LAST_COURSE_KEY = 'courser.lastCourse'

export function getLastCourseSlug(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(LAST_COURSE_KEY)
  } catch {
    return null
  }
}

export function rememberCourseSlug(slug: string) {
  if (!slug || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LAST_COURSE_KEY, slug)
  } catch {
    // Ignore quota/private-mode failures — the workspace still works.
  }
}