import type { FormEvent } from 'react'
import { useState, useEffect } from 'react'
import { verifyCode, forgotPassword } from '@/api/auth'
import { useNavigate } from 'react-router-dom'

export function VerifyCodeForm() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [resendDisabled, setResendDisabled] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  // Get email from sessionStorage
  const email = sessionStorage.getItem('reset_email')

  // Redirect to forgot password if no email
  useEffect(() => {
    if (!email) {
      navigate('/auth?mode=forgot-password', { replace: true })
    }
  }, [email, navigate])

  // Handle resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else {
      setResendDisabled(false)
    }
  }, [resendTimer])

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value) || value.length > 1) return
    const newDigits = [...codeDigits]
    newDigits[index] = value
    setCodeDigits(newDigits)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }

    // Clear error when user starts typing
    if (error) setError(null)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newDigits = pasted.split('').padEnd(6, '')
    setCodeDigits(newDigits)
    // Focus the last filled input or the next empty one
    const lastIndex = newDigits.findIndex((d) => !d)
    const focusIndex = lastIndex === -1 ? 5 : lastIndex
    const input = document.getElementById(`code-${focusIndex}`)
    input?.focus()
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const code = codeDigits.join('')

    if (code.length !== 6) {
      setError('Please enter the 6-digit code.')
      return
    }

    if (!email) {
      setError('Session expired. Please request a new code.')
      return
    }

    setError(null)
    setSuccess(null)
    setSubmitting(true)

    try {
      const response = await verifyCode({ email, code })
      setSuccess(response.message)
      // Store verified email and code for reset password step
      sessionStorage.setItem('verified_reset_email', email)
      sessionStorage.setItem('reset_code', code)
      // Redirect to reset password page
      setTimeout(() => {
        navigate('/auth?mode=reset-password', { replace: true })
      }, 1500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid code. Please try again.'
      setError(message)
      // Clear code on error
      setCodeDigits(['', '', '', '', '', ''])
      document.getElementById('code-0')?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!email || resendDisabled) return
    setError(null)
    setSuccess(null)
    try {
      await forgotPassword({ email })
      setSuccess('A new code has been sent.')
      setResendDisabled(true)
      setResendTimer(60) // 60 seconds cooldown
      setCodeDigits(['', '', '', '', '', ''])
      document.getElementById('code-0')?.focus()
    } catch {
      setError('Failed to resend code. Please try again.')
    }
  }

  // Need to import forgotPassword for resend
  const { forgotPassword } = await import('@/api/auth')

  if (!email) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Enter the 6-digit code sent to <strong>{email}</strong>
      </p>
      <div className="flex gap-2 justify-center" role="group" aria-label="6-digit verification code">
        {codeDigits.map((digit, index) => (
          <input
            key={index}
            id={`code-${index}`}
            type="text"
            value={digit}
            onChange={(e) => handleCodeChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            maxLength={1}
            autoComplete="one-time-code"
            inputMode="numeric"
            className="w-10 h-12 text-center text-2xl font-semibold rounded-lg border border-stone-200 bg-white text-stone-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-accent-dark dark:focus:ring-accent-dark/30"
            aria-label={`Code digit ${index + 1}`}
          />
        ))}
      </div>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300 text-center">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300 text-center">
          {success}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting || codeDigits.some((d) => !d)}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Verifying...' : 'Verify code'}
      </button>
      <p className="text-center text-sm text-stone-600 dark:text-stone-400">
        Didn&apos;t receive the code?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendDisabled}
          className="text-accent hover:underline dark:text-accent-dark disabled:text-stone-400 dark:disabled:text-stone-500"
        >
          {resendDisabled ? `Resend in ${resendTimer}s` : 'Resend code'}
        </button>
      </p>
      <p className="text-center text-sm text-stone-600 dark:text-stone-400">
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem('reset_email')
            navigate('/auth?mode=forgot-password', { replace: true })
          }}
          className="text-accent hover:underline dark:text-accent-dark"
        >
          Change email
        </button>
      </p>
    </form>
  )
}