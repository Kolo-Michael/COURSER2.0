import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'
import { StudyAnimation } from '@/components/auth/StudyAnimation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Link, useSearchParams } from 'react-router-dom'

export function AuthPage() {
  const [params] = useSearchParams()
  const mode = params.get('mode') === 'signup' ? 'signup' : 'login'

  return (
    <div className="relative min-h-screen">
      <StudyAnimation />

      <header className="relative border-b border-slate-200/60 bg-white/60 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white dark:bg-primary-dark">
              <i className="fa-solid fa-graduation-cap" aria-hidden />
            </span>
            <span className="text-lg text-slate-900 dark:text-white">COURSER</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/courses"
              className="text-sm font-semibold text-slate-700 hover:text-accent dark:text-slate-200 dark:hover:text-accent-dark"
            >
              Browse courses
            </Link>
          </div>
        </div>
      </header>

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2 lg:items-center lg:px-8">
        <section className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent dark:text-accent-dark">
            {mode === 'signup' ? 'Join the campus' : 'Welcome back'}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {mode === 'signup'
              ? 'Create your learner account'
              : 'Pick up where you left off'}
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            {mode === 'signup'
              ? 'Set up your account in seconds — pick a username, drop your email, and start your first course. We will guide the rest.'
              : 'Sign in to continue your courses, track progress, and chat with Cora whenever you get stuck.'}
          </p>

          <div className="grid gap-3 pt-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent dark:bg-accent-dark/15 dark:text-accent-dark">
                <i className="fa-solid fa-user-graduate" aria-hidden />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Students</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Guided paths and progress</p>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary dark:bg-primary-dark/15 dark:text-primary-dark">
                <i className="fa-solid fa-compass" aria-hidden />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Curated paths</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Hand-picked, AI-shaped</p>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent dark:bg-accent-dark/15 dark:text-accent-dark">
                <i className="fa-solid fa-comments" aria-hidden />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Cora, your tutor</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Built into every lesson</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/70 bg-white/85 p-8 shadow-xl shadow-slate-200/40 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/85 dark:shadow-slate-950/40">
          <div className="mb-6 flex rounded-lg bg-slate-100 p-1 text-sm font-semibold dark:bg-slate-800">
            <Link
              to="/auth"
              className={`flex-1 rounded-md py-2 text-center transition ${
                mode === 'login'
                  ? 'bg-white text-accent shadow-sm dark:bg-slate-900 dark:text-accent-dark'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Log in
            </Link>
            <Link
              to="/auth?mode=signup"
              className={`flex-1 rounded-md py-2 text-center transition ${
                mode === 'signup'
                  ? 'bg-white text-accent shadow-sm dark:bg-slate-900 dark:text-accent-dark'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
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