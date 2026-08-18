// ─── VerifyEmailForm.tsx : post-signup email verification ───────────────
// Shows right after signup for non-test accounts: six digit inputs that
// auto-advance/rewind, accept pasted codes, and call /auth/verify-email. On
// success the backend issues the session cookies and we save the session +
// route to the dashboard. Includes a 60s-cooldown resend. The email is read
// from sessionStorage (set by SignupForm).

import type { FormEvent } from 'react'
import { useState, useEffect } from 'react'
import { verifyEmail, resendVerification } from '@/api/auth'
import { dashboardFor, saveSession } from '@/auth/session'
import { useNavigate } from 'react-router-dom'

export function VerifyEmailForm() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [resendDisabled, setResendDisabled] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  const email = sessionStorage.getItem('verify_email')

  // Redirect to signup if no email (page reached out of flow).
  useEffect(() => {
    if (!email) {
      navigate('/auth?mode=signup', { replace: true })
    }
  }, [email, navigate])

  // Resend cooldown timer.
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000)
      return () => clearInterval(timer)
    }
    setResendDisabled(false)
  }, [resendTimer])

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value) || value.length > 1) return
    const newDigits = [...codeDigits]
    newDigits[index] = value
    setCodeDigits(newDigits)
    if (value && index < 5) {
      document.getElementById(`vcode-${index + 1}`)?.focus()
    }
    if (error) setError(null)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      document.getElementById(`vcode-${index - 1}`)?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newDigits = pasted.split('')
    while (newDigits.length < 6) newDigits.push('')
    setCodeDigits(newDigits)
    const lastIndex = newDigits.findIndex((d) => !d)
    const focusIndex = lastIndex === -1 ? 5 : lastIndex
    document.getElementById(`vcode-${focusIndex}`)?.focus()
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const code = codeDigits.join('')
    if (code.length !== 6) {
      setError('Please enter the 6-digit code.')
      return
    }
    if (!email) {
      setError('Session expired. Please sign up again.')
      return
    }
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      const response = await verifyEmail({ email, code })
      setSuccess('Email verified — taking you to your dashboard…')
      saveSession({
        identifier: response.user.full_name || response.user.username,
        email: response.user.email,
        fullName: response.user.full_name,
        role: response.user.role,
        avatarUrl: response.user.avatar_url ?? undefined,
        navStyle: response.user.nav_style,
        navCollapsed: response.user.nav_collapsed,
        accessToken: response.access_token,
      })
      sessionStorage.removeItem('verify_email')
      setTimeout(() => navigate(dashboardFor(response.user.role), { replace: true }), 1200)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid code. Please try again.'
      setError(message)
      setCodeDigits(['', '', '', '', '', ''])
      document.getElementById('vcode-0')?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!email || resendDisabled) return
    setError(null)
    setSuccess(null)
    try {
      await resendVerification(email)
      setSuccess('A new code has been sent.')
      setResendDisabled(true)
      setResendTimer(60)
      setCodeDigits(['', '', '', '', '', ''])
      document.getElementById('vcode-0')?.focus()
    } catch {
      setError('Failed to resend code. Please try again.')
    }
  }

  if (!email) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Enter the 6-digit code sent to <strong>{email}</strong>
      </p>
      <div className="flex justify-center gap-2" role="group" aria-label="6-digit verification code">
        {codeDigits.map((digit, index) => (
          <input
            key={index}
            id={`vcode-${index}`}
            type="text"
            value={digit}
            onChange={(e) => handleCodeChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            maxLength={1}
            autoComplete="one-time-code"
            inputMode="numeric"
            className="h-12 w-10 rounded-lg border border-stone-200 bg-white text-center text-2xl font-semibold text-stone-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-primary-dark dark:focus:ring-primary-dark/25"
            aria-label={`Code digit ${index + 1}`}
          />
        ))}
      </div>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-center text-sm font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
          {success}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting || codeDigits.some((d) => !d)}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Verifying…' : 'Verify email'}
      </button>
      <p className="text-center text-sm text-stone-600 dark:text-stone-400">
        Didn&apos;t receive the code?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendDisabled}
          className="text-primary hover:underline dark:text-primary-dark disabled:text-stone-400 dark:disabled:text-stone-500"
        >
          {resendDisabled ? `Resend in ${resendTimer}s` : 'Resend code'}
        </button>
      </p>
      <p className="text-center text-sm text-stone-600 dark:text-stone-400">
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem('verify_email')
            navigate('/auth?mode=signup', { replace: true })
          }}
          className="text-primary hover:underline dark:text-primary-dark"
        >
          Use a different email
        </button>
      </p>
    </form>
  )
}