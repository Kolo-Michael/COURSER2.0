// ─── ResetPasswordForm.tsx : final step of the password-reset flow ──────
// Takes the new password after the code was verified. Requires the email
// and code carried over in sessionStorage from the prior steps, validates
// confirmation + minimum length, then resets and returns to login.
import type { FormEvent } from 'react'
import { useState, useEffect } from 'react'
import { resetPassword } from '@/api/auth'
import { useNavigate } from 'react-router-dom'

/** Step 3: choose + confirm a new password, then redirect to login. */
export function ResetPasswordForm() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Get verified email from sessionStorage
  const email = sessionStorage.getItem('verified_reset_email')

  // Redirect to verify code if no verified email
  useEffect(() => {
    if (!email) {
      navigate('/auth?mode=verify-code', { replace: true })
    }
  }, [email, navigate])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newPassword = String(formData.get('new_password') ?? '')
    const confirmPassword = String(formData.get('confirm_password') ?? '')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (!email) {
      setError('Session expired. Please start over.')
      return
    }

    // Get the code from sessionStorage (we need to store it from verify step)
    const code = sessionStorage.getItem('reset_code')
    if (!code) {
      setError('Session expired. Please start over.')
      return
    }

    setError(null)
    setSuccess(null)
    setSubmitting(true)

    try {
      await resetPassword({ email, code, new_password: newPassword })
      setSuccess('Password reset successfully. Redirecting to login...')
      // Clean up sessionStorage
      sessionStorage.removeItem('reset_email')
      sessionStorage.removeItem('verified_reset_email')
      sessionStorage.removeItem('reset_code')
      // Redirect to login
      setTimeout(() => {
        navigate('/auth?mode=login', { replace: true })
      }, 2000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password. Please try again.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!email) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Enter your new password for <strong>{email}</strong>
      </p>
      <div>
        <label htmlFor="reset-password" className="mb-1 block text-sm font-semibold text-stone-700 dark:text-stone-200">
          New Password
        </label>
        <div className="relative">
          <input
            id="reset-password"
            name="new_password"
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
      <div>
        <label htmlFor="reset-confirm-password" className="mb-1 block text-sm font-semibold text-stone-700 dark:text-stone-200">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            id="reset-confirm-password"
            name="confirm_password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-3 pr-11 text-stone-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-accent-dark dark:focus:ring-accent-dark/30"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((visible) => !visible)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-stone-500 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-accent dark:text-stone-400 dark:hover:text-accent-dark"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showConfirmPassword}
          >
            <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden />
          </button>
        </div>
      </div>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
          {success}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:bg-accent-dark"
      >
        {submitting ? 'Resetting password...' : 'Reset password'}
      </button>
      <p className="text-center text-sm text-stone-600 dark:text-stone-400">
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem('reset_email')
            sessionStorage.removeItem('verified_reset_email')
            sessionStorage.removeItem('reset_code')
            navigate('/auth?mode=login', { replace: true })
          }}
          className="text-accent hover:underline dark:text-accent-dark"
        >
          Back to login
        </button>
      </p>
    </form>
  )
}