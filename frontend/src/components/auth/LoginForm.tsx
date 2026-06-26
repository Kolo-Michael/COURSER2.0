import type { FormEvent } from 'react'
import { useState } from 'react'
import { login } from '@/api/auth'
import { dashboardFor, saveSession } from '@/auth/session'
import { useNavigate } from 'react-router-dom'

export function LoginForm() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    setError(null)
    setSubmitting(true)

    try {
      // POST /auth/login
      const response = await login(email, password)

      // Access + refresh token handling plug in here.
      // Access token is used for authenticated requests; refresh token lets
      // the client silently renew sessions without forcing the user back to
      // the login screen.
      saveSession({
        identifier: response.user.full_name || response.user.username,
        email: response.user.email,
        fullName: response.user.full_name,
        role: response.user.role,
        token: response.access_token,
        refreshToken: response.refresh_token,
      })

      // Role-based redirect: student → /dashboard, admin → /admin,
      // super_admin → /super-admin.
      navigate(dashboardFor(response.user.role), { replace: true })
    } catch {
      setError('Login failed. Check your email and password, then try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="login-email" className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-accent-dark dark:focus:ring-accent-dark/30"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-11 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-accent-dark dark:focus:ring-accent-dark/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-500 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-accent dark:text-slate-400 dark:hover:text-accent-dark"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden />
          </button>
        </div>
      </div>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-primary-dark"
      >
        {submitting ? 'Logging in...' : 'Log in'}
      </button>
      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Hits <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">/auth/login</code> when the API is available.
      </p>
    </form>
  )
}
