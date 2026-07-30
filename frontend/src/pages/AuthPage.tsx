import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Link, useSearchParams } from 'react-router-dom'

export function AuthPage() {
  const [params] = useSearchParams()
  const mode = params.get('mode') === 'signup' ? 'signup' : 'login'

  return (
    <div className="courser-bg-dots relative min-h-screen overflow-hidden bg-stone-50 dark:bg-stone-950">
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

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:px-8">
        <section className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent dark:text-accent-dark">
            {mode === 'signup' ? 'Join the campus' : 'Welcome back'}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 sm:text-5xl">
            {mode === 'signup'
              ? 'Create your learner account'
              : 'Pick up where you left off'}
          </h1>
          <p className="text-lg leading-relaxed text-stone-600 dark:text-stone-400">
            {mode === 'signup'
              ? 'Set up your account in seconds — pick a username, drop your email, and start your first course.'
              : 'Sign in to continue your courses, track progress, and chat with Cora whenever you get stuck.'}
          </p>
          <div className="flex flex-wrap gap-6 pt-4">
            <span className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
              <i className="fa-solid fa-circle-check text-accent dark:text-accent-dark" /> Free courses
            </span>
            <span className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
              <i className="fa-solid fa-circle-check text-accent dark:text-accent-dark" /> AI tutor
            </span>
            <span className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
              <i className="fa-solid fa-circle-check text-accent dark:text-accent-dark" /> Learn at your pace
            </span>
          </div>
        </section>

        <section className="courser-card relative p-8 shadow-lg ring-1 ring-primary/5 dark:ring-primary-dark/5">
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
