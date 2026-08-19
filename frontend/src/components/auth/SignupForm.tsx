// ─── SignupForm.tsx : new-account registration ──────────────────────────
// Creates a student account (username/email/password). Enforces the shared
// password policy client-side (min 8 chars, upper + lower + number) plus a
// repeat-password check. The live password checklist ticks each criterion
// with a green box as it is met, and the form refuses to submit until all
// criteria pass. Email format is validated by emailSchema on the backend;
// the account is verified instantly and issued auth cookies.
import type { FormEvent } from 'react'
import { useState } from 'react'
import { signup } from '@/api/auth'
import { dashboardFor, saveSession } from '@/auth/session'
import { useNavigate } from 'react-router-dom'
import { GoogleButton, AuthDivider } from './GoogleButton'

// Mirrors the backend zod policy: 8+ chars, at least one lowercase, one
// uppercase, and one number.
function passwordIssues(password: string): string[] {
  const issues: string[] = []
  if (password.length < 8) issues.push('at least 8 characters')
  if (!/[a-z]/.test(password)) issues.push('one lowercase letter')
  if (!/[A-Z]/.test(password)) issues.push('one uppercase letter')
  if (!/[0-9]/.test(password)) issues.push('one number')
  return issues
}

/** The criteria list shown under the password field; each one ticks green as it is satisfied. */
function passwordCriteria(password: string): Array<{ label: string; met: boolean }> {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'One number (0-9)', met: /[0-9]/.test(password) },
  ]
}

/** Live checklist under the password field. Ticked items show a green box. */
function PasswordChecklist({ password }: { password: string }) {
  const criteria = passwordCriteria(password)
  return (
    <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2" aria-live="polite">
      {criteria.map((c) => (
        <li
          key={c.label}
          className={`flex items-center gap-2 text-xs ${
            c.met ? 'font-semibold text-green-700 dark:text-green-400' : 'text-stone-500 dark:text-stone-400'
          }`}>
          <span
            aria-hidden
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] transition-colors ${
              c.met
                ? 'border-green-500 bg-green-500 text-white'
                : 'border-stone-300 bg-transparent text-transparent dark:border-stone-600'
            }`}>
            <i className="fa-solid fa-check" />
          </span>
          {c.label}
        </li>
      ))}
    </ul>
  )
}

/** Registration form: validates, submits, then signs the user in (or sends them to verify their email). */
export function SignupForm() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const issues = passwordIssues(password)
  const passwordComplete = issues.length === 0
  const passwordsMatch = confirmPassword === '' || password === confirmPassword

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const username = String(formData.get('username') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()

    // Client-side password policy (matches the backend). The submit button is
    // also disabled until every criterion ticks green, so this is a safety net.
    if (issues.length > 0) {
      setError(`Password needs: ${issues.join(', ')}.`)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
       // POST /auth/signup — creates the account and issues the auth cookies
      // in the same response (email format is validated client-side above).
      // The JSON body also carries the access_token for cross-origin Safari/iOS.
      // Non-test emails return requires_verification → route to the verify-email
      // screen where the 6-digit code completes the signup.
      const response = await signup({
        username,
        email,
        password,
        role: 'student',
      })

      if (response.requires_verification) {
        sessionStorage.setItem('verify_email', response.user.email)
        navigate('/auth?mode=verify-email', { replace: true })
        return
      }

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
    <div className="space-y-4">
      <GoogleButton />
      <AuthDivider />
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
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-primary-dark dark:focus:ring-primary-dark/25"
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
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-primary-dark dark:focus:ring-primary-dark/25"
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
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-3 pr-11 text-stone-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-primary-dark dark:focus:ring-primary-dark/25"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-stone-500 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-stone-400 dark:hover:text-primary-dark dark:focus-visible:outline-primary-dark"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}>
            <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden />
          </button>
        </div>
        <PasswordChecklist password={password} />
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          At least 8 characters, with a lowercase letter, an uppercase letter, and a number.
        </p>
      </div>
      <div>
        <label htmlFor="signup-confirm-password" className="mb-1 block text-sm font-semibold text-stone-700 dark:text-stone-200">
          Repeat password
        </label>
        <div className="relative">
          <input
            id="signup-confirm-password"
            name="confirm-password"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-3 pr-11 text-stone-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-primary-dark dark:focus:ring-primary-dark/25"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((visible) => !visible)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-stone-500 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-stone-400 dark:hover:text-primary-dark dark:focus-visible:outline-primary-dark"
            aria-label={showConfirm ? 'Hide repeat password' : 'Show repeat password'}
            aria-pressed={showConfirm}
          >
            <i className={`fa-solid ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden />
          </button>
        </div>
      </div>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p> : null}
      {!passwordComplete && password.length > 0 ? (
        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
          Finish all the green criteria above to create your account.
        </p>
      ) : null}
      {!passwordsMatch ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">Passwords do not match.</p>
      ) : null}
      <button
        type="submit"
        disabled={submitting || !passwordComplete || !passwordsMatch}
        className="w-full rounded-lg bg-accent-btn py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 dark:bg-accent-dark"
      >
        {submitting ? 'Creating account...' : 'Create account'}
      </button>
      </form>
    </div>
  )
}
