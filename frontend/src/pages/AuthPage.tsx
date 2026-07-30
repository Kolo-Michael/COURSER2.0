import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Link, useSearchParams } from 'react-router-dom'

export function AuthPage() {
  const [params] = useSearchParams()
  const mode = params.get('mode') === 'signup' ? 'signup' : 'login'

  // Top bar is intentionally minimal: just the COURSER mark on the left
  // and the ThemeToggle on the right. No "Browse courses" link, no nav.
  // The body bg from index.css provides the single solid surface.
  return (
    <div className="relative min-h-screen">
      <header className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
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

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2 lg:items-center lg:px-8">
        <section className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent dark:text-accent-dark">
            {mode === 'signup' ? 'Join the campus' : 'Welcome back'}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
            {mode === 'signup'
              ? 'Create your learner account'
              : 'Pick up where you left off'}
          </h1>
          <p className="text-stone-600 dark:text-stone-400">
            {mode === 'signup'
              ? 'Set up your account in seconds — pick a username, drop your email, and start your first course.'
              : 'Sign in to continue your courses, track progress, and chat with Cora whenever you get stuck.'}
          </p>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <div className="mb-6 flex rounded-lg bg-stone-100 p-1 text-sm font-semibold dark:bg-stone-800">
            <Link
              to="/auth"
              className={`flex-1 rounded-md py-2 text-center transition ${
                mode === 'login'
                  ? 'bg-white text-accent shadow-sm dark:bg-stone-900 dark:text-accent-dark'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white'
              }`}
            >
              Log in
            </Link>
            <Link
              to="/auth?mode=signup"
              className={`flex-1 rounded-md py-2 text-center transition ${
                mode === 'signup'
                  ? 'bg-white text-accent shadow-sm dark:bg-stone-900 dark:text-accent-dark'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white'
              }`}
            >
              Sign up
            </Link>
          </div>
          {mode === 'login' ? <LoginForm /> : <SignupForm />}
        </section>
      </div>
    </div>
  )
}
