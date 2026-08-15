// ─── VerifyEmailForm.tsx : 6-digit email-verification code ───────────────
// Shown after a real (non-test) signup and after a not-verified login. The
// user types the 6-digit code emailed to them; on success the backend marks
// the account verified and issues the session cookies, so we restore the
// local session and route to the dashboard. Also offers resend + a "use a
// different email" escape hatch back to signup.
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { resendVerification, verifyEmail } from '@/api/auth'
import { dashboardFor, saveSession } from '@/auth/session'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

/** Email-verification form: prefilled email (when passed via ?email=) + code input. */
export function VerifyEmailForm() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    setEmail(params.get('email') ?? '')
  }, [params])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const code = String(formData.get('code') ?? '').trim()

    if (!email) {
      setError('Enter the email address you signed up with.')
      return
    }
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.')
      return
    }

    setError(null)
    setNotice(null)
    setSubmitting(true)

    try {
      // POST /auth/verify-email — on success the backend verifies the
      // account and sets the auth cookies in the same response.
      const response = await verifyEmail({ email, code })

      saveSession({
        identifier: response.user.full_name || response.user.username,
        email: response.user.email,
        fullName: response.user.full_name,
        role: response.user.role,
      })

      navigate(dashboardFor(response.user.role), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify this code. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    if (!email) {
      setError('Enter the email address you signed up with, then resend.')
      return
    }
    setError(null)
    setNotice(null)
    setResending(true)
    try {
      const response = await resendVerification({ email })
      setNotice(response.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="verify-email" className="mb-1 block text-sm font-semibold text-stone-700 dark:text-stone-200">
          Email
        </label>
        <input
          id="verify-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-accent-dark dark:focus:ring-accent-dark/30"
        />
      </div>
      <div>
        <label htmlFor="verify-code" className="mb-1 block text-sm font-semibold text-stone-700 dark:text-stone-200">
          6-digit code
        </label>
        <input
          id="verify-code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          maxLength={6}
          placeholder="000000"
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-center font-mono text-lg tracking-[0.5em] text-stone-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-accent-dark dark:focus:ring-accent-dark/30"
        />
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          We emailed a code to this address. It expires in 1 hour.
        </p>
      </div>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p> : null}
      {notice ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">{notice}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:bg-accent-dark"
      >
        {submitting ? 'Verifying...' : 'Verify email'}
      </button>
      <div className="flex items-center justify-between pt-1 text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-accent hover:underline disabled:opacity-50 dark:text-accent-dark"
        >
          {resending ? 'Sending...' : 'Resend code'}
        </button>
        <Link to="/auth?mode=signup" className="text-stone-500 hover:text-stone-700 hover:underline dark:text-stone-400 dark:hover:text-stone-200">
          Use a different email
        </Link>
      </div>
    </form>
  )
}