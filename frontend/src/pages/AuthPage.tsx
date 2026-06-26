import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'
import { StudyAnimation } from '@/components/auth/StudyAnimation'
import { Link, useSearchParams } from 'react-router-dom'

export function AuthPage() {
  const [params] = useSearchParams()
  const mode = params.get('mode') === 'signup' ? 'signup' : 'login'

  return (
    <div className="relative min-h-screen">
      <StudyAnimation />

      <header className="relative border-b border-slate-200/60 bg-white/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <i className="fa-solid fa-graduation-cap" aria-hidden />
            </span>
            <span className="text-lg text-slate-900">COURSER</span>
          </Link>
          <Link
            to="/courses"
            className="text-sm font-semibold text-slate-700 hover:text-accent"
          >
            Browse courses
          </Link>
        </div>
      </header>

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2 lg:items-center lg:px-8">
        <section className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            {mode === 'signup' ? 'Join the campus' : 'Welcome back'}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {mode === 'signup'
              ? 'Create your learner account'
              : 'Pick up where you left off'}
          </h1>
          <p className="text-slate-600">
            {mode === 'signup'
              ? 'Set up your account in seconds — pick a username, drop your email, and start your first course. We will guide the rest.'
              : 'Sign in to continue your courses, track progress, and chat with Cora whenever you get stuck.'}
          </p>

          <div className="grid gap-3 pt-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <i className="fa-solid fa-user-graduate" aria-hidden />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">Students</p>
              <p className="mt-1 text-xs text-slate-500">Guided paths and progress</p>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <i className="fa-solid fa-compass" aria-hidden />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">Curated paths</p>
              <p className="mt-1 text-xs text-slate-500">Hand-picked, AI-shaped</p>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                <i className="fa-solid fa-comments" aria-hidden />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">Cora, your tutor</p>
              <p className="mt-1 text-xs text-slate-500">Built into every lesson</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/70 bg-white/85 p-8 shadow-xl shadow-slate-200/40 backdrop-blur">
          <div className="mb-6 flex rounded-lg bg-slate-100 p-1 text-sm font-semibold">
            <Link
              to="/auth"
              className={`flex-1 rounded-md py-2 text-center transition ${
                mode === 'login' ? 'bg-white text-accent shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Log in
            </Link>
            <Link
              to="/auth?mode=signup"
              className={`flex-1 rounded-md py-2 text-center transition ${
                mode === 'signup' ? 'bg-white text-accent shadow-sm' : 'text-slate-600 hover:text-slate-900'
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