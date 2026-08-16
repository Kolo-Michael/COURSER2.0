// ─── AuthPage: login / signup / reset shell ──────────────────────────────
// A single page driven by the ?mode= query param ("login" default, "signup",
// "forgot-password", "verify-code", "reset-password"). Reads
// the param to pick which auth form to render and to vary the hero copy to
// its left.

import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { VerifyCodeForm } from '@/components/auth/VerifyCodeForm'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { GoogleCallback } from '@/components/auth/GoogleCallback'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Link, useSearchParams } from 'react-router-dom'
// AuthPage: reads ?mode= from the URL and renders the matching auth flow.
// A ?google=success / ?google=error param (set by the OAuth callback
// redirect) takes over the form area while the Google session resolves.
export function AuthPage() {
  const [params, setParams] = useSearchParams()
  const mode = params.get('mode')
  const google = params.get('google')

  // Mode flags: no param means login. "reset-password" is the fallback,
  // reached via the logged-out flow after verify-code confirms an email.
  const isLogin = mode === 'login' || !mode
  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot-password'
  const isVerify = mode === 'verify-code'

  // Switch between login/signup tabs via search params (no full navigation),
  // so form fields stay populated when the user toggles back and forth.
  function switchMode(newMode: string) {
    params.set('mode', newMode)
    setParams(params)
  }

  // Static copy per auth flow, shown in the left hero column.
  const pageConfig = {
    login: {
      title: 'Welcome back',
      subtitle: 'Pick up where you left off',
      description: 'Sign in to continue your courses, track progress, and chat with Cora whenever you get stuck.',
    },
    signup: {
      title: 'Create your learner account',
      subtitle: 'Join the campus',
      description: 'Set up your account in seconds — pick a username, drop your email, and start your first course.',
    },
    'forgot-password': {
      title: 'Reset your password',
      subtitle: 'Forgot password?',
      description: 'Enter your email and we\'ll send you a 6-digit code to reset your password.',
    },
    'verify-code': {
      title: 'Verify your code',
      subtitle: 'Check your email',
      description: 'Enter the 6-digit code sent to your email address.',
    },
    'reset-password': {
      title: 'Set new password',
      subtitle: 'Reset password',
      description: 'Enter your new password below.',
    },
  }

  // Resolve the flags above to the matching hero-copy entry.
  const config = pageConfig[isLogin ? 'login' : isSignup ? 'signup' : isForgot ? 'forgot-password' : isVerify ? 'verify-code' : 'reset-password']

  return (
    <div className="courser-bg-dots relative min-h-screen overflow-hidden bg-stone-50 dark:bg-stone-950">
      {/* Skip-to-content link for keyboard / screen-reader users (WCAG 2.4.1). */}
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {/* decorative background elements — larger, more spaced out */}
      <div className="pointer-events-none absolute inset-0 select-none" aria-hidden>
        <i className="fa-solid fa-book-open absolute left-[5%] top-[12%] text-[180px] text-stone-200/50 dark:text-stone-800/35" />
        <i className="fa-solid fa-lightbulb absolute right-[8%] top-[18%] text-[140px] text-stone-200/50 dark:text-stone-800/35" />
        <i className="fa-solid fa-pen-fancy absolute bottom-[15%] left-[3%] text-[120px] text-stone-200/50 dark:text-stone-800/35" />
        <i className="fa-solid fa-graduation-cap absolute bottom-[22%] right-[4%] text-[160px] text-stone-200/50 dark:text-stone-800/35" />
        <i className="fa-solid fa-robot absolute top-[48%] left-[15%] text-[90px] text-stone-200/50 dark:text-stone-800/35" />
        <i className="fa-solid fa-comments absolute top-[6%] right-[28%] text-[70px] text-stone-200/50 dark:text-stone-800/35" />
      </div>

      <header className="relative border-b border-stone-200 bg-white/80 backdrop-blur-sm dark:border-stone-800 dark:bg-stone-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white dark:bg-primary-dark">
              <i className="fa-solid fa-graduation-cap" aria-hidden />
            </span>
            <span className="text-lg text-stone-900 dark:text-stone-100">COURSER</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main
        id="main-content"
        className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:px-8"
      >
        <section className="space-y-5">
         <p className="text-sm font-semibold uppercase tracking-wide text-stone-800 dark:text-stone-200">
             {config.subtitle}
           </p>
          <h1 className="text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 sm:text-5xl">
            {config.title}
          </h1>
          <p className="text-lg leading-relaxed text-stone-600 dark:text-stone-400">
            {config.description}
          </p>
          {(isLogin || isSignup) && (
            <div className="flex flex-wrap gap-6 pt-4">
              <span className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                <i className="fa-solid fa-circle-check text-primary dark:text-primary-dark" /> Free courses
              </span>
              <span className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                <i className="fa-solid fa-circle-check text-primary dark:text-primary-dark" /> AI tutor
              </span>
              <span className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                <i className="fa-solid fa-circle-check text-primary dark:text-primary-dark" /> Learn at your pace
              </span>
            </div>
          )}
        </section>

        <section className="courser-card relative p-8 shadow-lg ring-1 ring-primary/5 dark:ring-primary-dark/5">
          {/* Tab switcher only for login/signup modes; other flows are single-step.
              Uses buttons (not <Link>) so the forms don't unmount/remount, which
              preserves user input when toggling back and forth. */}
          {(isLogin || isSignup) && (
            <div className="mb-6 flex rounded-lg bg-stone-100 p-1 text-sm font-semibold dark:bg-stone-800">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 rounded-md py-2 text-center transition ${
                  isLogin
                    ? 'bg-white text-stone-800 shadow-sm dark:bg-stone-900 dark:text-stone-100'
                    : 'text-stone-600 hover:text-stone-900 dark:text-stone-300'
                }`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 rounded-md py-2 text-center transition ${
                  isSignup
                    ? 'bg-white text-stone-800 shadow-sm dark:bg-stone-900 dark:text-stone-100'
                    : 'text-stone-600 hover:text-stone-900 dark:text-stone-300'
                }`}
              >
                Sign up
              </button>
            </div>
          )}
          {/* Google OAuth handoff takes over the card; otherwise render the form matching the current mode. */}
          {google ? (
            <GoogleCallback status={google === 'success' ? 'success' : 'error'} reason={params.get('reason')} />
          ) : isLogin ? <LoginForm /> : isSignup ? <SignupForm /> : isForgot ? <ForgotPasswordForm /> : isVerify ? <VerifyCodeForm /> : <ResetPasswordForm />}
        </section>
      </main>
    </div>
  )
}
