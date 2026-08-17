// ─── ForgotPasswordForm.tsx : step 1 of the password-reset flow ─────────
// Collects the user's email and requests a 6-digit reset code. The email is
// stashed in sessionStorage for the next step (verify code), then the mode
// query param switches to the verify-code form.
import type { FormEvent } from 'react'
import { useState } from 'react'
import { forgotPassword } from '@/api/auth'
import { useNavigate } from 'react-router-dom'

/** Step 1: email input -> sends reset code -> redirects to code entry. */
export function ForgotPasswordForm() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = String(formData.get('email') ?? '').trim()

    setError(null)
    setSuccess(null)
    setSubmitting(true)

    try {
      await forgotPassword({ email })
      setSuccess('If an account exists for that email, a reset code has been sent.')
      // Store email in sessionStorage for the next step
      sessionStorage.setItem('reset_email', email)
      // Redirect to verify code page after a short delay
      setTimeout(() => {
        navigate('/auth?mode=verify-code', { replace: true })
      }, 2000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset code. Please try again.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Enter your email address and we&apos;ll send you a 6-digit code to reset your password.
      </p>
      <div>
        <label htmlFor="forgot-email" className="mb-1 block text-sm font-semibold text-stone-700 dark:text-stone-200">
          Email
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-primary-dark dark:focus:ring-primary-dark/25"
        />
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
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-primary-dark"
      >
        {submitting ? 'Sending code...' : 'Send reset code'}
      </button>
      <p className="text-center text-sm text-stone-600 dark:text-stone-400">
        <button
          type="button"
          onClick={() => navigate('/auth?mode=login', { replace: true })}
           className="text-primary hover:underline dark:text-primary-dark"
        >
          Back to login
        </button>
      </p>
    </form>
  )
}