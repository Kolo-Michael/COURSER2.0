// ─── LoginForm.tsx : email/username + password sign-in ───────────────────
// Submits credentials to the backend (tokens land in HttpOnly cookies),
// refreshes the local session state, then redirects to the role-specific
// dashboard. Includes show/hide password, "remember me" (longer-lived
// refresh cookie), the forgot-password entry point, and a "verify your
// email" detour when the account hasn't been verified yet.
import type { FormEvent } from 'react'
import { useState } from 'react'
import { login } from '@/api/auth'
import { ApiRequestError } from '@/api/client'
import { dashboardFor, saveSession } from '@/auth/session'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { GoogleButton, AuthDivider } from './GoogleButton'

/** Sign-in form: authenticates, restores session state, routes by role. */
export function LoginForm() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const identifier = String(formData.get('identifier') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    setError(null)
    setSubmitting(true)

    try {
      // POST /auth/login — server returns only the user; tokens live in
      // HttpOnly cookies set as part of the same response. `identifier`
      // accepts an email address or a username.
      const response = await login(identifier, password, rememberMe)

      // Trigger getSession() to read the freshly set courser_session cookie
      // so the next render sees an authenticated state.
      saveSession({
        identifier: response.user.full_name || response.user.username,
        email: response.user.email,
        fullName: response.user.full_name,
        role: response.user.role,
      })

      // Role-based redirect: student → /dashboard, admin → /admin,
      // super_admin → /super-admin.
      navigate(dashboardFor(response.user.role), { replace: true })
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 403) {
        // Credentials were correct but the email isn't verified yet — the
        // backend includes the account email so we can prefill the code
        // screen even when the user logged in with a username.
        const email = (err as ApiRequestError & { email?: string }).email
        navigate(`/auth?mode=verify-email${email ? `&email=${encodeURIComponent(email)}` : ''}`, { replace: true })
        return
      }
      setError(err instanceof Error ? err.message : 'Login failed. Check your email and password, then try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <GoogleButton />
      <AuthDivider />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-identifier" className="mb-1 block text-sm font-semibold text-stone-700 dark:text-stone-200">
            Email or username
          </label>
        <input
          id="login-identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-accent-dark dark:focus:ring-accent-dark/30"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="mb-1 block text-sm font-semibold text-stone-700 dark:text-stone-200">
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-3 pr-11 text-stone-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-accent-dark dark:focus:ring-accent-dark/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-stone-500 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-accent dark:text-stone-400 dark:hover:text-accent-dark"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-stone-300 text-accent focus:ring-accent h-4 w-4"
          />
          Remember me
        </label>
        <Link
          to="/auth?mode=forgot-password"
          className="text-sm text-accent hover:underline dark:text-accent-dark"
        >
          Forgot password?
        </Link>
      </div>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-primary-dark"
      >
        {submitting ? 'Logging in...' : 'Log in'}
      </button>
      </form>
    </div>
  )
}
