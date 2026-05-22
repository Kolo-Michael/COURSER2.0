import type { FormEvent } from 'react'
import { useState } from 'react'
import { register } from '@/api/auth'
import { roleDashboards, saveSession } from '@/auth/session'
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
      const user = await register({
        username,
        email,
        password,
        role: 'student',
      })
      saveSession({
        identifier: user.full_name || user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      })
      navigate(roleDashboards[user.role], { replace: true })
    } catch {
      setError('Could not create this account. Try another email or username.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="signup-username" className="mb-1 block text-sm font-semibold text-slate-700">
          Username
        </label>
        <input
          id="signup-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          maxLength={50}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label htmlFor="signup-email" className="mb-1 block text-sm font-semibold text-slate-700">
          Email
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label htmlFor="signup-password" className="mb-1 block text-sm font-semibold text-slate-700">
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
            className="w-full rounded-lg border border-slate-200 py-2 pl-3 pr-11 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-500 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-primary"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden />
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Use 8+ characters with upper, lower, and a digit (AUTH-2).
        </p>
      </div>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {submitting ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  )
}
