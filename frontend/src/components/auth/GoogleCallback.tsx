// ─── GoogleCallback.tsx : post-OAuth handoff on /auth?google=… ───────────
// After the backend's Google callback redirects back to /auth?google=success,
// this resolves the freshly-set session via GET /auth/me (the cross-origin
// cookies aren't visible to document.cookie, but are sent with credentials),
// persists it for getSession(), and routes to the role dashboard. Error
// statuses render a human-readable banner instead of a raw failure.
//
// Cross-origin Safari/iOS fallback: the backend also embeds the short-lived
// access_token in the URL fragment (#access_token=…). The SPA reads it, saves
// it in a same-origin cookie, and sends it as a Bearer header so /auth/me and
// subsequent API calls work even when ITP blocks the backend's HttpOnly cookies.
import { useEffect, useState } from 'react'
import { getMe } from '@/api/auth'
import { dashboardFor, saveSession, getSession } from '@/auth/session'
import { Link, useNavigate } from 'react-router-dom'

const reasonMessages: Record<string, string> = {
  config: "Google sign-in isn't configured on the server yet. Please use email and password for now.",
  denied: "You cancelled Google sign-in. No changes were made.",
  state: "Google sign-in expired or didn't validate. Please try again.",
  email: "Google couldn't confirm that email is verified. Please sign up with email and password instead.",
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
        {message}
      </p>
      <Link
        to="/auth"
        className="block w-full rounded-lg bg-primary py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:brightness-110 dark:bg-primary-dark"
      >
        Back to log in
      </Link>
    </div>
  )
}

/** Handles the ?google=success / ?google=error return from the OAuth callback. */
export function GoogleCallback({ status, reason }: { status: 'success' | 'error'; reason: string | null }) {
  const navigate = useNavigate()
  const [failed, setFailed] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'success') return
    let active = true

    // The backend may embed the access_token in the URL fragment for
    // cross-origin Safari/iOS (where HttpOnly cookies are blocked by ITP).
    // Read it, strip the hash from the URL, and save it in a same-origin
    // cookie so the Authorization header works for subsequent API calls.
    const hash = window.location.hash
    const tokenMatch = hash.match(/access_token=([^&]+)/)
    if (tokenMatch) {
      const accessToken = decodeURIComponent(tokenMatch[1])
      // Clean the URL bar — remove the fragment without triggering navigation.
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      // Save a partial session with the token so getSession().accessToken
      // is available when getMe() fires below (apiRequest adds the Bearer header).
      const existing = getSession() ?? { identifier: '', role: 'student' as const }
      saveSession({ ...existing, accessToken })
    }

    getMe()
      .then((user) => {
        if (!active) return
        // Persist the full session on this origin so ProtectedRoute/getSession()
        // see it even though the auth cookies live on the API origin.
        saveSession({
          identifier: user.full_name || user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          avatarUrl: user.avatar_url ?? undefined,
          navStyle: user.nav_style,
          navCollapsed: user.nav_collapsed,
          accessToken: tokenMatch ? decodeURIComponent(tokenMatch[1]) : undefined,
        })
        navigate(dashboardFor(user.role), { replace: true })
      })
      .catch(() => {
        if (active) setFailed("We couldn't complete your Google sign-in. Please try again.")
      })
    return () => {
      active = false
    }
  }, [status, navigate])

  if (status === 'error') {
    return <ErrorBox message={reasonMessages[reason ?? ''] ?? "Google sign-in didn't complete. Please try again."} />
  }
  if (failed) return <ErrorBox message={failed} />

  return (
    <div className="space-y-4">
      <p className="flex items-center justify-center gap-2 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600 dark:bg-stone-800 dark:text-stone-300">
        <i className="fa-solid fa-spinner fa-spin text-xs" aria-hidden />
        Signing you in with Google…
      </p>
      <Link to="/auth" className="block text-center text-sm text-stone-500 hover:text-stone-700 hover:underline dark:text-stone-400 dark:hover:text-stone-200">
        Cancel
      </Link>
    </div>
  )
}