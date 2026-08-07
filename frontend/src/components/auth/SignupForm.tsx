import type { FormEvent } from 'react'
import { useState } from 'react'
import { signup } from '@/api/auth'
import { dashboardFor, saveSession } from '@/auth/session'
import { useNavigate } from 'react-router-dom'

export function SignupForm() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const username = String(formData.get('username') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    setError(null)
    setSubmitting(true)

    try {
      // POST /auth/signup — server returns the user + sets auth cookies.
      const response = await signup({
        username,
        email,
        password,
        role: 'student',
      })

      saveSession({
        identifier: response.user.full_name || response.user.username,
        email: response.user.email,
        fullName: response.user.full_name,
        role: response.user.role,
      })

      // Role-based redirect — signup always lands as student for now, but
      // we still go through dashboardFor so admin/super_admin signups would
      // route correctly if you enable those in the future.
      navigate(dashboardFor(response.user.role), { replace: true })
    } catch {
      setError('Could not create this account. Try another email or username.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="signup-username" className="mb-1 block text-sm font-semibold text-stone-700 dark:text-stone-200">
          Username
        </label>
        <input
          id="signup-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          maxLength={50}
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-accent-dark dark:focus:ring-accent-dark/30"
        />
      </div>
      <div>
        <label htmlFor="signup-email" className="mb-1 block text-sm font-semibold text-stone-700 dark:text-stone-200">
          Email
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-accent-dark dark:focus:ring-accent-dark/30"
        />
      </div>
      <div>
        <label htmlFor="signup-password" className="mb-1 block text-sm font-semibold text-stone-700 dark:text-stone-200">
          Password
        </label>
        <div className="relative">
          <input
            id="signup-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
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
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-gradient-to-br from-accent to-accent/80 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:from-accent-dark dark:to-accent"
      >
        {submitting ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  )
}
