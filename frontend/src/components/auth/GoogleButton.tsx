// ─── GoogleButton.tsx : "Sign in with Google" server-redirect link ───────
// Navigates to {API_BASE_URL}/api/auth/google?origin=<current origin>. The
// backend redirects to Google's consent screen, then the callback sets the
// auth cookies and bounces back to /auth?google=success where AuthPage
// resolves the session. A plain anchor (not a fetch) because it's a full-page
// OAuth redirect.
import { API_BASE_URL } from '@/api/client'

// Official Google "G" mark (multicolor), drawn as inline SVG so no external
// asset or CSP exemption is needed.
function GoogleMark() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

/**
 * Full-width Google sign-in button. Keeps the current origin in the URL so
 * the callback returns to this exact deployment (dev or prod project).
 */
export function GoogleButton() {
  const href = `${API_BASE_URL}/api/auth/google?origin=${encodeURIComponent(window.location.origin)}`
  return (
    <a
      href={href}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
    >
      <GoogleMark />
      Sign in with Google
    </a>
  )
}

/** "or" divider used between the Google button and the form below it. */
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 py-1" role="separator" aria-label="or">
      <span className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">or</span>
      <span className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
    </div>
  )
}